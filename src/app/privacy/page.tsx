'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-tertiary mb-8">Version 2024-02-14 | Last updated: February 14, 2024</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary">1. Introduction</h2>
            <p>
              Booth (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is committed to 
              protecting your personal data. This Privacy Policy explains how we collect, use, and 
              safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            
            <h3 className="text-lg font-medium text-text-primary mt-4">Account Information</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Email address</li>
              <li>Name</li>
              <li>Password (encrypted)</li>
              <li>Organization name</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mt-4">Trade Show Data</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Show names, dates, and locations</li>
              <li>Budget and cost information</li>
              <li>Attendee information</li>
              <li>Files and documents you upload</li>
              <li>Notes and activity logs</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mt-4">Usage Information</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Improve and develop new features</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">4. Data Sharing</h2>
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Infrastructure providers:</strong> Supabase (database hosting), Vercel (application hosting)</li>
              <li><strong>Email services:</strong> Resend or SendGrid (transactional emails)</li>
              <li><strong>Payment processors:</strong> Stripe (subscription billing) - only if you subscribe</li>
              <li><strong>AI providers:</strong> Anthropic (Claude AI) - only when you use AI features, and only the data you choose to include in prompts</li>
              <li><strong>Team members:</strong> Other users in your organization, as permitted by your role</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="mt-2 text-sm text-text-tertiary">
              Note: We do not use third-party analytics or advertising trackers.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-text-primary">4a. AI Features</h2>
            <p>
              Booth offers optional AI-powered features (content generation, document analysis) using 
              Anthropic&apos;s Claude AI. When you use these features:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Only the specific data you include in your request is sent to Anthropic</li>
              <li>Your data is processed according to <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline">Anthropic&apos;s Privacy Policy</a></li>
              <li>You control whether to use AI features - they are not required</li>
              <li>AI features require you to provide your own API key (BYOK model)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, 
              including encryption in transit and at rest, secure authentication, and regular 
              security assessments. However, no method of transmission over the Internet is 100% 
              secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide 
              you services. If you delete your account, we will delete your data within 30 days, 
              except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">8. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your 
              preferences, and analyze usage. You can control cookies through your browser settings, 
              but disabling them may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 16. We do not knowingly collect 
              personal data from children under 16. If you believe we have collected such data, 
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">10. International Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers in compliance 
              with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by email or through the Service. Your continued use after changes 
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please 
              contact us at{' '}
              <a href="mailto:privacy@getbooth.io" className="text-brand-purple hover:underline">
                privacy@getbooth.io
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
