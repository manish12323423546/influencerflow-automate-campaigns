// Quick test script to verify CopilotKit integration
// Run with: node test-integration.js

const fetch = require('node-fetch');

async function testIntegration() {
    console.log('🧪 Testing CopilotKit + LangGraph Integration...\n');
    
    const backendUrl = 'http://localhost:8000';
    
    try {
        // Test 1: Backend Health
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await fetch(`${backendUrl}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ Backend is healthy:', health.status);
        } else {
            console.log('❌ Backend health check failed');
            return;
        }
        
        // Test 2: CopilotKit availability
        console.log('\n2️⃣ Testing CopilotKit integration...');
        const infoResponse = await fetch(`${backendUrl}/info`);
        if (infoResponse.ok) {
            const info = await infoResponse.json();
            if (info.copilotkit_available) {
                console.log('✅ CopilotKit integration is available');
                console.log('📍 CopilotKit endpoint:', info.endpoints.copilotkit);
            } else {
                console.log('❌ CopilotKit integration not available');
                return;
            }
        } else {
            console.log('❌ Info endpoint failed');
            return;
        }
        
        // Test 3: CopilotKit endpoint
        console.log('\n3️⃣ Testing CopilotKit endpoint...');
        const copilotResponse = await fetch(`${backendUrl}/copilotkit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: 'Hello, are you working?'
                }]
            })
        });
        
        if (copilotResponse.ok) {
            console.log('✅ CopilotKit endpoint is responding');
        } else {
            console.log('❌ CopilotKit endpoint failed:', copilotResponse.status);
        }
        
        console.log('\n🎉 Integration test completed!');
        console.log('\n📋 Next steps:');
        console.log('   1. Start your frontend: npm run dev');
        console.log('   2. Navigate to: http://localhost:5173');
        console.log('   3. Go to: Dashboard → AI Agent');
        console.log('   4. You should see: "Connected to LangGraph Multi-Agent System"');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   • Make sure your LangGraph backend is running');
        console.log('   • Check: python main.py in langgraph-example directory');
        console.log('   • Verify port 8000 is not blocked');
    }
}

testIntegration(); 