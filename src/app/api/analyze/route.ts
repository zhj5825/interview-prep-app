import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/server/api-utils'
import Anthropic from '@anthropic-ai/sdk';

interface AnalyzeRequest {
  question: string
}

interface AnalysisResponse {
  explanation: string
}

async function analyzeWithClaude(question: string): Promise<AnalysisResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set, using mock response');
    return getMockResponse(question);
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });
  
  const prompt = `Analyze this interview question and provide a detailed plan to approach the problem:
    
    For system design questions, the detailed plan should include the back of the envelope calculations for the system, the high level architecture, 
    and the detailed components of the system. Tradeoffs and assumptions should be considered. The data models and the APIs should be illustrated using pseudocode.

    For coding and algorithmic questions, in addition to the detailed plan, the python code should be provided to solve the problem, and the time and space complexity should be analyzed.

    Question: ${question}
    `


  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Handle the new content structure
    const contentBlock = message.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const explanation = contentBlock.text;
    console.log(explanation);


    // Parse response to AnalysisResponse
    const analysisResponse: AnalysisResponse = {
      explanation: explanation,
    }
    return analysisResponse;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error('Failed to generate solution');
  }
}

function getMockResponse(question: string): AnalysisResponse {
  return {
    explanation: `# Analysis for: ${question}

This is a mock response since the Claude API key is not configured.

## What you would get with the real API:
- Detailed problem breakdown
- Solution approaches with pseudocode
- Time and space complexity analysis
- Step-by-step explanation

To enable real analysis, please set your CLAUDE_API_KEY environment variable.`
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequestBody<AnalyzeRequest>(request, ['question'])
    
    if (!body) {
      return createErrorResponse('Invalid request body. Question is required.', 400)
    }

    const { question } = body

    if (!question.trim()) {
      return createErrorResponse('Question cannot be empty', 400)
    }

    if (question.length > 2000) {
      return createErrorResponse('Question is too long. Please limit to 2000 characters.', 400)
    }

    const analysis = await analyzeWithClaude(question.trim())
    
    return createSuccessResponse({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return createErrorResponse('Failed to analyze question. Please try again.', 500)
  }
}