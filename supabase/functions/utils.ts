// Shared utility functions for Edge Functions

/**
 * Uploads a file to Supabase Storage and returns URLs
 * @param client Supabase client with appropriate permissions
 * @param bucket Storage bucket name
 * @param path Path within the bucket
 * @param fileData Binary file data
 * @param contentType MIME type of the file
 * @param upsert Whether to overwrite existing files
 * @returns Object with path, signedUrl, and publicUrl
 */
export async function uploadFileToStorage(
  client: any,
  bucket: string,
  path: string,
  fileData: Uint8Array,
  contentType: string = 'application/octet-stream',
  upsert: boolean = true
) {
  // Upload the file
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path, fileData, {
      contentType,
      upsert,
    });

  if (uploadError) {
    console.error(`Upload error for ${path}:`, uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Create a signed URL for immediate download (60 seconds)
  const { data: signedData, error: signedError } = await client.storage
    .from(bucket)
    .createSignedUrl(path, 60, { download: true });

  if (signedError) {
    console.error(`Signed URL error for ${path}:`, signedError);
    throw new Error(`Failed to create signed URL: ${signedError.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = client.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path,
    signedUrl: signedData.signedUrl,
    publicUrl: publicUrlData.publicUrl,
  };
}

/**
 * Validates an HTML template and checks for required placeholders
 * @param template HTML template string
 * @param requiredPlaceholders Array of placeholder strings that must be present
 * @returns Object with validation result
 */
export function validateHtmlTemplate(
  template: string,
  requiredPlaceholders: string[] = []
) {
  // Basic validation
  if (!template || template.length < 100) {
    return {
      valid: false,
      error: "Invalid or empty template",
      templateLength: template?.length || 0,
    };
  }

  // Check for required placeholders
  const missingPlaceholders: string[] = [];
  for (const placeholder of requiredPlaceholders) {
    if (!template.includes(placeholder)) {
      missingPlaceholders.push(placeholder);
    }
  }

  if (missingPlaceholders.length > 0) {
    return {
      valid: false,
      error: "Missing required placeholders",
      missingPlaceholders,
    };
  }

  return { valid: true };
}

/**
 * Efficiently replaces all placeholders in a template with their values
 * @param template Template string with placeholders like {{variable_name}}
 * @param variables Object with key-value pairs for replacement
 * @returns Processed template with all placeholders replaced
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Formats a date as a locale string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Formats a number as currency
 * @param value Number to format
 * @param currency Currency code
 * @param locale Locale string
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Validates file size
 * @param fileSize Size in bytes
 * @param maxSize Maximum allowed size in bytes
 * @returns Object with validation result
 */
export function validateFileSize(fileSize: number, maxSize: number) {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
      fileSize,
      maxSize,
    };
  }
  return { valid: true };
}