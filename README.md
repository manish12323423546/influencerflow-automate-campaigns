# InfluencerFlow AI Platform

A modern platform for managing influencer marketing campaigns with AI-powered automation.

## Features

### Conversation Management
- **Manual Mode**: Traditional conversation interface for direct communication with influencers
- **AI Assistants**: Three specialized AI agents to help with different aspects of influencer management:
  - **Outreach Assistant**: Helps find and connect with relevant influencers
  - **Campaign Assistant**: Manages campaign performance and optimization
  - **Contract Assistant**: Assists with contract creation and management

### AI Agent Capabilities
- Intelligent influencer search based on campaign requirements
- Data-driven campaign performance analysis
- Automated contract drafting with customizable terms
- Real-time analytics and insights
- Conversation memory and context awareness

### User Interface
- Modern, responsive design with dark mode
- Real-time typing indicators for AI responses
- Audio playback for conversation recordings
- Detailed conversation transcripts
- Comprehensive analytics dashboard

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/influencerflow-automate-campaigns.git
cd influencerflow-automate-campaigns
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following:
```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI/ML**: LangChain, OpenAI gpt-4o-mini
- **Database**: Supabase
- **Voice**: ElevenLabs
- **State Management**: React Hooks
- **Routing**: React Router
- **UI Components**: Radix UI

## Architecture

The platform uses a modular architecture with the following key components:

- **ConversationAgent**: Core AI agent class that manages conversations
- **Custom Tools**: Specialized tools for influencer management tasks
- **Memory System**: Maintains conversation context and history
- **UI Components**: Modular React components for different features

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Campaign Automation Agent

A powerful autonomous agent system for automating influencer campaign management using LangChain and gpt-4o-mini.

## Features

- **Automated Campaign Management**: Fully automated or manual mode for campaign execution
- **Intelligent Creator Selection**: Uses existing creator discovery system
- **Contract Generation**: Automated contract creation and sending
- **Multi-Channel Communication**: Integrated email and phone call capabilities
- **Response Analysis**: Automated analysis of communications and responses
- **Real-time Progress Tracking**: Beautiful UI for monitoring automation progress

## System Components

1. **CampaignAutomationAgent**: Core agent class that orchestrates the automation process
2. **Custom Tools**: 
   - Creator Search
   - Contract Generation
   - Email Communication
   - Phone Calls
   - Transcript Analysis

3. **User Interface**:
   - Progress tracking
   - Status updates
   - Communication logs
   - Error handling

## Usage

1. Import the AutomationInterface component:

```typescript
import { AutomationInterface } from '@/components/campaign/AutomationInterface';
```

2. Use it in your campaign creation flow:

```typescript
const CampaignPage = () => {
  const handleComplete = (state: CampaignState) => {
    // Handle completion
  };

  return (
    <AutomationInterface
      campaignId="campaign-123"
      mode="AUTOMATIC"
      onComplete={handleComplete}
    />
  );
};
```

## Configuration

The agent can be configured in two modes:

1. **AUTOMATIC**: Full automation with minimal user intervention
2. **MANUAL**: Step-by-step automation with user approval at key points

## Integration Points

The system integrates with existing services:

- Creator Discovery System
- Gmail API (via webhooks)
- Phone System
- Contract Management System

## State Management

The automation process follows these states:

1. INITIATED
2. CREATOR_SEARCH
3. CONTRACT_PHASE
4. OUTREACH
5. RESPONSE_PROCESSING
6. COMPLETED

## Error Handling

The system includes comprehensive error handling:
- Graceful failure recovery
- Detailed error reporting
- State preservation
- Manual intervention options

## Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
OPENAI_API_KEY=your_key_here
```

3. Run the development server:
```bash
npm run dev
```

## Security Considerations

- API keys are handled securely
- User permissions are respected
- Data access is controlled
- Communication logs are encrypted

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
