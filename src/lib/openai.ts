import { type Campaign } from '@/types/campaign';
import { type Influencer } from '@/types/influencer';

// Get API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Validate API key format
const validateApiKey = (key: string | undefined): string => {
  if (!key) {
    throw new Error('OpenAI API key not found in environment variables. Please add VITE_OPENAI_API_KEY to your .env file.');
  }
  
  if (!key.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. The key should start with "sk-"');
  }
  
  return key;
};

interface MatchInfluencersResponse {
  matches: {
    influencer_id: string;
    match_score: number;
    match_reason: string;
  }[];
}

export async function findMatchingInfluencers(
  campaign: Partial<Campaign>,
  influencers: Influencer[]
): Promise<MatchInfluencersResponse> {
  try {
    // Validate API key before making the request
    const validatedKey = validateApiKey(OPENAI_API_KEY);

    const prompt = `You are a JSON-only response AI. You must respond with valid JSON only.

    I need to find the best matching influencers for a brand campaign.
    
    Campaign details:
    - Name: ${campaign.name}
    - Brand: ${campaign.brand}
    - Description: ${campaign.description || 'N/A'}
    - Goals: ${campaign.goals}
    - Target Audience: ${campaign.target_audience}
    - Budget: $${campaign.budget}
    - Deliverables: ${campaign.deliverables}
    - Timeline: ${campaign.timeline || 'N/A'}

    Available influencers:
    ${influencers.map(inf => `
    - ID: ${inf.id}
    - Name: ${inf.name}
    - Platform: ${inf.platform}
    - Industry: ${inf.industry}
    - Language: ${inf.language}
    - Followers: ${inf.followers_count}
    - Engagement Rate: ${inf.engagement_rate}%
    - Audience Fit Score: ${inf.audience_fit_score}
    - Average CPE: $${inf.avg_cpe}
    - ROI Index: ${inf.roi_index}
    - Fake Follower Score: ${inf.fake_follower_score}
    - Safety Scan Score: ${inf.safety_scan_score}
    `).join('\n')}

    Please analyze these influencers and find the top 3 matches for this campaign. Consider:
    1. Audience alignment with target audience
    2. Platform relevance for campaign goals
    3. Engagement rates and authenticity
    4. Budget fit based on typical rates
    5. Industry expertise
    6. Safety and brand risk factors

    You must respond with this exact JSON format and nothing else:
    {
      "matches": [
        {
          "influencer_id": "string",
          "match_score": number (0-100),
          "match_reason": "string explaining why this influencer is a good match"
        }
      ]
    }
  `;

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validatedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only response AI. You must respond with valid JSON only, no other text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${errorData?.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const matches = JSON.parse(content) as MatchInfluencersResponse;
      return matches;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('Error in findMatchingInfluencers:', error);
    throw error;
  }
} 