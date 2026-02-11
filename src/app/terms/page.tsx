'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-tertiary mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary">1. Agreement to Terms</h2>
            <p>
              By accessing or using Booth (&ldquo;the Service&rdquo;), you agree to be bound by these 
              Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">2. Description of Service</h2>
            <p>
              Booth is a software-as-a-service platform that helps businesses manage 
              their trade show programs, including scheduling, budgeting, team coordination, and 
              analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">3. User Accounts</h2>
            <p>
              When you create an account, you must provide accurate and complete information. You are 
              responsible for maintaining the security of your account and password. You agree to 
              accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code or content</li>
              <li>Resell or redistribute the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">5. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our <Link href="/privacy" className="text-brand-purple hover:underline">Privacy Policy</Link>. 
              You retain all rights to your data. We will not sell or share your data with third parties 
              except as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">6. Payment and Billing</h2>
            <p>
              Certain features of the Service may require payment. You agree to pay all fees 
              associated with your selected plan. Fees are non-refundable except as required by law 
              or as explicitly stated in these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">7. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these terms. 
              You may cancel your account at any time. Upon termination, your right to use the 
              Service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, 
              either express or implied, including but not limited to implied warranties of 
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">9. Limitation of Liability</h2>
            <p>
              In no event shall Booth, its directors, employees, or agents be liable 
              for any indirect, incidental, special, consequential, or punitive damages arising 
              from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes via email or through the Service. Continued use of the Service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">11. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@getbooth.io" className="text-brand-purple hover:underline">
                legal@getbooth.io
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
