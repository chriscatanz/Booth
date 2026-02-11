'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Users, Sparkles, Target,
  Linkedin, Mail, Send, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
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
            className="max-w-3xl"
          >
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              About Booth
            </h1>
            <p className="text-xl text-text-secondary">
              Built by a trade show manager, for trade show managers.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Origin Story */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              The Origin Story
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Booth wasn't born in a startup incubator. It was born in the chaos of managing 
                20+ trade shows a year — spreadsheets everywhere, details falling through cracks, 
                and the constant feeling that there had to be a better way.
              </p>
              <p>
                As a Sr. Marketing Manager responsible for our company's entire trade show program, 
                I lived in a world of shipping deadlines, booth logistics, budget tracking, and 
                team coordination. I tried every tool out there — project management apps, 
                spreadsheets, even custom databases. Nothing quite fit.
              </p>
              <p>
                So I started building. What began as a simple personal tracker evolved over 
                <strong> two years</strong> of real-world use, refined show after show, until it 
                became something I realized other trade show managers desperately needed too.
              </p>
              <p>
                That's Booth — a tool shaped by hundreds of actual shows, built to solve the 
                problems I faced every day. No theoretical features, no bloat. Just the stuff 
                that actually matters when you're running a trade show program.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: '20+', sublabel: 'Shows managed per year' },
              { icon: Users, label: '2 Years', sublabel: 'Of real-world development' },
              { icon: Target, label: '100%', sublabel: 'Practitioner-built' },
              { icon: Sparkles, label: 'AI-Powered', sublabel: 'Modern tooling' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl border border-border bg-surface text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-brand-purple" />
                <div className="text-2xl font-bold text-text-primary">{stat.label}</div>
                <div className="text-sm text-text-tertiary">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why Booth Exists */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 border border-brand-purple/20"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Why Booth Exists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-text-secondary">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">The Spreadsheet Problem</h3>
              <p className="text-sm">
                Every trade show manager has "the spreadsheet" — a monster file tracking everything 
                from booth numbers to hotel confirmations. It works until it doesn't.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-2">The Tool Gap</h3>
              <p className="text-sm">
                Generic project management tools don't understand trade shows. CRM systems don't 
                track shipping. Event platforms focus on attendees, not exhibitors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-2">The Solution</h3>
              <p className="text-sm">
                Booth is purpose-built for exhibitors — the people running booths, managing logistics, 
                tracking ROI, and coordinating teams across dozens of shows.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Founder Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-8">
            Meet the Founder
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Photo placeholder - can be replaced with actual image */}
            <div className="shrink-0">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center">
                <span className="text-6xl font-bold text-white">CC</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary mb-1">
                Chris Catanzarite, CPC
              </h3>
              <p className="text-brand-purple mb-4">Founder & CEO</p>
              
              <div className="space-y-4 text-text-secondary">
                <p>
                  Chris is a Sr. Manager of Growth and Client Success with over a decade of experience 
                  in B2B marketing, specializing in trade show strategy and execution. He's personally 
                  managed hundreds of trade shows across his career — from 10x10 inline booths to 
                  large island exhibits.
                </p>
                <p>
                  Beyond trade shows, Chris brings expertise in conversational AI, marketing automation, 
                  and customer success. He holds a CPC (Certified Professional Coach) certification 
                  and is passionate about helping marketing teams work smarter, not harder.
                </p>
                <p>
                  When he's not building Booth or working shows, you'll find him on the golf course, 
                  hitting the ski slopes, or tinkering with the latest tech. He's based in Upstate 
                  New York.
                </p>
              </div>
              
              <div className="flex gap-4 mt-6">
                <a
                  href="https://www.linkedin.com/in/chris-catanzarite-cpc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5] text-white text-sm font-medium hover:bg-[#006097] transition-colors"
                >
                  <Linkedin size={18} />
                  Connect on LinkedIn
                </a>
                <a
                  href="mailto:chris@getbooth.io"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface transition-colors"
                >
                  <Mail size={18} />
                  Email Chris
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Contact Form */}
      <section className="max-w-5xl mx-auto px-4 py-12 mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Get in Touch
            </h2>
            <p className="text-text-secondary mb-6">
              Have questions about Booth? Want to share feedback or request a feature? 
              We'd love to hear from you.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={20} className="text-brand-purple" />
                <span>General inquiries: <a href="mailto:hello@getbooth.io" className="text-brand-purple hover:underline">hello@getbooth.io</a></span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={20} className="text-brand-purple" />
                <span>Sales: <a href="mailto:sales@getbooth.io" className="text-brand-purple hover:underline">sales@getbooth.io</a></span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={20} className="text-brand-purple" />
                <span>Support: <a href="mailto:support@getbooth.io" className="text-brand-purple hover:underline">support@getbooth.io</a></span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-surface">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  rows={4}
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
