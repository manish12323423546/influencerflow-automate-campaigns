"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conversationalAI_1 = require("./services/conversationalAI");
async function testOutboundCall() {
    try {
        const phoneNumber = '+918140030507'; // User's phone number
        const campaignData = {
            campaign_id: 'test_campaign_001',
            campaign_name: 'Test Campaign',
            brand_name: 'Test Brand',
            brief: 'This is a test campaign to verify our outbound calling functionality.',
            deliverables: ['Social Media Post', 'Story']
        };
        console.log('Initiating outbound call...');
        const callResponse = await conversationalAI_1.conversationalAIService.initiateOutboundCall(phoneNumber, campaignData);
        console.log('Call initiated:', callResponse);
        // Wait for a few seconds before checking status
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Checking call status...');
        const statusResponse = await conversationalAI_1.conversationalAIService.getCallStatus(callResponse.call_id);
        console.log('Call status:', statusResponse);
    }
    catch (error) {
        console.error('Error in test:', error);
    }
}
// Run the test
testOutboundCall();
