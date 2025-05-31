import { type Campaign } from '@/types/campaign';
import { type Influencer } from '@/types/influencer';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim().replace(/^=/, '');
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

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
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Debug log to verify API key format
  console.debug('OpenAI API Key format check:', {
    length: OPENAI_API_KEY.length,
    startsWithSk: OPENAI_API_KEY.startsWith('sk-'),
    hasEquals: OPENAI_API_KEY.includes('='),
  });

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
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      keyFormat: {
        length: OPENAI_API_KEY.length,
        startsWithSk: OPENAI_API_KEY.startsWith('sk-'),
        hasEquals: OPENAI_API_KEY.includes('='),
      }
    });
    throw new Error(`Failed to get influencer matches from OpenAI: ${response.statusText}`);
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
} 