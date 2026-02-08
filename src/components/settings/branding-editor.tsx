'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import * as storageService from '@/services/storage-service';
import { Button } from '@/components/ui/button';
import { 
  Upload, Trash2, Check, AlertCircle, Palette, Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function BrandingEditor() {
  const { organization, refreshOrganizations, isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logoUrl || null);
  const [brandColor, setBrandColor] = useState(organization?.brandColor || '#9333ea');
  const [customColor, setCustomColor] = useState(organization?.brandColor || '#9333ea');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Track if there are unsaved changes
  const hasChanges = logoUrl !== organization?.logoUrl || brandColor !== organization?.brandColor;

  useEffect(() => {
    if (organization) {
      setLogoUrl(organization.logoUrl);
      setBrandColor(organization.brandColor || '#9333ea');
      setCustomColor(organization.brandColor || '#9333ea');
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
      });
      await refreshOrganizations();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }

    setIsSaving(false);
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

      {/* Preview Section */}
      <div>
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
