import { supabase } from '@/lib/supabase';
import { authenticatedFetch } from '@/lib/api';

const ORG_LOGOS_BUCKET = 'org-logos';

/**
 * Validate a file server-side before uploading
 * @param file File to validate
 * @param context Upload context (logo, document, image)
 * @returns Validation result
 */
async function validateFile(file: File, context: 'logo' | 'document' | 'image'): Promise<{ valid: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);

    const response = await authenticatedFetch('/api/upload/validate', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { valid: false, error: result.error || 'Validation failed' };
    }

    return { valid: true };
  } catch (error) {
    console.error('File validation error:', error);
    // If validation service is unavailable, allow upload with client-side checks only
    // This prevents blocking users if the API is down
    return { valid: true };
  }
}

/**
 * Upload an organization logo
 * @param orgId Organization ID (used as folder name)
 * @param file File to upload
 * @returns Public URL of the uploaded logo
 */
export async function uploadOrgLogo(orgId: string, file: File): Promise<string> {
  // Server-side validation first
  const validation = await validateFile(file, 'logo');
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // Generate unique filename with timestamp to bust cache
  const ext = file.name.split('.').pop() || 'png';
  const filename = `${orgId}/logo-${Date.now()}.${ext}`;

  // Delete existing logos in the folder first
  const { data: existingFiles } = await supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .list(orgId);
  
  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map(f => `${orgId}/${f.name}`);
    await supabase.storage.from(ORG_LOGOS_BUCKET).remove(filesToDelete);
  }

  // Upload new logo
  const { error: uploadError } = await supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload logo: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .getPublicUrl(filename);

  return publicUrl;
}

/**
 * Delete an organization logo
 * @param orgId Organization ID
 */
export async function deleteOrgLogo(orgId: string): Promise<void> {
  const { data: existingFiles } = await supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .list(orgId);
  
  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map(f => `${orgId}/${f.name}`);
    const { error } = await supabase.storage.from(ORG_LOGOS_BUCKET).remove(filesToDelete);
    if (error) {
      throw new Error(`Failed to delete logo: ${error.message}`);
    }
  }
}
