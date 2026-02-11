'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles, Key, Check, AlertCircle, ExternalLink,
  Loader2, Eye, EyeOff, Info, Zap, FileText, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

export function AISettings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  
  const organization = useAuthStore(s => s.organization);

  useEffect(() => {
    // Load API key from Supabase on mount
    async function loadKey() {
      if (!organization?.id) {
        setIsLoading(false);
        return;
      }

      // First check memory cache
      if (aiService.hasApiKey()) {
        setIsConnected(true);
        setApiKey('••••••••••••••••••••••••••••••••');
        setIsLoading(false);
        return;
      }

      // Then try loading from DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = await aiService.loadApiKeyFromOrg(supabase as any, organization.id);
      if (key) {
        setIsConnected(true);
        setApiKey('••••••••••••••••••••••••••••••••');
      }
      setIsLoading(false);
    }
    loadKey();
  }, [organization?.id]);

  const handleSaveKey = async () => {
    if (!apiKey || apiKey.includes('•') || !organization?.id) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    // Set the current org for API calls
    aiService.setCurrentOrg(organization.id);
    
    // Set the key temporarily for testing
    aiService.setApiKey(apiKey);
    
    // Test the connection
    const result = await aiService.testConnection();
    setTestResult(result);
    
    if (result.success) {
      // Save to Supabase (encrypted)
      const saved = await aiService.saveApiKeyToOrg(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase as any,
        organization.id,
        apiKey
      );
      
      if (saved) {
        setIsConnected(true);
        // Mask the key after successful save
        setApiKey('••••••••••••••••••••••••••••••••');
      } else {
        setTestResult({ success: false, error: 'Failed to save API key' });
        aiService.setApiKey(null);
        setIsConnected(false);
      }
    } else {
      aiService.setApiKey(null);
      setIsConnected(false);
    }
    
    setIsTesting(false);
  };

  const handleRemoveKey = async () => {
    if (!organization?.id) return;
    
    // Remove from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await aiService.saveApiKeyToOrg(
      supabase as any,
      organization.id,
      null
    );
    
    aiService.setApiKey(null);
    setApiKey('');
    setIsConnected(false);
    setTestResult(null);
  };

  const features = [
    {
      icon: <Zap size={18} />,
      title: 'Content Generation',
      description: 'Generate talking points, social posts, follow-up emails, and post-show reports',
    },
    {
      icon: <FileText size={18} />,
      title: 'Document Intelligence',
      description: 'Extract deadlines, requirements, and key info from exhibitor manuals',
    },
    {
      icon: <MessageSquare size={18} />,
      title: 'Show Assistant',
      description: 'Chat with AI about your shows, get insights and recommendations',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">AI Assistant</h3>
          <p className="text-sm text-text-secondary">
            Supercharge your trade show management with Claude AI
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={cn(
        'p-4 rounded-xl border',
        isConnected 
          ? 'bg-success/10 border-success/20' 
          : 'bg-bg-tertiary border-border'
      )}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <Check size={16} className="text-success" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Connected</p>
                <p className="text-sm text-text-secondary">Claude AI is ready to assist</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <Key size={16} className="text-warning" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Not Connected</p>
                <p className="text-sm text-text-secondary">Add your API key to enable AI features</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* API Key Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text-primary">
          Claude API Key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="sk-ant-api..."
              className="pr-10 font-mono text-sm"
              disabled={isConnected}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {isConnected ? (
            <Button variant="outline" onClick={handleRemoveKey}>
              Remove
            </Button>
          ) : (
            <Button 
              onClick={handleSaveKey} 
              disabled={!apiKey || apiKey.includes('•') || isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </div>
        
        {/* Test Result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-center gap-2 text-sm p-2 rounded-lg',
              testResult.success 
                ? 'bg-success/10 text-success' 
                : 'bg-error/10 text-error'
            )}
          >
            {testResult.success ? (
              <>
                <Check size={14} />
                Connection successful!
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                {testResult.error || 'Connection failed'}
              </>
            )}
          </motion.div>
        )}

        {/* Help Text */}
        <div className="flex items-start gap-2 text-xs text-text-tertiary">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Get your API key from{' '}
            <a 
              href="https://console.anthropic.com/settings/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-purple hover:underline inline-flex items-center gap-1"
            >
              console.anthropic.com
              <ExternalLink size={10} />
            </a>
            . Your key is encrypted and stored securely with your organization.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">Features Included</h4>
        <div className="grid gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                isConnected 
                  ? 'bg-surface border-border-subtle' 
                  : 'bg-bg-tertiary border-transparent opacity-60'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isConnected ? 'bg-brand-purple/10 text-brand-purple' : 'bg-bg-secondary text-text-tertiary'
              )}>
                {feature.icon}
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">{feature.title}</p>
                <p className="text-xs text-text-secondary">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Usage Note */}
      <div className="p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-secondary">
        <p className="font-medium text-text-primary mb-1">About Usage & Costs</p>
        <p>
          AI features use your Claude API key directly. You're billed by Anthropic based on your usage. 
          Typical trade show tasks cost $0.01-0.05 per request. Monitor your usage at{' '}
          <a 
            href="https://console.anthropic.com/settings/usage" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-purple hover:underline"
          >
            console.anthropic.com
          </a>.
        </p>
      </div>
    </div>
  );
}
