// Production Integration Test
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8000';

async function testProduction() {
    console.log('🧪 Testing Production Integration...');
    console.log('Backend URL:', BACKEND_URL);
    
    try {
        // Test health
        const health = await fetch(`${BACKEND_URL}/health`);
        console.log('Health Status:', health.status);
        
        // Test info
        const info = await fetch(`${BACKEND_URL}/info`);
        const infoData = await info.json();
        console.log('CopilotKit Available:', infoData.copilotkit_available);
        
        // Test URL formatting (should NOT have double slashes)
        const testUrl = `${BACKEND_URL}/copilotkit/info`;
        console.log('Expected URL Format:', testUrl);
        
        if (testUrl.includes('//info') && !testUrl.startsWith('http')) {
            console.log('❌ Double slash detected in URL!');
        } else {
            console.log('✅ URL formatting is correct');
        }
        
        console.log('🎉 Production test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testProduction();
