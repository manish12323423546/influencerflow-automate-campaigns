/**
 * UUID Validation and Testing Utility
 * Helps debug UUID-related issues with VAPI
 */

export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateAssistantId = (id: string | undefined): { valid: boolean; reason: string } => {
  if (!id) return { valid: false, reason: 'ID is missing' };
  if (typeof id !== 'string') return { valid: false, reason: 'ID is not a string' };
  if (id.length === 0) return { valid: false, reason: 'ID is empty' };
  if (id.length !== 36) return { valid: false, reason: `ID length is ${id.length}, expected 36` };
  if (!isValidUUID(id)) return { valid: false, reason: 'ID is not a valid UUID format' };
  return { valid: true, reason: 'ID is valid' };
};

export const debugAssistantId = (id: string | undefined, context: string = '') => {
  const validation = validateAssistantId(id);
  
  console.log(`🔍 UUID Debug ${context}:`, {
    id,
    validation,
    length: id?.length,
    type: typeof id,
    sample: id?.substring(0, 8) + '...',
    timestamp: new Date().toISOString()
  });
  
  return validation;
};

// Test function to verify UUID generation
export const testUUIDGeneration = async () => {
  try {
    // Try dynamic import first (for client-side)
    const { v4: uuidv4 } = await import('uuid');
    const testId = uuidv4();
    const validation = validateAssistantId(testId);
    
    console.log('🧪 UUID Generation Test:', {
      generated: testId,
      validation,
      timestamp: new Date().toISOString()
    });
    
    return { testId, validation };
  } catch (error) {
    // Fallback for environments where uuid is not available
    console.error('🔴 UUID generation test failed:', error);
    return { 
      testId: 'test-failed', 
      validation: { valid: false, reason: 'UUID generation failed' } 
    };
  }
}; 