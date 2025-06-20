# Meeting AI Agent - Complete Feature Guide

## 🎯 Overview

The Meeting AI Agent feature allows you to create AI-powered voice agents, schedule meetings with them, and conduct real-time voice conversations. This feature is built with:

- **Local Storage**: All data is stored locally (no external database required)
- **Mock VAPI Integration**: Simulates real VAPI functionality
- **Browser Speech APIs**: Uses Web Speech API for voice recognition and synthesis
- **Real-time Communication**: Live voice conversations with AI agents

## 🚀 Features

### 1. AI Agent Creation
- Create custom AI agents with different personalities
- Configure voice, model (GPT-4o, GPT-4o Mini, etc.)
- Set custom system prompts or use presets
- Adjust temperature for response creativity

### 2. Meeting Management
- Schedule meetings with your AI agents
- Set meeting duration and descriptions
- Generate shareable meeting URLs
- Track meeting status (Scheduled, Live, Ended)

### 3. Live Voice Sessions
- Real-time voice conversations with AI agents
- Speech recognition for user input
- Text-to-speech for AI responses
- Live transcript of conversations
- Audio controls (mute, unmute, end call)

## 📋 How to Use

### Step 1: Access Meeting AI Agent
1. Open your InfluencerFlow dashboard
2. Click on the **"Meeting AI Agent"** tab in the navigation
3. You'll see three main tabs: AI Agents, Meetings, and Live Session

### Step 2: Create Your First AI Agent

1. **Go to the AI Agents tab**
2. **Click "Create AI Agent"**
3. **Fill in the details:**
   - **Name**: e.g., "Brand Partnership Assistant"
   - **Description**: Brief description of the agent's purpose
   - **System Prompt**: Choose from presets or write custom prompt
     - **Brand Rep**: For brand partnership discussions
     - **Sales Agent**: For sales conversations
     - **Support**: For customer support interactions
   - **Voice**: Choose from available voices (Alloy, Echo, Fable, etc.)
   - **Model**: Select AI model (GPT-4o recommended)
   - **Temperature**: Control creativity (0.7 is balanced)

4. **Click "Create Agent"**

### Step 3: Create a Meeting

1. **Go to the Meetings tab**
2. **Click "Create Meeting"**
3. **Fill in meeting details:**
   - **Title**: e.g., "Brand Partnership Discussion"
   - **Description**: Meeting agenda and objectives
   - **AI Agent**: Select from your created agents
   - **Duration**: Set meeting length (5-180 minutes)

4. **Click "Create Meeting"**

### Step 4: Start a Live Session

1. **Find your meeting in the Meetings tab**
2. **Click the "Start" button**
3. **You'll be taken to the Live Session tab**
4. **Allow microphone permissions when prompted**
5. **The AI agent will greet you and the conversation begins!**

## 🎮 Live Session Controls

### Video Interface
- **AI Agent Avatar**: Visual representation of the speaking AI
- **Speaking Indicator**: Shows when AI is speaking (animated dots)
- **Connection Status**: Displays current connection status

### Control Buttons
- **🎤 Microphone**: Toggle mute/unmute
- **💬 Test Response**: Trigger a test AI response
- **⏹️ End Call**: Stop the current session

### Conversation Transcript
- **Real-time transcript**: See all spoken words in real-time
- **Timestamps**: Each message includes time stamps
- **Speaker Identification**: Clearly shows "You" vs "AI" messages
- **Auto-scroll**: Automatically scrolls to latest messages

## 🧠 AI Agent Presets

### Brand Representative
```
You are a professional brand representative AI assistant. You help with:
- Brand partnerships and collaborations
- Campaign planning and strategy
- Influencer relationship management
- Contract negotiations
- Performance analytics
Be friendly, professional, and knowledgeable about marketing trends.
```

### Sales Agent
```
You are an expert sales AI agent. Your role is to:
- Qualify leads and understand client needs
- Present product/service benefits clearly
- Handle objections professionally
- Close deals and schedule follow-ups
- Provide excellent customer service
Be persuasive, empathetic, and results-oriented.
```

### Customer Support
```
You are a helpful customer support AI agent. You assist with:
- Answering product questions
- Troubleshooting technical issues
- Processing requests and complaints
- Providing guidance and tutorials
- Escalating complex issues when needed
Be patient, helpful, and solution-focused.
```

## 🔧 Technical Features

### Local Storage Architecture
- **AI Agents**: `meeting_ai_agents` - Stores agent configurations
- **Meetings**: `meetings` - Stores meeting data
- **VAPI Assistants**: `vapi_mock_assistants` - Stores VAPI assistant data

### Mock VAPI Integration
- Simulates real VAPI functionality without requiring API keys
- Supports all major VAPI features:
  - Assistant creation and management
  - Call start/stop functionality
  - Speech recognition and synthesis
  - Event-driven communication
  - Real-time transcript generation

### Browser APIs Used
- **Web Speech API**: For speech recognition
- **Speech Synthesis API**: For text-to-speech
- **Local Storage API**: For data persistence
- **Media Devices API**: For microphone access

## 🎯 Use Cases

### 1. Brand Partnership Meetings
- Create a "Brand Rep" AI agent
- Schedule meetings with potential influencers
- Discuss collaboration opportunities
- Handle initial negotiations

### 2. Sales Calls
- Create a "Sales Agent" AI
- Conduct product demos
- Qualify leads
- Handle objections

### 3. Customer Support
- Create a "Support Agent" AI
- Provide 24/7 customer assistance
- Handle common inquiries
- Escalate complex issues

### 4. Training and Testing
- Test conversation flows
- Train team members on AI interactions
- Develop better prompts and responses
- Analyze conversation patterns

## 🔒 Privacy & Security

- **No External APIs**: All processing happens locally
- **No Data Transmission**: Your conversations never leave your browser
- **Local Storage Only**: All data stored in browser's local storage
- **No Authentication Required**: Works without login
- **HTTPS Recommended**: For microphone access in production

## 🚀 Getting Started Examples

### Example 1: Simple Brand Agent
```
Name: "Marketing Assistant"
Description: "Helps with marketing strategies"
Prompt: [Use Brand Rep preset]
Voice: "Alloy"
Model: "gpt-4o"
Temperature: 0.7
```

### Example 2: Custom Sales Agent
```
Name: "Product Demo Expert"
Description: "Specialized in product demonstrations"
Prompt: "You are an expert at demonstrating SaaS products. Focus on showing value, handling objections, and closing deals. Be enthusiastic and knowledgeable."
Voice: "Nova"
Model: "gpt-4o"
Temperature: 0.8
```

## 🔧 Troubleshooting

### Microphone Issues
- **Check permissions**: Ensure microphone access is allowed
- **Check browser support**: Use Chrome, Firefox, or Safari
- **HTTPS required**: Microphone access requires secure connection

### Speech Recognition Issues
- **Speak clearly**: Ensure clear pronunciation
- **Reduce background noise**: Use in quiet environment
- **Check language settings**: Currently set to English (US)

### Audio Playback Issues
- **Check volume**: Ensure system volume is up
- **Check browser audio**: Ensure browser audio is not muted
- **Try different browser**: Some browsers have better speech synthesis

### Connection Issues
- **Refresh page**: Try refreshing if connection fails
- **Clear local storage**: Reset all data if needed
- **Check console**: Look for error messages in browser console

## 🎉 Success Tips

1. **Start Simple**: Begin with preset prompts and gradually customize
2. **Test Thoroughly**: Try different conversation flows before important meetings
3. **Use Good Audio**: Quality microphone improves recognition accuracy
4. **Set Expectations**: Let participants know they're talking to an AI
5. **Monitor Performance**: Review transcripts to improve AI responses
6. **Iterate Prompts**: Refine system prompts based on actual conversations

## 🔮 Future Enhancements

This mock implementation can be easily upgraded to use real services:

- **Real VAPI Integration**: Replace mock with actual VAPI SDK
- **Real AI Models**: Connect to OpenAI, Anthropic, or other AI providers
- **Video Streaming**: Add video capabilities with Stream.io
- **Database Storage**: Replace localStorage with real database
- **Authentication**: Add user management and authentication
- **Analytics**: Track conversation metrics and performance
- **Integrations**: Connect with CRM, calendar, and other tools

---

## 🎯 Ready to Get Started?

1. Navigate to your dashboard
2. Click on "Meeting AI Agent"
3. Create your first AI agent
4. Schedule a meeting
5. Start talking!

**Note**: This feature uses your browser's built-in speech capabilities, so make sure you're using a modern browser with microphone access enabled.

Happy conversing! 🎤✨ 