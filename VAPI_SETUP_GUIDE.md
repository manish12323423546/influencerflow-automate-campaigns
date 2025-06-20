# 🤖 VAPI Setup Guide

This guide will help you fix the "400 Bad Request" error when connecting AI agents to meetings.

## 🔑 Step 1: Get Your VAPI API Keys

1. **Sign up for VAPI**: Go to [https://vapi.ai](https://vapi.ai) and create an account
2. **Get your API keys**:
   - **Public Key**: Used for web client connections (starts with `pk-` or similar)
   - **Private Key**: Used for server-side operations (starts with `sk-` or similar)
   - **Organization ID**: Your VAPI organization identifier

## 📝 Step 2: Create Your .env File

Create a `.env` file in your project root with the following content:

```bash
# VAPI Configuration for Meeting AI Agent
VITE_VAPI_PUBLIC_KEY=pk-your-actual-public-key-here
NEXT_PUBLIC_VAPI_PUBLIC_KEY=pk-your-actual-public-key-here
VAPI_PRIVATE_KEY=sk-your-actual-private-key-here
VAPI_ORG_ID=your-organization-id-here

# Other configurations...
LANGGRAPH_API_URL=http://localhost:8000
LANGSMITH_API_KEY=your_langsmith_api_key_here
COPILOTKIT_API_KEY=your_copilotkit_api_key_here
```

## 🔧 Step 3: Verify Your Setup

After setting up your keys:

1. **Restart your development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Check the browser console** for VAPI environment check logs:
   - ✅ Should show `isDemoMode: false`
   - ✅ Should show `keyValidation: { valid: true }`
   - ❌ If it shows demo mode, your keys aren't configured correctly

## 🐛 Common Issues and Solutions

### Issue 1: "Authentication Error" or "Unauthorized"
**Cause**: Invalid or missing API keys
**Solution**: 
- Double-check your VAPI public key in the .env file
- Make sure the key starts with `pk-` or the correct prefix
- Verify the key hasn't expired

### Issue 2: "Assistant Does Not Exist"
**Cause**: The assistant ID is invalid or doesn't exist in your VAPI account
**Solution**:
- Create new assistants using the "Create Assistant" button in the app
- Use the "Load Demo Data" button to create sample assistants
- Check your VAPI dashboard to see existing assistants

### Issue 3: "Bad Request" errors
**Cause**: Multiple possible causes
**Solution**:
- Check browser console for detailed error messages
- Verify all required environment variables are set
- Restart your dev server after changing .env

### Issue 4: Still getting demo mode
**Cause**: Environment variables not loaded properly
**Solution**:
1. Make sure your .env file is in the project root (same level as package.json)
2. Restart your development server completely
3. Check that variable names match exactly (case-sensitive)

## 🧪 Testing Your Setup

1. **Go to the Meeting AI Agent tab**
2. **Click "Load Demo Data"** - this should create real VAPI assistants
3. **Create a meeting** with one of the assistants
4. **Start the meeting** - the AI agent should auto-connect within 2 seconds
5. **Check participant count** - should show "2 participants"

## 📞 Expected Behavior

When properly configured:
- ✅ AI agent automatically joins meetings when started
- ✅ Participant count shows "2 participants" (you + AI agent)
- ✅ Manual AI agent control works via the Bot button
- ✅ No "400 Bad Request" errors in console

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the browser console** for detailed error logs
2. **Verify your VAPI account** has sufficient credits/usage limits
3. **Test with a simple assistant** first before complex configurations
4. **Contact VAPI support** if the issue persists

## 📚 Additional Resources

- [VAPI Documentation](https://docs.vapi.ai)
- [VAPI Web SDK Guide](https://docs.vapi.ai/web-sdk)
- [VAPI Community Forum](https://community.vapi.ai)

## Quick Fix for "Assistant Does Not Exist" Error

If you're getting the error `"Couldn't Get Assistant. assistantId Does Not Exist"`, this is because you're using demo/invalid assistant IDs. Here's how to fix it:

### Step 1: Set Up VAPI Credentials

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai)
2. Create an account or log in
3. Get your API keys from the dashboard
4. Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env` with your real VAPI credentials:
```env
NEXT_PUBLIC_VAPI_API_KEY=pk_your_actual_public_key_here
VAPI_PRIVATE_KEY=sk_your_actual_private_key_here
VAPI_ORG_ID=your_actual_organization_id_here

# For Vite projects (alternative naming)
VITE_VAPI_PUBLIC_KEY=pk_your_actual_public_key_here
```

### Step 2: Clear Invalid Data

1. Open browser DevTools (F12)
2. Go to Application/Storage tab > Local Storage
3. Clear these keys:
   - `meeting_ai_agents`
   - `meetings`
   - `selected_ai_agent`
4. Refresh the page

### Step 3: Create New Assistants

1. Go to the Meeting AI Agent section
2. Click "Load Demo Data" to create real VAPI assistants
3. Or create assistants manually using "Create Assistant"

## Environment Variables

The project supports both naming conventions:

### For Vite/React projects:
```env
VITE_VAPI_PUBLIC_KEY=pk_your_key_here
```

### For Next.js projects:
```env
NEXT_PUBLIC_VAPI_API_KEY=pk_your_key_here
```

## Demo Mode

If no valid VAPI credentials are provided, the system runs in demo mode. Demo mode creates fake assistant IDs that don't work with the real VAPI API, causing the "Assistant Does Not Exist" error.

## Troubleshooting

### Error: "Assistant Does Not Exist"
- **Cause**: Using demo/fake assistant IDs
- **Solution**: Set up real VAPI credentials and clear localStorage data

### Error: "Authentication Failed"
- **Cause**: Invalid API keys
- **Solution**: Double-check your API keys in the VAPI dashboard

### Error: "CORS Error"
- **Cause**: Wrong environment or missing public key
- **Solution**: Ensure you're using the public key (starts with `pk_`)

## VAPI API Key Types

- **Public Key** (`pk_`): Used for client-side calls (web SDK)
- **Private Key** (`sk_`): Used for server-side calls (assistant creation)
- **Organization ID**: Your VAPI organization identifier

## Testing

Once configured correctly:
1. You should see real UUIDs in the browser console logs
2. Assistant creation should show "✅ VAPI assistant created successfully"
3. Voice calls should connect without the "Assistant Does Not Exist" error 