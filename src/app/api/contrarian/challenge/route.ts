import { NextRequest, NextResponse } from 'next/server';
import { generateContrarianChallenge } from '@/lib/contrarian';
import { gatherGovernmentData } from '@/lib/government';
import { ContrarianContext, AlignmentScores, ContrarianMessage } from '@/lib/contrarian';

export async function POST(request: NextRequest) {
  try {
    const { topic, userStance, conversationHistory, currentScores } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!userStance || typeof userStance !== 'string') {
      return NextResponse.json(
        { error: 'User stance is required' },
        { status: 400 }
      );
    }

    if (!currentScores) {
      return NextResponse.json(
        { error: 'Current scores are required' },
        { status: 400 }
      );
    }

    // Gather government data for the topic
    const governmentData = await gatherGovernmentData(topic);

    // Convert conversation history (dates may be strings)
    const history: ContrarianMessage[] = (conversationHistory || []).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    // Create context
    const context: ContrarianContext = {
      topic,
      conversationHistory: history,
      alignmentScores: currentScores as AlignmentScores,
      governmentData,
    };

    // Generate contrarian challenge
    const result = await generateContrarianChallenge(context, userStance);

    return NextResponse.json({
      challenge: result.challenge,
      updatedScores: result.updatedScores,
      followUpQuestion: result.followUpQuestion,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Contrarian challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
