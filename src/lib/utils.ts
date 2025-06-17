import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans environment variable values by removing surrounding quotes and trimming whitespace
 * This is useful when environment variables are stored with quotes in .env files
 * @param value - The raw environment variable value
 * @returns Cleaned string value
 */
export function cleanEnvVar(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/^["']|["']$/g, '').trim();
}

/**
 * Validates required ElevenLabs environment variables
 * @returns Object with validated environment variables
 * @throws Error if any required variables are missing
 */
export function validateElevenLabsEnvVars() {
  const requiredVars = {
    VITE_ELEVENLABS_API_KEY: cleanEnvVar(import.meta.env.VITE_ELEVENLABS_API_KEY),
    VITE_ELEVENLABS_AGENT_ID: cleanEnvVar(import.meta.env.VITE_ELEVENLABS_AGENT_ID),
    VITE_ELEVENLABS_PHONE_NUMBER_ID: cleanEnvVar(import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID)
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return requiredVars;
}
