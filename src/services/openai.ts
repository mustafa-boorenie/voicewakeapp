import OpenAI from 'openai';
import Constants from 'expo-constants';
import { MIOnboardingData } from '../types';

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
  }
  
  return new OpenAI({
    apiKey,
  });
};

export interface GeneratedContent {
  goals: string[];
  affirmations: string[];
}

/**
 * Generate personalized goals and affirmations based on onboarding responses
 * @param data - The user's onboarding responses
 * @returns Promise<GeneratedContent> - 3 goals and 3 affirmations (each <10 words)
 */
export async function generateGoalsAndAffirmations(
  data: Partial<MIOnboardingData>
): Promise<GeneratedContent> {
  try {
    const client = getOpenAIClient();

    const prompt = `Based on the following information about a user, generate exactly 3 specific, actionable goals and 3 positive affirmations. Each goal and affirmation must be LESS THAN 10 WORDS.

User's Information:
- What they want to achieve: ${data.meaningfulChange || 'Not specified'}
- Importance (0-10): ${data.importanceScore || 5}
- Why it matters: ${data.meaningfulChange || 'Not specified'}
- Confidence level (0-10): ${data.confidenceScore || 5}
- Perfect future vision: ${data.perfectFuture || 'Not specified'}
- Barriers: ${data.barriers?.join(', ') || 'Not specified'}
- Support systems: ${data.supports?.join(', ') || 'Not specified'}

Requirements:
1. Goals should be specific, measurable, and actionable
2. Affirmations should be positive, present-tense statements
3. Each goal must be LESS THAN 10 words
4. Each affirmation must be LESS THAN 10 words
5. Be encouraging and realistic based on their confidence level

Return your response in this exact JSON format:
{
  "goals": ["goal 1", "goal 2", "goal 3"],
  "affirmations": ["affirmation 1", "affirmation 2", "affirmation 3"]
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a motivational coach specializing in goal-setting and positive psychology. You help people create achievable goals and powerful affirmations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const parsed = JSON.parse(content) as GeneratedContent;

    // Validate the response
    if (!parsed.goals || !Array.isArray(parsed.goals) || parsed.goals.length !== 3) {
      throw new Error('Invalid goals format received from OpenAI');
    }
    if (!parsed.affirmations || !Array.isArray(parsed.affirmations) || parsed.affirmations.length !== 3) {
      throw new Error('Invalid affirmations format received from OpenAI');
    }

    // Ensure each item is less than 10 words
    parsed.goals = parsed.goals.map(goal => 
      goal.split(' ').slice(0, 10).join(' ')
    );
    parsed.affirmations = parsed.affirmations.map(affirmation => 
      affirmation.split(' ').slice(0, 10).join(' ')
    );

    return parsed;
  } catch (error) {
    console.error('Error generating goals and affirmations:', error);
    
    // Fallback to default goals and affirmations if API fails
    return {
      goals: [
        'Wake up energized every morning',
        'Complete my daily priorities with focus',
        'Improve my wellbeing through consistent habits'
      ],
      affirmations: [
        'I am capable of achieving my goals',
        'I wake up with energy and purpose',
        'I make positive progress every day'
      ]
    };
  }
}

