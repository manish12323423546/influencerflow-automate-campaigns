# 🚀 Production Deployment Guide

## 🔧 Fixing the Render.com Integration Issue

The error you're seeing indicates a URL formatting issue where double slashes are being created. Here's how to fix it:

### 1. **Environment Configuration**

Create a `.env.production` file in your frontend project:

```env
# Production Backend URL (Replace with your actual Render.com URL)
NEXT_PUBLIC_LANGGRAPH_BACKEND_URL=https://project-x-c0ml.onrender.com

# Agent Configuration
NEXT_PUBLIC_COPILOTKIT_AGENT_NAME=campaign_agent
```

### 2. **Backend URL Format**
Make sure your backend URL is formatted correctly:

✅ **CORRECT:** `https://project-x-c0ml.onrender.com` (no trailing slash)
❌ **INCORRECT:** `https://project-x-c0ml.onrender.com/` (trailing slash causes double slashes)

### 3. **Quick Fix for Current Deployment**

**Option A: Update via UI Settings Panel**
1. Open your deployed frontend
2. Navigate to Dashboard → AI Agent
3. Click the Settings (⚙️) button
4. Update Backend URL to: `https://project-x-c0ml.onrender.com`
5. Click "Update"

**Option B: Redeploy with Environment Variable**
Set the environment variable in your hosting platform:
```
NEXT_PUBLIC_LANGGRAPH_BACKEND_URL=https://project-x-c0ml.onrender.com
```

### 4. **Backend Deployment Checklist**

Ensure your LangGraph backend on Render.com has:

✅ **Port Configuration:** Running on port 8000
✅ **CORS Settings:** Allowing your frontend domain
✅ **CopilotKit Endpoint:** Available at `/copilotkit`
✅ **Health Check:** Available at `/health`
✅ **Info Endpoint:** Available at `/info`

### 5. **Test Backend Endpoints**

Verify these URLs work in your browser:

```bash
# Health Check
https://project-x-c0ml.onrender.com/health

# Info Check
https://project-x-c0ml.onrender.com/info

# CopilotKit endpoint (should return method not allowed for GET)
https://project-x-c0ml.onrender.com/copilotkit
```

### 6. **Frontend Deployment Configuration**

For **Vercel:**
```bash
# Set environment variable
vercel env add NEXT_PUBLIC_LANGGRAPH_BACKEND_URL
# Enter: https://project-x-c0ml.onrender.com
```

For **Netlify:**
```bash
# In Netlify dashboard, go to:
# Site settings → Environment variables
# Add: NEXT_PUBLIC_LANGGRAPH_BACKEND_URL = https://project-x-c0ml.onrender.com
```

For **Render.com (frontend):**
```bash
# In Render dashboard, go to:
# Environment → Add Environment Variable
# Key: NEXT_PUBLIC_LANGGRAPH_BACKEND_URL
# Value: https://project-x-c0ml.onrender.com
```

### 7. **Debug the Issue**

**Check Backend Logs:**
```bash
# Your backend should show these endpoints:
✅ GET  /health
✅ GET  /info  
✅ POST /copilotkit
✅ POST /v1/chat/completions
```

**Check Frontend Logs:**
```bash
# Should NOT see:
❌ /copilotkit//info (double slash)

# Should see:
✅ /copilotkit/info (single slash)
```

### 8. **Updated Code Applied**

The code I've updated includes:

✅ **URL Cleaning Function:** Prevents double slashes
✅ **Environment Variable Support:** Uses production backend URL
✅ **Better Error Handling:** Shows clear connection status
✅ **Dynamic Configuration:** Change backend URL without redeployment

### 9. **Testing the Fix**

1. **Deploy with the updated code**
2. **Set the environment variable:** `NEXT_PUBLIC_LANGGRAPH_BACKEND_URL=https://project-x-c0ml.onrender.com`
3. **Test the connection:** Should see "Connected to LangGraph Multi-Agent System"
4. **Check browser network tab:** No more double slashes in URLs

### 10. **Common Issues & Solutions**

**Issue:** Still getting 404 errors
**Solution:** 
- Verify backend is actually running on Render.com
- Check that CopilotKit integration is properly configured in your main.py
- Ensure CORS allows your frontend domain

**Issue:** Connection timeout
**Solution:**
- Render.com services can go to sleep; make a direct request to wake it up
- Consider using a service like UptimeRobot to keep it awake

**Issue:** Environment variable not loading
**Solution:**
- Make sure it starts with `NEXT_PUBLIC_` for client-side access
- Redeploy after setting environment variables
- Check browser dev tools → Sources → .env to verify

### 🎯 **Expected Result**

After applying these fixes, you should see:

✅ **No more 404 errors** for `/copilotkit//info`
✅ **Proper URL formatting:** `/copilotkit/info` 
✅ **Green connection status** in your AI Agent dashboard
✅ **Working chat interface** with your LangGraph backend

Your AI agent will be fully operational in production! 🚀 