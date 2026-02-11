'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import * as storageService from '@/services/storage-service';
import { Button } from '@/components/ui/button';
import { 
  Upload, Trash2, Check, AlertCircle, Palette, Image as ImageIcon,
  Building2, Package, FileText, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Preset brand colors
const PRESET_COLORS = [
  { name: 'Purple', value: '#9333ea' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
];

interface BrandDocument {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image';
  size: number;
  uploadedAt: string;
}

export function BrandingEditor() {
  const { organization, refreshOrganizations, isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandDocsInputRef = useRef<HTMLInputElement>(null);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logoUrl || null);
  const [brandColor, setBrandColor] = useState(organization?.brandColor || '#9333ea');
  const [customColor, setCustomColor] = useState(organization?.brandColor || '#9333ea');
  
  // AI Context fields
  const [companyDescription, setCompanyDescription] = useState<string>(
    (organization?.settings?.companyDescription as string) || ''
  );
  const [productDescription, setProductDescription] = useState<string>(
    (organization?.settings?.productDescription as string) || ''
  );
  const [brandDocuments, setBrandDocuments] = useState<BrandDocument[]>(
    (organization?.settings?.brandDocuments as BrandDocument[]) || []
  );
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Track if there are unsaved changes
  const hasChanges = logoUrl !== organization?.logoUrl || 
    brandColor !== organization?.brandColor ||
    companyDescription !== (organization?.settings?.companyDescription || '') ||
    productDescription !== (organization?.settings?.productDescription || '');

  useEffect(() => {
    if (organization) {
      setLogoUrl(organization.logoUrl);
      setBrandColor(organization.brandColor || '#9333ea');
      setCustomColor(organization.brandColor || '#9333ea');
      setCompanyDescription((organization.settings?.companyDescription as string) || '');
      setProductDescription((organization.settings?.productDescription as string) || '');
      setBrandDocuments((organization.settings?.brandDocuments as BrandDocument[]) || []);
    }
  }, [organization]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, GIF, WebP, or SVG file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be under 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const url = await storageService.uploadOrgLogo(organization.id, file);
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    }

    setIsUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization) return;

    setIsUploading(true);
    setError(null);

    try {
      await storageService.deleteOrgLogo(organization.id);
      setLogoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    }

    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!organization) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.updateOrganization(organization.id, {
        logoUrl,
        brandColor,
        settings: {
          ...organization.settings,
          companyDescription,
          productDescription,
          brandDocuments,
        },
      });
      await refreshOrganizations();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }

    setIsSaving(false);
  };

  const handleBrandDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !organization) return;

    setIsUploadingDoc(true);
    setError(null);

    try {
      const newDocs: BrandDocument[] = [];
      
      for (const file of files) {
        // Validate file type
        const validTypes = [
          'application/pdf', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp',
        ];
        
        if (!validTypes.includes(file.type)) {
          setError(`${file.name}: Unsupported file type. Use PDF, DOC, DOCX, TXT, MD, or images.`);
          continue;
        }

        // Validate size (10MB max per file)
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name}: File too large. Max 10MB per file.`);
          continue;
        }

        // Upload to Supabase storage
        const fileName = `${organization.id}/brand-docs/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('org-assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('org-assets')
          .getPublicUrl(fileName);

        newDocs.push({
          id: crypto.randomUUID(),
          name: file.name,
          url: urlData.publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      setBrandDocuments(prev => [...prev, ...newDocs]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    }

    setIsUploadingDoc(false);
    if (brandDocsInputRef.current) {
      brandDocsInputRef.current.value = '';
    }
  };

  const handleRemoveBrandDoc = async (docId: string) => {
    const doc = brandDocuments.find(d => d.id === docId);
    if (!doc || !organization) return;

    try {
      // Try to delete from storage (may fail if URL format changed)
      const path = doc.url.split('/org-assets/')[1];
      if (path) {
        await supabase.storage.from('org-assets').remove([path]);
      }
    } catch {
      // Ignore storage errors, still remove from list
    }

    setBrandDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleColorSelect = (color: string) => {
    setBrandColor(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setBrandColor(color);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8 text-text-secondary">
        Only admins can edit branding settings.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
          <Check size={16} />
          Branding saved successfully
        </div>
      )}

      {/* Logo Section */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <ImageIcon size={16} className="text-text-tertiary" />
          Organization Logo
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Appears in the sidebar and exports. PNG, JPG, GIF, WebP, or SVG. Max 2MB.
        </p>

        <div className="flex items-start gap-4">
          {/* Logo Preview */}
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-bg-tertiary flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Organization logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon size={32} className="text-text-tertiary" />
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
            >
              <Upload size={14} />
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="text-error hover:text-error"
              >
                <Trash2 size={14} />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Color Section */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <Palette size={16} className="text-text-tertiary" />
          Brand Color
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Used as the accent color throughout the app.
        </p>

        {/* Color Preview */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: brandColor }}
          />
          <div>
            <p className="text-sm font-medium text-text-primary">{brandColor}</p>
            <p className="text-xs text-text-secondary">Current brand color</p>
          </div>
        </div>

        {/* Preset Colors */}
        <div className="mb-4">
          <p className="text-xs text-text-tertiary mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  brandColor === color.value
                    ? 'border-text-primary scale-110'
                    : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        <div>
          <p className="text-xs text-text-tertiary mb-2">Custom color</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 rounded-lg cursor-pointer border border-border"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val);
                  if (val.length === 7) {
                    setBrandColor(val);
                  }
                }
              }}
              placeholder="#9333ea"
              className="w-28 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* AI Context Section */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <Building2 size={16} className="text-text-tertiary" />
          Company Description
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          Used by AI to understand your business when generating content.
        </p>
        <textarea
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          placeholder="Describe your company, what you do, your target market, key differentiators..."
          className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
          rows={3}
        />
        <p className="text-xs text-text-tertiary mt-1 text-right">
          {companyDescription.length} characters
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <Package size={16} className="text-text-tertiary" />
          Product/Service Description
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          Describe your products or services so AI can reference them in generated content.
        </p>
        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Describe your main products/services, features, benefits, use cases..."
          className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
          rows={3}
        />
        <p className="text-xs text-text-tertiary mt-1 text-right">
          {productDescription.length} characters
        </p>
      </div>

      {/* Brand Documents Section */}
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-2">
          <FileText size={16} className="text-text-tertiary" />
          Brand Documents
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          Upload documents or images about your company that AI can reference (brochures, one-pagers, product specs). Large documents will be chunked automatically.
        </p>

        <input
          ref={brandDocsInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,image/png,image/jpeg,image/gif,image/webp"
          onChange={handleBrandDocUpload}
          multiple
          className="hidden"
        />

        {/* Document List */}
        {brandDocuments.length > 0 && (
          <div className="mb-3 space-y-2">
            {brandDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-tertiary border border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {doc.type === 'image' ? (
                    <ImageIcon size={16} className="text-text-tertiary shrink-0" />
                  ) : (
                    <FileText size={16} className="text-text-tertiary shrink-0" />
                  )}
                  <span className="text-sm text-text-primary truncate">{doc.name}</span>
                  <span className="text-xs text-text-tertiary shrink-0">
                    ({formatFileSize(doc.size)})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveBrandDoc(doc.id)}
                  className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-error transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => brandDocsInputRef.current?.click()}
          disabled={isUploadingDoc}
        >
          {isUploadingDoc ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              Upload Documents
            </>
          )}
        </Button>
        <p className="text-xs text-text-tertiary mt-2">
          Supported: PDF, DOC, DOCX, TXT, MD, PNG, JPG, GIF, WebP. Max 10MB per file.
        </p>
      </div>

      {/* Preview Section */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3">Preview</h3>
        <div className="p-4 rounded-xl bg-sidebar-bg border border-border">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {organization?.name?.[0]?.toUpperCase() || 'B'}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{organization?.name || 'Organization'}</p>
              <p className="text-xs text-white/60">Trade Show HQ</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: brandColor }}
            >
              Primary Button
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={!hasChanges}
        >
          <Check size={14} /> Save Branding
        </Button>
        {hasChanges && (
          <span className="ml-3 text-xs text-text-tertiary">You have unsaved changes</span>
        )}
      </div>
    </div>
  );
}
