import { conversationalAIService } from './services/conversationalAI';

async function testOutboundCall() {
  try {
    const phoneNumber = '+918140030507'; // Replace with the actual phone number you want to call
    const campaignData = {
      campaign_id: 'test_campaign_001',
      campaign_name: 'Test Campaign',
      brand_name: 'Test Brand',
      brief: 'This is a test campaign to verify our outbound calling functionality.',
      deliverables: ['Social Media Post', 'Story']
    };

    console.log('Initiating outbound call...');
    const callResponse = await conversationalAIService.initiateOutboundCall(phoneNumber, campaignData);
    console.log('Call initiated:', callResponse);

    // Wait for a few seconds before checking status
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Checking call status...');
    const statusResponse = await conversationalAIService.getCallStatus(callResponse.call_id);
    console.log('Call status:', statusResponse);

  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testOutboundCall(); 