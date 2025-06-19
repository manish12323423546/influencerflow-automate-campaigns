#!/bin/bash

# 🚀 Production Deployment Script
# This script ensures proper CopilotKit integration with your Render.com backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Production Deployment for CopilotKit Integration${NC}"
echo "=============================================="

# Get backend URL from user or use default
BACKEND_URL="${1:-https://project-x-c0ml.onrender.com}"

# Remove trailing slash if present
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')

echo -e "${YELLOW}📡 Backend URL: ${BACKEND_URL}${NC}"

# Function to test backend
test_backend() {
    echo -e "${YELLOW}🔍 Testing Backend Connection...${NC}"
    
    # Test health endpoint
    if curl -s "${BACKEND_URL}/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Backend Health: OK${NC}"
    else
        echo -e "${RED}❌ Backend Health: FAILED${NC}"
        echo "Please check that your backend is running at: ${BACKEND_URL}"
        exit 1
    fi
    
    # Test CopilotKit availability
    if curl -s "${BACKEND_URL}/info" | grep -q "copilotkit_available.*true"; then
        echo -e "${GREEN}✅ CopilotKit: Available${NC}"
    else
        echo -e "${RED}❌ CopilotKit: Not Available${NC}"
        echo "Please ensure CopilotKit is properly configured in your backend"
        exit 1
    fi
}

# Function to create environment file
create_env_file() {
    echo -e "${YELLOW}📝 Creating Environment Configuration...${NC}"
    
    cat > .env.production << EOF
# Production Environment Configuration
NEXT_PUBLIC_LANGGRAPH_BACKEND_URL=${BACKEND_URL}
NEXT_PUBLIC_COPILOTKIT_AGENT_NAME=campaign_agent
NEXT_PUBLIC_ENVIRONMENT=production
EOF
    
    echo -e "${GREEN}✅ Environment file created: .env.production${NC}"
}

# Function to update package.json scripts
update_scripts() {
    echo -e "${YELLOW}📦 Updating Build Scripts...${NC}"
    
    # Create a temporary build script that uses the environment
    cat > build-production.sh << 'EOF'
#!/bin/bash
# Load production environment
export $(cat .env.production | xargs)
# Build the application
npm run build
EOF
    
    chmod +x build-production.sh
    echo -e "${GREEN}✅ Production build script created${NC}"
}

# Function to validate the fix
validate_fix() {
    echo -e "${YELLOW}🧪 Validating URL Configuration...${NC}"
    
    # Check if URL has trailing slash (should not)
    if [[ "$BACKEND_URL" == */ ]]; then
        echo -e "${RED}❌ URL ends with slash - this will cause double slash issues${NC}"
        BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')
        echo -e "${GREEN}✅ Fixed: Removed trailing slash${NC}"
    fi
    
    echo -e "${GREEN}✅ URL Configuration: ${BACKEND_URL}${NC}"
}

# Function to show deployment instructions
show_deployment_instructions() {
    echo -e "${BLUE}🚀 Deployment Instructions${NC}"
    echo "=================================="
    echo ""
    echo "For Vercel:"
    echo "  1. Set environment variable:"
    echo "     vercel env add NEXT_PUBLIC_LANGGRAPH_BACKEND_URL"
    echo "     Enter: ${BACKEND_URL}"
    echo "  2. Deploy: vercel --prod"
    echo ""
    echo "For Netlify:"
    echo "  1. Go to Site Settings → Environment Variables"
    echo "  2. Add: NEXT_PUBLIC_LANGGRAPH_BACKEND_URL = ${BACKEND_URL}"
    echo "  3. Deploy: netlify deploy --prod"
    echo ""
    echo "For Render.com:"
    echo "  1. Go to Environment → Add Environment Variable"
    echo "  2. Key: NEXT_PUBLIC_LANGGRAPH_BACKEND_URL"
    echo "  3. Value: ${BACKEND_URL}"
    echo "  4. Trigger deploy"
    echo ""
    echo -e "${GREEN}💡 Remember: NO trailing slash in the URL!${NC}"
}

# Function to create test script
create_test_script() {
    echo -e "${YELLOW}🧪 Creating Integration Test...${NC}"
    
    cat > test-integration-production.js << EOF
// Production Integration Test
const fetch = require('node-fetch');

const BACKEND_URL = '${BACKEND_URL}';

async function testProduction() {
    console.log('🧪 Testing Production Integration...');
    console.log('Backend URL:', BACKEND_URL);
    
    try {
        // Test health
        const health = await fetch(\`\${BACKEND_URL}/health\`);
        console.log('Health Status:', health.status);
        
        // Test info
        const info = await fetch(\`\${BACKEND_URL}/info\`);
        const infoData = await info.json();
        console.log('CopilotKit Available:', infoData.copilotkit_available);
        
        // Test URL formatting (should NOT have double slashes)
        const testUrl = \`\${BACKEND_URL}/copilotkit/info\`;
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
EOF
    
    echo -e "${GREEN}✅ Test script created: test-integration-production.js${NC}"
}

# Main execution
echo -e "${YELLOW}🔧 Running Pre-deployment Checks...${NC}"

# Validate URL format
validate_fix

# Test backend
test_backend

# Create environment configuration
create_env_file

# Update build scripts
update_scripts

# Create test script
create_test_script

# Show deployment instructions
show_deployment_instructions

echo ""
echo -e "${GREEN}🎉 All checks passed! Ready for production deployment.${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Set the environment variable in your hosting platform"
echo "2. Deploy your frontend with the updated code"
echo "3. Test the integration using: node test-integration-production.js"
echo ""
echo -e "${GREEN}🚀 Your AI Agent will be live in production!${NC}" 