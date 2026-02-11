'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTradeShowStore } from '@/store/trade-show-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, FileStack, Trash2, Check } from 'lucide-react';

interface TemplateModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
  onSaved?: () => void;
  onLoaded?: () => void;
}

export function TemplateModal({ mode, onClose, onSaved, onLoaded }: TemplateModalProps) {
  const { templates, loadTemplates, saveAsTemplate, createFromTemplate, deleteTemplate, selectedShow } = useTradeShowStore();
  const [templateName, setTemplateName] = useState(selectedShow?.name ? `${selectedShow.name} Template` : '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (mode === 'load') {
      loadTemplates();
    }
  }, [mode, loadTemplates]);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setIsSaving(true);
    const success = await saveAsTemplate(templateName.trim());
    setIsSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1000);
    }
  };

  const handleLoad = (template: typeof templates[0]) => {
    createFromTemplate(template);
    onLoaded?.();
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Delete this template?')) {
      await deleteTemplate(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileStack size={18} className="text-brand-purple" />
            <h2 className="text-lg font-semibold text-text-primary">
              {mode === 'save' ? 'Save as Template' : 'Load from Template'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {mode === 'save' ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Save this show's setup as a reusable template. Dates, confirmations, and post-show data will be cleared.
              </p>
              <Input
                label="Template Name"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g., Standard 10x10 Booth Setup"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!templateName.trim() || saved}
                >
                  {saved ? <><Check size={14} /> Saved!</> : 'Save Template'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileStack size={32} className="mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm text-text-secondary">No templates yet</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Save a show as template to reuse its setup
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">
                    Select a template to create a new show with pre-filled settings.
                  </p>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleLoad(template)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{template.name}</p>
                          <p className="text-xs text-text-secondary truncate">
                            {template.location ?? 'No location'} • {template.boothSize ?? 'No booth size'}
                          </p>
                        </div>
                        <button
                          onClick={e => handleDelete(e, template.id)}
                          className="p-1.5 rounded hover:bg-error/10 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
