// Environment Configuration and Validation System
// Based on webinar-ai-main implementation with improvements

export interface EnvironmentConfig {
  // VAPI Configuration
  vapi: {
    orgId: string | undefined;
    privateKey: string | undefined;
    publicKey: string | undefined;
    isConfigured: boolean;
    mode: 'production' | 'demo';
  };
  
  // OpenAI Configuration
  openai: {
    apiKey: string | undefined;
    isConfigured: boolean;
  };
  
  // Other API Configuration
  elevenlabs: {
    apiKey: string | undefined;
    isConfigured: boolean;
  };
  
  // Overall status
  isProductionReady: boolean;
  hasCriticalMissing: boolean;
  demoMode: boolean;
}

// Environment variable detection with multiple naming conventions
const getEnvironmentVariable = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
};

// Validate VAPI configuration
const validateVapiConfig = () => {
  const orgId = getEnvironmentVariable([
    'VAPI_ORG_ID',
    'NEXT_PUBLIC_VAPI_ORG_ID',
    'REACT_APP_VAPI_ORG_ID'
  ]);
  
  const privateKey = getEnvironmentVariable([
    'VAPI_PRIVATE_KEY',
    'VAPI_PRIVATE_KEY_SECRET',
    'NEXT_PUBLIC_VAPI_PRIVATE_KEY'
  ]);
  
  const publicKey = getEnvironmentVariable([
    'NEXT_PUBLIC_VAPI_PUBLIC_KEY',
    'VITE_VAPI_PUBLIC_KEY',
    'REACT_APP_VAPI_PUBLIC_KEY',
    'NEXT_PUBLIC_VAPI_API_KEY',
    'VITE_VAPI_API_KEY'
  ]);
  
  const isConfigured = !!(orgId && privateKey && publicKey);
  
  return {
    orgId,
    privateKey,
    publicKey,
    isConfigured,
    mode: isConfigured ? 'production' as const : 'demo' as const
  };
};

// Validate OpenAI configuration
const validateOpenAIConfig = () => {
  const apiKey = getEnvironmentVariable([
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'REACT_APP_OPENAI_API_KEY'
  ]);
  
  return {
    apiKey,
    isConfigured: !!apiKey
  };
};

// Validate ElevenLabs configuration
const validateElevenLabsConfig = () => {
  const apiKey = getEnvironmentVariable([
    'ELEVENLABS_API_KEY',
    'NEXT_PUBLIC_ELEVENLABS_API_KEY',
    'REACT_APP_ELEVENLABS_API_KEY'
  ]);
  
  return {
    apiKey,
    isConfigured: !!apiKey
  };
};

// Main configuration validation
export const validateEnvironment = (): EnvironmentConfig => {
  const vapi = validateVapiConfig();
  const openai = validateOpenAIConfig();
  const elevenlabs = validateElevenLabsConfig();
  
  const isProductionReady = vapi.isConfigured && openai.isConfigured;
  const hasCriticalMissing = !vapi.isConfigured || !openai.isConfigured;
  const demoMode = !vapi.isConfigured;
  
  return {
    vapi,
    openai,
    elevenlabs,
    isProductionReady,
    hasCriticalMissing,
    demoMode
  };
};

// Get current environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  return validateEnvironment();
};

// Environment status logging
export const logEnvironmentStatus = () => {
  const config = getEnvironmentConfig();
  
  console.log('\n🔧 Environment Configuration Status:');
  console.log('=====================================');
  console.log(`🎯 Mode: ${config.demoMode ? '🎭 DEMO' : '🚀 PRODUCTION'}`);
  console.log(`📊 Overall Status: ${config.isProductionReady ? '✅ Ready' : '⚠️ Limited'}`);
  console.log('');
  
  // VAPI Status
  console.log('🎤 VAPI Configuration:');
  console.log(`  - Status: ${config.vapi.isConfigured ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  - Org ID: ${config.vapi.orgId ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - Private Key: ${config.vapi.privateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - Public Key: ${config.vapi.publicKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - Mode: ${config.vapi.mode}`);
  console.log('');
  
  // OpenAI Status
  console.log('🤖 OpenAI Configuration:');
  console.log(`  - API Key: ${config.openai.isConfigured ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  // ElevenLabs Status
  console.log('🎵 ElevenLabs Configuration:');
  console.log(`  - API Key: ${config.elevenlabs.isConfigured ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (config.hasCriticalMissing) {
    console.log('⚠️ Critical Configuration Missing:');
    if (!config.vapi.isConfigured) {
      console.log('  - VAPI credentials required for voice features');
    }
    if (!config.openai.isConfigured) {
      console.log('  - OpenAI API key required for AI features');
    }
    console.log('  - Application will run in demo mode with limited functionality');
    console.log('');
  }
  
  if (config.isProductionReady) {
    console.log('🎉 All systems ready for production deployment!');
  } else {
    console.log('🎭 Running in demo mode - perfect for development and testing');
  }
  
  console.log('=====================================\n');
  
  return config;
};

// Environment configuration warnings
export const showConfigurationWarnings = () => {
  const config = getEnvironmentConfig();
  
  if (config.demoMode) {
    console.warn('\n🟡 DEMO MODE ACTIVE');
    console.warn('==================');
    console.warn('The application is running in demo mode because VAPI');
    console.warn('credentials are not configured. Voice features will be');
    console.warn('simulated for development purposes.');
    console.warn('');
    console.warn('To enable production features, please set:');
    console.warn('- VAPI_ORG_ID');
    console.warn('- VAPI_PRIVATE_KEY'); 
    console.warn('- NEXT_PUBLIC_VAPI_PUBLIC_KEY');
    console.warn('- OPENAI_API_KEY');
    console.warn('==================\n');
  }
};

// Check if specific features are available
export const isFeatureAvailable = (feature: 'voice' | 'ai' | 'tts') => {
  const config = getEnvironmentConfig();
  
  switch (feature) {
    case 'voice':
      return config.vapi.isConfigured;
    case 'ai':
      return config.openai.isConfigured;
    case 'tts':
      return config.elevenlabs.isConfigured;
    default:
      return false;
  }
};

// Environment configuration for different environments
export const ENVIRONMENT_CONFIGS = {
  development: {
    logLevel: 'debug',
    enableMocking: true,
    showWarnings: true
  },
  production: {
    logLevel: 'info',
    enableMocking: false,
    showWarnings: false
  },
  test: {
    logLevel: 'error',
    enableMocking: true,
    showWarnings: false
  }
};

// Get current environment mode
export const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Initialize environment on import (for server-side)
if (typeof window === 'undefined') {
  const config = logEnvironmentStatus();
  if (getCurrentEnvironment() === 'development') {
    showConfigurationWarnings();
  }
} 