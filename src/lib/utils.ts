import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates required ElevenLabs environment variables
 * @returns Object with validated environment variables
 * @throws Error if any required variables are missing
 */
export function validateElevenLabsEnvVars() {
  const requiredVars = {
    VITE_ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY,
    VITE_ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
    VITE_ELEVENLABS_PHONE_NUMBER_ID: import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return requiredVars;
}
