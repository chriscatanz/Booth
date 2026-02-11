import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'California Privacy Rights (CCPA) | Booth',
  description: 'Your California Consumer Privacy Act (CCPA) rights and how to exercise them.',
};

export default function CCPAPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-brand-purple hover:underline text-sm">
            ← Back to Booth
          </Link>
          <h1 className="text-3xl font-bold text-text-primary mt-4">California Privacy Rights</h1>
          <p className="text-text-secondary mt-2">Your Rights Under the California Consumer Privacy Act (CCPA)</p>
          <p className="text-sm text-text-tertiary mt-1">Last updated: February 10, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Do Not Sell or Share My Personal Information</h2>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 font-medium">✓ Booth does not sell your personal information</p>
              <p className="text-text-secondary text-sm mt-1">
                We do not sell, rent, or trade your personal information to third parties for monetary or other valuable consideration.
              </p>
            </div>
            <p className="text-text-secondary">
              Under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), 
              California residents have the right to opt out of the "sale" or "sharing" of their personal information. 
              While Booth does not engage in such practices, we provide this disclosure to ensure transparency 
              and compliance with California law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Your CCPA Rights</h2>
            <p className="text-text-secondary mb-4">As a California resident, you have the following rights:</p>
            
            <div className="space-y-4">
              <div className="bg-bg-tertiary rounded-lg p-4">
                <h3 className="font-medium text-text-primary">Right to Know</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You can request information about the personal data we collect, use, disclose, and sell about you.
                </p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <h3 className="font-medium text-text-primary">Right to Delete</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You can request that we delete your personal information, subject to certain exceptions.
                </p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <h3 className="font-medium text-text-primary">Right to Correct</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You can request that we correct inaccurate personal information we maintain about you.
                </p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <h3 className="font-medium text-text-primary">Right to Opt-Out</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You can opt out of the sale or sharing of your personal information. (Note: Booth does not sell or share personal information.)
                </p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <h3 className="font-medium text-text-primary">Right to Non-Discrimination</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You will not receive discriminatory treatment for exercising any of your CCPA rights.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Categories of Personal Information</h2>
            <p className="text-text-secondary mb-4">
              In the preceding 12 months, we have collected the following categories of personal information:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-text-primary">Category</th>
                    <th className="text-left py-3 text-text-primary">Examples</th>
                    <th className="text-left py-3 text-text-primary">Collected</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="py-3">Identifiers</td>
                    <td className="py-3">Name, email address, account name</td>
                    <td className="py-3">Yes</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Commercial Information</td>
                    <td className="py-3">Trade show data, subscription history</td>
                    <td className="py-3">Yes</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Internet Activity</td>
                    <td className="py-3">App usage, feature interactions</td>
                    <td className="py-3">Yes</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Geolocation Data</td>
                    <td className="py-3">Approximate location from IP</td>
                    <td className="py-3">No</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Professional Information</td>
                    <td className="py-3">Job title, company name</td>
                    <td className="py-3">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">How to Exercise Your Rights</h2>
            <p className="text-text-secondary mb-4">
              To exercise any of your CCPA rights, you may:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>
                <strong>Use in-app controls:</strong> Go to Settings → Account to export or delete your data
              </li>
              <li>
                <strong>Email us:</strong>{' '}
                <a href="mailto:privacy@getbooth.io" className="text-brand-purple hover:underline">
                  privacy@getbooth.io
                </a>
              </li>
            </ul>
            <p className="text-text-secondary mt-4">
              We will respond to verifiable consumer requests within 45 days. If we need more time, 
              we will inform you of the reason and extension period in writing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Contact Us</h2>
            <p className="text-text-secondary">
              If you have questions about this notice or your California privacy rights, contact us at:
            </p>
            <div className="mt-4 bg-bg-tertiary rounded-lg p-4">
              <p className="text-text-primary font-medium">Booth Privacy Team</p>
              <p className="text-text-secondary text-sm mt-1">
                Email:{' '}
                <a href="mailto:privacy@getbooth.io" className="text-brand-purple hover:underline">
                  privacy@getbooth.io
                </a>
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text-primary">Terms of Service</Link>
            <Link href="/" className="hover:text-text-primary">Back to Booth</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
