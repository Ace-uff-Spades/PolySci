import { NextRequest, NextResponse } from 'next/server';
import { generateContrarian, ContrarianContext, AlignmentScores, ContrarianMessage } from '@/lib/contrarian';
import { gatherGovernmentData } from '@/lib/government';
import { validateTopicRelevance } from '@/lib/contrarian/validation';
import { generateQuestionResponse, detectStanceWithParaphrase, detectQuestionType } from '@/lib/contrarian/question-handler';
import { updateScores } from '@/lib/contrarian/scoring';
import { jsonError } from '../../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, userStance, conversationHistory, currentScores, mode = 'educational', explicitStanceAction = false, confirmedStance, stanceHistory } = body;
    if (!topic || typeof topic !== 'string') return jsonError('Topic is required', 400);
    if (userStance == null || typeof userStance !== 'string') return jsonError('User stance is required', 400);
    if (!currentScores) return jsonError('Current scores are required', 400);
    if (!explicitStanceAction || !confirmedStance) {
      const lastAiMessage = (conversationHistory || []).filter((m: { role?: string }) => m.role === 'ai' || m.role === 'assistant').pop();
      const contextQuestion = typeof lastAiMessage?.content === 'string' ? lastAiMessage.content : undefined;
      const validation = await validateTopicRelevance(topic, userStance, contextQuestion);
      if (!validation.isRelevant) return NextResponse.json({ error: 'off-topic', message: validation.message || `Let's stay focused on "${topic}". Could you share your stance specifically on this topic?` }, { status: 400 });
    }
    const governmentData = await gatherGovernmentData(topic);
    const history: ContrarianMessage[] = (conversationHistory || []).map((msg: any) => ({ ...msg, timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date() }));
    const stanceHistoryList = Array.isArray(stanceHistory) ? stanceHistory : [];
    const context: ContrarianContext = { topic, conversationHistory: history, alignmentScores: currentScores as AlignmentScores, governmentData, stanceHistory: stanceHistoryList };
    const stanceForChallenge = explicitStanceAction ? (typeof confirmedStance === 'string' && confirmedStance.trim() ? confirmedStance.trim() : userStance.trim()) : null;
    if (stanceForChallenge) return NextResponse.json(await generateContrarian(context, stanceForChallenge));
    // In contrarian/challenge mode: only switch to educational if user asked a question
    if (mode === 'contrarian' || mode === 'challenge') {
      const questionType = await detectQuestionType(userStance.trim(), topic);
      if (questionType !== 'stance') {
        const educationalResponse = await generateQuestionResponse(userStance.trim(), topic, context);
        const updatedScores = await updateScores(currentScores as AlignmentScores, userStance, topic);
        return NextResponse.json({ type: 'educational', sections: { analysis: educationalResponse.analysis, followUpQuestion: educationalResponse.followUpQuestion }, updatedScores, sources: educationalResponse.sources });
      }
      return NextResponse.json(await generateContrarian(context, userStance.trim()));
    }
    const { isStance, paraphrasedStance } = await detectStanceWithParaphrase(userStance.trim(), topic);
    if (isStance && paraphrasedStance) {
      const updatedScores = await updateScores(currentScores as AlignmentScores, userStance, topic);
      return NextResponse.json({
        type: 'educational', confirmationPrompt: true, paraphrasedStance,
        sections: { analysis: `It sounds like you might have a stance on ${topic}. Is "${paraphrasedStance}" your current stance? If yes, click **I have a stance — challenge me** below; if not, we can keep exploring.`, followUpQuestion: 'Would you like to get a challenge, or keep exploring?' },
        updatedScores, sources: [],
      });
    }
    const educationalResponse = await generateQuestionResponse(userStance.trim(), topic, context);
    const updatedScores = await updateScores(currentScores as AlignmentScores, userStance, topic);
    return NextResponse.json({ type: 'educational', sections: { analysis: educationalResponse.analysis, followUpQuestion: educationalResponse.followUpQuestion }, updatedScores, sources: educationalResponse.sources });
  } catch (error) {
    console.error('The Contrarian error:', error);
    return jsonError('Failed to generate challenge', 500);
  }
}
