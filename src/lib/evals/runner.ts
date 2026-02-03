// Load environment variables from .env.local
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

import { generateContrarian, ContrarianContext, AlignmentScores, ContrarianOutput } from '../contrarian';
import { gatherGovernmentData } from '../government';
import { detectQuestionType, generateQuestionResponse } from '../contrarian/question-handler';
import { CONTRARIAN_DATASET, EvalCase } from './datasets/contrarian';
import { EDUCATIONAL_RESPONSES_DATASET } from './datasets/educational-responses';
import { scoreFaithfulness } from './scorers/faithfulness';
import { scoreRelevancyAndFollowUp, scoreRelevancyAndAlignment } from './scorers/relevancy';

interface EvalResult {
  caseId: string;
  topic: string;
  userStance: string;
  passed: boolean;
  scores: {
    faithfulness: number | null; // null means skipped (no government data)
    relevancy: number;
    alignmentAccuracy: number | null; // null means skipped (educational response)
  };
  criteria: {
    responseTypeMatches?: boolean;
    acknowledgmentPresent?: boolean;
    supportingStatPresent?: boolean;
    challengingStatPresent?: boolean;
    analysisPresent?: boolean;
    keyStatisticsPresent?: boolean;
    probingQuestionsPresent?: boolean;
    aiNoStanceMessage?: boolean;
    followUpRelevant?: boolean;
    sourcesValid: boolean;
    alignmentUpdated?: boolean;
  };
  error?: string;
  response?: any;
}

interface EvalSummary {
  total: number;
  passed: number;
  failed: number;
  averageScores: {
    faithfulness: number;
    relevancy: number;
    alignmentAccuracy: number;
  };
  results: EvalResult[];
}

/**
 * Validates that sources are valid URLs
 */
function validateSources(sources: Array<{ number: number; name: string; url: string }>): boolean {
  if (!sources || sources.length === 0) {
    return false;
  }

  try {
    return sources.every(source => {
      const url = new URL(source.url);
      return url.protocol === 'http:' || url.protocol === 'https:';
    });
  } catch {
    return false;
  }
}

/**
 * Checks if alignment scores updated correctly
 */
function checkAlignmentUpdated(
  initialScores: AlignmentScores,
  updatedScores: AlignmentScores,
  expectedDirection?: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism'
): boolean {
  // Check if scores changed
  const changed = Object.keys(initialScores).some(
    key => initialScores[key as keyof AlignmentScores] !== updatedScores[key as keyof AlignmentScores]
  );

  if (!changed) {
    return false;
  }

  // If expected direction specified, check if that score increased
  if (expectedDirection) {
    return updatedScores[expectedDirection] > initialScores[expectedDirection];
  }

  return true;
}

/**
 * Checks if probing questions appear in response
 */
function checkProbingQuestions(
  response: ContrarianOutput,
  expectedQuestions?: string[]
): boolean {
  if (!expectedQuestions || expectedQuestions.length === 0) {
    return true; // No expected questions, skip check
  }

  const responseText = JSON.stringify(response.sections).toLowerCase();
  
  // Check if at least one expected question appears (semantically)
  return expectedQuestions.some(expectedQ => {
    const expectedLower = expectedQ.toLowerCase();
    // Check if key words from expected question appear in response
    const keyWords = expectedLower.split(/\s+/).filter(w => w.length > 3);
    return keyWords.some(word => responseText.includes(word));
  });
}

/**
 * Checks if response indicates AI doesn't have a stance
 */
function checkAINoStanceMessage(response: ContrarianOutput): boolean {
  const responseText = JSON.stringify(response.sections).toLowerCase();
  const noStanceKeywords = [
    "don't have a stance",
    "don't have an opinion",
    "no stance",
    "no opinion",
    "help you strengthen",
    "help you find",
    "guide you",
    "here to help",
  ];
  
  return noStanceKeywords.some(keyword => responseText.includes(keyword));
}

/**
 * Run evaluation for a single test case
 */
async function runEvalCase(testCase: EvalCase): Promise<EvalResult> {
  console.log(`\n📋 Running eval: ${testCase.id}`);
  console.log(`   Topic: ${testCase.topic}`);
  console.log(`   Input: ${testCase.userStance.substring(0, 60)}...`);

  try {
    // Gather government data (real API call)
    const governmentData = await gatherGovernmentData(testCase.topic, { skipCache: true });

    // Create initial context with neutral scores
    const initialScores: AlignmentScores = {
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    };

    const context: ContrarianContext = {
      topic: testCase.topic,
      conversationHistory: [],
      alignmentScores: initialScores,
      governmentData,
    };

    // Detect question type (same logic as API route)
    const questionType = await detectQuestionType(testCase.userStance, testCase.topic);
    
    let response: ContrarianOutput;
    if (questionType !== 'stance') {
      // Educational question: Generate educational response
      const educationalResponse = await generateQuestionResponse(
        testCase.userStance,
        testCase.topic,
        context,
        questionType
      );
      
      // Update scores minimally
      const { updateScores } = await import('../contrarian/scoring');
      const updatedScores = await updateScores(initialScores, testCase.userStance, testCase.topic);

      response = {
        type: 'educational',
        sections: {
          analysis: educationalResponse.analysis,
          followUpQuestion: educationalResponse.followUpQuestion,
        },
        updatedScores,
        sources: educationalResponse.sources,
      };
    } else {
      // Stance: Generate contrarian challenge
      response = await generateContrarian(context, testCase.userStance);
    }

    // Run scorers
    console.log('   Running scorers...');
    let faithfulnessScore: number | null = 0;
    let relevancyScore = 0;
    let alignmentScore: number | null = null; // null means skipped

    // Faithfulness: skip for educational (we don't hold framing/perspectives to strict stat-only support)
    if (response.type !== 'educational') {
      try {
        faithfulnessScore = await scoreFaithfulness(response, governmentData, testCase.userStance);
      } catch (error) {
        console.error(`   ⚠️  Faithfulness scorer error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      faithfulnessScore = null;
    }

    let followUpRelevancyScore: number | null = null;
    if (response.type === 'educational') {
      try {
        const { relevancy, followUpRelevancy } = await scoreRelevancyAndFollowUp(
          response,
          testCase.userStance,
          testCase.topic
        );
        relevancyScore = relevancy;
        followUpRelevancyScore = followUpRelevancy;
      } catch (error) {
        console.error(`   ⚠️  Relevancy scorer error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      try {
        const { relevancy, alignmentAccuracy } = await scoreRelevancyAndAlignment(
          testCase.userStance,
          testCase.topic,
          response,
          response.updatedScores,
          testCase.expectedAlignmentDirection
        );
        relevancyScore = relevancy;
        alignmentScore = alignmentAccuracy;
      } catch (error) {
        console.error(`   ⚠️  Relevancy+Alignment scorer error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Check criteria based on response type
    const criteria: EvalResult['criteria'] = {
      responseTypeMatches: testCase.expectedResponseType 
        ? response.type === testCase.expectedResponseType 
        : true,
      sourcesValid: response.type === 'educational' && (!response.sources || response.sources.length === 0)
        ? true  // Educational can have empty sources when no stats/legislation cited
        : validateSources(response.sources),
    };

    if (response.type === 'challenge') {
      // Challenge response criteria
      criteria.acknowledgmentPresent = !!response.sections.acknowledgment && response.sections.acknowledgment.length > 0;
      criteria.supportingStatPresent = !!response.sections.keyStatisticsFor && response.sections.keyStatisticsFor.length > 0;
      criteria.challengingStatPresent = !!response.sections.keyStatisticsAgainst && response.sections.keyStatisticsAgainst.length > 0;
      criteria.alignmentUpdated = checkAlignmentUpdated(initialScores, response.updatedScores, testCase.expectedAlignmentDirection);
      criteria.probingQuestionsPresent = checkProbingQuestions(response, testCase.expectedFollowUpQuestions);
    } else if (response.type === 'educational') {
      // Educational response criteria (analysis-led; keyStatistics optional when no relevant data)
      const followUpThreshold = (testCase.relevancyThreshold != null && testCase.relevancyThreshold < 0.7) ? 0.5 : 0.7;
      criteria.analysisPresent = !!response.sections.analysis && response.sections.analysis.length > 0;
      criteria.probingQuestionsPresent = checkProbingQuestions(response, testCase.expectedFollowUpQuestions);
      criteria.followUpRelevant = (followUpRelevancyScore ?? 0) >= followUpThreshold;
      if (testCase.id.includes('what-do-you-think') || testCase.id.includes('give-me-a-stance')) {
        criteria.aiNoStanceMessage = checkAINoStanceMessage(response);
      }
    }

    // Determine if passed (all criteria met + scores above threshold)
    const allCriteriaMet = Object.values(criteria).every(c => c !== false);
    
    // Faithfulness: skip if null (no government data), otherwise must be >= 0.7
    const faithfulnessPassed = faithfulnessScore === null || faithfulnessScore >= 0.7;
    
    // Relevancy: must meet threshold (default 0.7; educational cases may use relevancyThreshold for factual-no-data)
    const relevancyThreshold = testCase.relevancyThreshold ?? 0.7;
    const relevancyPassed = relevancyScore >= relevancyThreshold;
    
    // Alignment: skip for educational responses, otherwise must be >= 0.7
    const alignmentPassed = alignmentScore === null || alignmentScore >= 0.7;
    
    const passed = allCriteriaMet && faithfulnessPassed && relevancyPassed && alignmentPassed;

    if (!passed && response.type === 'educational') {
      const failedCriteria = Object.entries(criteria).filter(([, v]) => v === false).map(([k]) => k);
      if (failedCriteria.length > 0) {
        console.log(`   ❌ Failed criteria: ${failedCriteria.join(', ')}`);
      }
    }

    // Log scores
    if (faithfulnessScore === null) {
      console.log(`   ⚠️  Faithfulness: SKIPPED (educational response or no government data)`);
    } else {
      console.log(`   ✅ Faithfulness: ${(faithfulnessScore * 100).toFixed(1)}%`);
    }
    console.log(`   ✅ Relevancy: ${(relevancyScore * 100).toFixed(1)}%`);
    if (alignmentScore === null) {
      console.log(`   ℹ️  Alignment Accuracy: SKIPPED (educational response)`);
    } else {
      console.log(`   ✅ Alignment Accuracy: ${(alignmentScore * 100).toFixed(1)}%`);
    }
    console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return {
      caseId: testCase.id,
      topic: testCase.topic,
      userStance: testCase.userStance,
      passed,
      scores: {
        faithfulness: faithfulnessScore,
        relevancy: relevancyScore,
        alignmentAccuracy: alignmentScore,
      },
      criteria,
      response: {
        type: response.type,
        sections: response.sections,
        updatedScores: response.updatedScores,
        sources: response.sources,
      },
    };
  } catch (error) {
    console.error(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return {
      caseId: testCase.id,
      topic: testCase.topic,
      userStance: testCase.userStance,
      passed: false,
      scores: {
        faithfulness: null,
        relevancy: 0,
        alignmentAccuracy: null,
      },
      criteria: {
        sourcesValid: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main eval runner
 * @param datasetType - 'all' | 'contrarian' | 'educational'
 */
export async function runEvals(datasetType: 'all' | 'contrarian' | 'educational' = 'all'): Promise<void> {
  console.log('🚀 Starting AI Eval System');
  
  // Check required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY is required to run evals');
    console.error('   Please set OPENAI_API_KEY in your .env.local file');
    process.exit(1);
  }
  
  // Warn about optional variables
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('⚠️  WARNING: Firebase credentials not configured - caching will be disabled');
  }
  
  // Select dataset based on parameter
  let allTestCases: EvalCase[];
  if (datasetType === 'contrarian') {
    allTestCases = CONTRARIAN_DATASET;
    console.log(`📊 Running The Contrarian dataset only`);
  } else if (datasetType === 'educational') {
    allTestCases = EDUCATIONAL_RESPONSES_DATASET;
    console.log(`📊 Running Educational Response dataset only`);
  } else {
    allTestCases = [...CONTRARIAN_DATASET, ...EDUCATIONAL_RESPONSES_DATASET];
    console.log(`📊 Running all datasets`);
  }
  
  // Optional limit (e.g. EVAL_LIMIT=3 for quick iteration)
  const limitEnv = process.env.EVAL_LIMIT;
  if (limitEnv) {
    const limit = parseInt(limitEnv, 10);
    if (limit > 0) {
      allTestCases = allTestCases.slice(0, limit);
      console.log(`📊 Limiting to first ${limit} cases (EVAL_LIMIT)`);
    }
  }

  console.log(`📊 The Contrarian cases: ${CONTRARIAN_DATASET.length}`);
  console.log(`📊 Educational Response cases: ${EDUCATIONAL_RESPONSES_DATASET.length}`);
  console.log(`📊 Selected test cases: ${allTestCases.length}`);
  console.log('⚠️  WARNING: This will make real API calls to OpenAI and government APIs');
  console.log('');

  const results: EvalResult[] = [];

  // Run evals sequentially to avoid rate limits
  for (const testCase of allTestCases) {
    const result = await runEvalCase(testCase);
    results.push(result);

    // Small delay between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  // Calculate averages, excluding null (skipped) scores
  const faithfulnessScores = results.map(r => r.scores.faithfulness).filter((s): s is number => s !== null);
  const avgFaithfulness = faithfulnessScores.length > 0 
    ? faithfulnessScores.reduce((sum, s) => sum + s, 0) / faithfulnessScores.length 
    : 0;
  
  const avgRelevancy = results.reduce((sum, r) => sum + r.scores.relevancy, 0) / results.length;
  
  const alignmentScores = results.map(r => r.scores.alignmentAccuracy).filter((s): s is number => s !== null);
  const avgAlignment = alignmentScores.length > 0
    ? alignmentScores.reduce((sum, s) => sum + s, 0) / alignmentScores.length
    : 0;

  const summary: EvalSummary = {
    total: results.length,
    passed,
    failed,
    averageScores: {
      faithfulness: avgFaithfulness,
      relevancy: avgRelevancy,
      alignmentAccuracy: avgAlignment,
    },
    results,
  };

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EVAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`\nAverage Scores:`);
  const skippedFaithfulness = results.length - faithfulnessScores.length;
  if (skippedFaithfulness > 0) {
    console.log(`  Faithfulness: ${(summary.averageScores.faithfulness * 100).toFixed(1)}% (${skippedFaithfulness} skipped - no government data)`);
  } else {
    console.log(`  Faithfulness: ${(summary.averageScores.faithfulness * 100).toFixed(1)}%`);
  }
  console.log(`  Relevancy: ${(summary.averageScores.relevancy * 100).toFixed(1)}%`);
  const skippedAlignment = results.length - alignmentScores.length;
  if (skippedAlignment > 0) {
    console.log(`  Alignment Accuracy: ${(summary.averageScores.alignmentAccuracy * 100).toFixed(1)}% (${skippedAlignment} skipped - educational responses)`);
  } else {
    console.log(`  Alignment Accuracy: ${(summary.averageScores.alignmentAccuracy * 100).toFixed(1)}%`);
  }

  // Save results to JSON file
  const resultsDir = path.join(process.cwd(), 'evals', 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(resultsDir, `eval-results-${timestamp}.json`);
  
  fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  // Check for dataset type argument: npm run eval -- educational
  const datasetType = process.argv[2] as 'all' | 'contrarian' | 'educational' || 'all';
  
  if (!['all', 'contrarian', 'educational'].includes(datasetType)) {
    console.error(`❌ Invalid dataset type: ${datasetType}`);
    console.error('   Usage: npm run eval [all|contrarian|educational]');
    console.error('   Example: npm run eval educational');
    process.exit(1);
  }
  
  runEvals(datasetType).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
