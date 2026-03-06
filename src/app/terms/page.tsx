import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="border-b border-dark-800 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Vault AI</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-dark max-w-none space-y-6 text-dark-300">
          <p>Last updated: March 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
          <p>By accessing and using Vault AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>

          <h2 className="text-xl font-semibold text-white mt-8">2. Description of Service</h2>
          <p>Vault AI provides AI-powered lead capture, qualification, and appointment booking services for businesses. Our platform automates communication with leads via SMS and email.</p>

          <h2 className="text-xl font-semibold text-white mt-8">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information when creating an account.</p>

          <h2 className="text-xl font-semibold text-white mt-8">4. Acceptable Use</h2>
          <p>You agree not to use Vault AI for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sending spam or unsolicited messages</li>
            <li>Violating any applicable laws or regulations</li>
            <li>Harassing, threatening, or harming others</li>
            <li>Infringing on intellectual property rights</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">5. Payment Terms</h2>
          <p>Subscription fees are billed monthly. You may cancel at any time, and your access will continue until the end of your billing period.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Limitation of Liability</h2>
          <p>Vault AI is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

          <h2 className="text-xl font-semibold text-white mt-8">7. Contact</h2>
          <p>For questions about these terms, contact us at support@vaultai.com</p>
        </div>
      </main>
    </div>
  );
}
