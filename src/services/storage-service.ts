import { supabase } from '@/lib/supabase';

const ORG_LOGOS_BUCKET = 'org-logos';

/**
 * Upload an organization logo
 * @param orgId Organization ID (used as folder name)
 * @param file File to upload
 * @returns Public URL of the uploaded logo
 */
export async function uploadOrgLogo(orgId: string, file: File): Promise<string> {
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
