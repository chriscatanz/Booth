'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Mail, Send, CheckCircle2, Loader2,
  MessageSquare, HelpCircle, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('sending');
    
    // For now, create a mailto link - can be replaced with actual form submission
    const mailtoLink = `mailto:hello@getbooth.io?subject=${encodeURIComponent(formData.subject || 'Contact from Booth Website')}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\n\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    setFormState('sent');
    
    // Reset after showing success
    setTimeout(() => {
      setFormState('idle');
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/10 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 py-12 relative">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple/20 text-brand-purple mb-6">
              <MessageSquare size={32} />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-text-secondary">
              Have questions about Booth? Want to share feedback or request a feature? 
              We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Contact Options */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: HelpCircle,
              title: 'Support',
              description: 'Need help with your account or have a technical question?',
              email: 'support@getbooth.io',
            },
            {
              icon: MessageSquare,
              title: 'Sales',
              description: 'Interested in Booth for your team? Let\'s talk.',
              email: 'sales@getbooth.io',
            },
            {
              icon: Lightbulb,
              title: 'General',
              description: 'Partnerships, press inquiries, or just want to say hi.',
              email: 'hello@getbooth.io',
            },
          ].map((item, index) => (
            <motion.a
              key={item.title}
              href={`mailto:${item.email}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border bg-surface hover:border-brand-purple/50 transition-colors group"
            >
              <item.icon className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-purple transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-text-secondary mb-3">
                {item.description}
              </p>
              <span className="text-sm text-brand-purple">
                {item.email}
              </span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="max-w-5xl mx-auto px-4 py-12 mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="p-8 rounded-2xl border border-border bg-surface">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              Send us a message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                  placeholder="Your company"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                >
                  <option value="">Select a topic...</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Sales Question">Sales Question</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Partnership">Partnership Opportunity</option>
                  <option value="Press">Press / Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 resize-none"
                  placeholder="How can we help?"
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={formState === 'sending' || formState === 'sent'}
              >
                {formState === 'idle' && (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
                {formState === 'sending' && (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                )}
                {formState === 'sent' && (
                  <>
                    <CheckCircle2 size={18} />
                    Message Sent!
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
