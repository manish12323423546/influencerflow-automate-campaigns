// Mock VAPI Service for AI Agent Functionality
// This simulates VAPI's functionality without requiring the actual package

export interface MockVAPIConfig {
  apiKey?: string;
  orgId?: string;
}

export interface MockAssistant {
  id: string;
  name: string;
  model: {
    model: string;
    provider: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
  };
  voice: string;
  firstMessage?: string;
}

export interface MockCallSession {
  id: string;
  assistantId: string;
  status: 'idle' | 'connecting' | 'connected' | 'ended';
  startTime?: Date;
  endTime?: Date;
  duration: number;
}

export class MockVAPIClient {
  private config: MockVAPIConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private currentCall: MockCallSession | null = null;
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition: any; // SpeechRecognition type
  
  constructor(config: MockVAPIConfig = {}) {
    this.config = config;
    this.speechSynthesis = window.speechSynthesis;
    
    // Initialize Speech Recognition if available
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new (window as any).webkitSpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
    } else if ('SpeechRecognition' in window) {
      this.speechRecognition = new (window as any).SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
    }
  }

  // Event management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Assistant management
  async createAssistant(assistant: Omit<MockAssistant, 'id'>): Promise<MockAssistant> {
    const newAssistant: MockAssistant = {
      id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...assistant
    };

    // Store in localStorage
    const assistants = this.getStoredAssistants();
    assistants.push(newAssistant);
    localStorage.setItem('vapi_mock_assistants', JSON.stringify(assistants));

    return newAssistant;
  }

  async getAssistants(): Promise<MockAssistant[]> {
    return this.getStoredAssistants();
  }

  private getStoredAssistants(): MockAssistant[] {
    try {
      const stored = localStorage.getItem('vapi_mock_assistants');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Call management
  async start(assistantId: string): Promise<void> {
    const assistants = this.getStoredAssistants();
    const assistant = assistants.find(a => a.id === assistantId);
    
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    this.currentCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assistantId,
      status: 'connecting',
      duration: 0,
      startTime: new Date()
    };

    this.emit('call-start', this.currentCall);

    // Simulate connection delay
    setTimeout(() => {
      if (this.currentCall) {
        this.currentCall.status = 'connected';
        this.emit('connected', this.currentCall);

        // Start speech recognition if available
        if (this.speechRecognition) {
          this.setupSpeechRecognition();
          this.speechRecognition.start();
        }

        // Send first message if available
        if (assistant.firstMessage) {
          setTimeout(() => {
            this.sendAIMessage(assistant.firstMessage!);
          }, 1000);
        }
      }
    }, 2000);
  }

  async stop(): Promise<void> {
    if (this.currentCall) {
      this.currentCall.status = 'ended';
      this.currentCall.endTime = new Date();
      this.currentCall.duration = this.currentCall.endTime.getTime() - (this.currentCall.startTime?.getTime() || 0);

      // Stop speech recognition
      if (this.speechRecognition) {
        this.speechRecognition.stop();
      }

      this.emit('call-end', this.currentCall);
      this.currentCall = null;
    }
  }

  private setupSpeechRecognition() {
    if (!this.speechRecognition) return;

    this.speechRecognition.onstart = () => {
      this.emit('speech-start');
    };

    this.speechRecognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript;
        this.emit('user-speech', { transcript });
        
        // Simulate AI response after user speech
        setTimeout(() => {
          this.generateAIResponse(transcript);
        }, 1000);
      }
    };

    this.speechRecognition.onend = () => {
      this.emit('speech-end');
      // Restart if call is still active
      if (this.currentCall && this.currentCall.status === 'connected') {
        setTimeout(() => {
          if (this.speechRecognition && this.currentCall?.status === 'connected') {
            this.speechRecognition.start();
          }
        }, 100);
      }
    };

    this.speechRecognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', { error: event.error });
    };
  }

  private async generateAIResponse(userInput: string): Promise<void> {
    // Simple AI response generation (you can replace this with actual AI API calls)
    const responses = [
      "I understand your question about brand partnerships. Let me help you with that.",
      "That's a great point about influencer marketing. Here's what I think...",
      "Based on current market trends, I'd recommend the following approach...",
      "Let me provide you with some insights on campaign optimization.",
      "That's an interesting challenge. Here's how we could approach it...",
      "I can help you analyze the performance metrics for better results.",
      "Would you like me to create a detailed strategy for your campaign?",
      "I have some recommendations based on successful similar campaigns."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add some context based on user input
    let contextualResponse = randomResponse;
    if (userInput.toLowerCase().includes('campaign')) {
      contextualResponse = "I see you're asking about campaigns. " + randomResponse;
    } else if (userInput.toLowerCase().includes('influencer')) {
      contextualResponse = "Regarding influencer partnerships, " + randomResponse;
    } else if (userInput.toLowerCase().includes('budget') || userInput.toLowerCase().includes('cost')) {
      contextualResponse = "For budget optimization, " + randomResponse;
    }

    this.sendAIMessage(contextualResponse);
  }

  private sendAIMessage(message: string): void {
    this.emit('message', { 
      type: 'assistant',
      message,
      timestamp: new Date().toISOString()
    });

    // Use speech synthesis to speak the message
    if (this.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        this.emit('speech-start');
      };

      utterance.onend = () => {
        this.emit('speech-end');
      };

      this.speechSynthesis.speak(utterance);
    }
  }

  // Utility methods
  getCurrentCall(): MockCallSession | null {
    return this.currentCall;
  }

  isCallActive(): boolean {
    return this.currentCall !== null && this.currentCall.status === 'connected';
  }

  // Simulate sending a test message
  sendTestMessage(message: string): void {
    if (this.isCallActive()) {
      this.generateAIResponse(message);
    }
  }
}

// Server-side mock for assistant creation
export class MockVAPIServer {
  constructor(private token: string) {}

  assistants = {
    create: async (assistant: Omit<MockAssistant, 'id'>): Promise<MockAssistant> => {
      // This would normally make an API call to VAPI servers
      // For now, we'll just simulate it locally
      const mockClient = new MockVAPIClient();
      return mockClient.createAssistant(assistant);
    },

    list: async (): Promise<MockAssistant[]> => {
      const mockClient = new MockVAPIClient();
      return mockClient.getAssistants();
    }
  };
}

// Default export for easy importing
export default MockVAPIClient; 