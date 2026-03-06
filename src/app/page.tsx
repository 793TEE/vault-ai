import Link from 'next/link';
import { ArrowRight, Zap, MessageSquare, Calendar, BarChart3, Shield, Clock } from 'lucide-react';
import NewsletterForm from '@/components/NewsletterForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Vault AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-dark-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Revenue Automation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Turn Every Lead Into<br />
            <span className="gradient-text">Revenue on Autopilot</span>
          </h1>

          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            AI responds to leads in seconds, qualifies prospects, handles objections,
            and books appointments 24/7. Never miss another opportunity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn btn-primary text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="#demo" className="btn btn-secondary text-lg px-8 py-3">
              Watch Demo
            </Link>
          </div>

          <p className="text-dark-500 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5 sec', label: 'Average Response Time' },
              { value: '67%', label: 'Increase in Bookings' },
              { value: '24/7', label: 'Availability' },
              { value: '10x', label: 'ROI Average' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-dark-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Close More Deals
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              A complete revenue automation system that works while you sleep
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: 'Instant AI Response',
                description: 'Respond to leads via SMS and email within 5 seconds. Never lose a lead to slow response times again.',
              },
              {
                icon: Zap,
                title: 'Smart Qualification',
                description: 'AI asks the right questions, identifies hot leads, and routes them appropriately.',
              },
              {
                icon: Calendar,
                title: 'Auto-Booking',
                description: 'When leads are ready, AI automatically sends your booking link and confirms appointments.',
              },
              {
                icon: Clock,
                title: 'Smart Follow-ups',
                description: 'Automated follow-up sequences nurture leads until they book or opt out.',
              },
              {
                icon: BarChart3,
                title: 'Full CRM Dashboard',
                description: 'Track every lead, conversation, and metric in one powerful dashboard.',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level encryption, SOC 2 compliance, and isolated tenant data.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card-hover group">
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Set up in minutes, start converting leads immediately
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Embed Form', description: 'Add our lead capture form to your website' },
              { step: '02', title: 'AI Responds', description: 'Leads get instant SMS + email responses' },
              { step: '03', title: 'Qualify & Book', description: 'AI qualifies leads and books appointments' },
              { step: '04', title: 'Close Deals', description: 'You focus on closing while AI handles the rest' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 97,
                features: ['500 AI messages/mo', '1 workspace', 'Lead capture forms', 'Basic CRM', 'Email support'],
              },
              {
                name: 'Growth',
                price: 197,
                popular: true,
                features: ['2,000 AI messages/mo', '3 workspaces', 'Advanced automation', 'Custom AI prompts', 'Priority support', 'Analytics dashboard'],
              },
              {
                name: 'Scale',
                price: 497,
                features: ['10,000 AI messages/mo', 'Unlimited workspaces', 'Custom integrations', 'White-label options', 'Dedicated support', 'API access'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${plan.popular ? 'border-primary-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-dark-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-dark-300">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-primary-900/50 to-dark-900 border-primary-500/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Automate Your Revenue?
            </h2>
            <p className="text-dark-300 mb-8 max-w-xl mx-auto">
              Join hundreds of businesses using Vault AI to capture, qualify, and convert leads on autopilot.
            </p>
            <Link href="/signup" className="btn btn-primary text-lg px-8 py-3">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-900/50 to-dark-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get Weekly AI & Automation Tips
          </h2>
          <p className="text-dark-300 mb-8">
            Join 5,000+ business owners getting exclusive tips on using AI to grow revenue
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Vault AI</span>
            </div>
            <div className="flex items-center gap-6 text-dark-400 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
            <p className="text-dark-500 text-sm">
              © {new Date().getFullYear()} Vault AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
