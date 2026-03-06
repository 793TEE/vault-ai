import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-dark max-w-none space-y-6 text-dark-300">
          <p>Last updated: March 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8">1. Information We Collect</h2>
          <p>We collect information you provide directly, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (name, email, password)</li>
            <li>Business information (company name, industry)</li>
            <li>Lead data you capture through our forms</li>
            <li>Communication preferences</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our services</li>
            <li>Send AI-generated responses to your leads</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send service updates and marketing communications</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits.</p>

          <h2 className="text-xl font-semibold text-white mt-8">4. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers (hosting, payment processing)</li>
            <li>AI providers (OpenAI) for response generation</li>
            <li>Communication providers (Twilio, SendGrid)</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. Contact us at privacy@vaultai.com to exercise these rights.</p>

          <h2 className="text-xl font-semibold text-white mt-8">6. Contact</h2>
          <p>For privacy questions, contact us at privacy@vaultai.com</p>
        </div>
      </main>
    </div>
  );
}
