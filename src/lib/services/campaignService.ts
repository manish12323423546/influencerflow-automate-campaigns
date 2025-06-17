export async function generateCampaignReport(data: any) {
    const response = await fetch('/api/python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/campaign-report',
        data
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to generate campaign report');
    }
  
    return response.json();
  }
  
  export async function runAIAgent(data: any) {
    const response = await fetch('/api/python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/ai-agents',
        data
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to run AI agent');
    }
  
    return response.json();
  }
  
  export async function runWorkflow(data: any) {
    const response = await fetch('/api/python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/workflow',
        data
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to run workflow');
    }
  
    return response.json();
  } 