'use client';

import { useState } from 'react';
import {
  Briefcase,
  Home,
  Stethoscope,
  Scale,
  Megaphone,
  Dumbbell,
  Car,
  GraduationCap,
  Palette,
  Wrench,
  Check,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const industryTemplates = [
  {
    id: 'real-estate',
    name: 'Real Estate Agent',
    icon: Home,
    color: 'emerald',
    description: 'Perfect for realtors and property managers',
    tone: 'friendly',
    systemPrompt: `You are an AI assistant for a real estate professional. Your goal is to qualify leads interested in buying or selling property.

Key questions to ask:
- Are you looking to buy or sell?
- What's your timeline?
- What area are you interested in?
- What's your budget range?
- Are you pre-approved for financing?

When they show interest, offer to schedule a property consultation or home valuation.`,
    offerDetails: 'Free home valuation, buyer consultations, market analysis, and personalized property searches.',
    pricingInfo: 'Commission-based pricing. Free consultations available.',
    objectionHandling: `- "I'm just looking": Offer free market report for their area
- "I have an agent": Ask what's missing from their current experience
- "Not ready yet": Offer to send listings that match their criteria so they're prepared`,
  },
  {
    id: 'contractor',
    name: 'Home Contractor',
    icon: Wrench,
    color: 'amber',
    description: 'HVAC, plumbing, electrical, roofing, etc.',
    tone: 'professional',
    systemPrompt: `You are an AI assistant for a home services contractor. Your goal is to book estimate appointments.

Key questions to ask:
- What service do you need?
- Is this an emergency or can it be scheduled?
- What's the address of the property?
- Are you the homeowner?
- When would be a good time for an estimate?

Create urgency by mentioning limited availability. Always push toward booking an on-site estimate.`,
    offerDetails: 'Free estimates, same-day service available, licensed and insured, satisfaction guaranteed.',
    pricingInfo: 'Free estimates. Pricing provided after assessment. Financing options available.',
    objectionHandling: `- "Too expensive": Emphasize quality work that lasts, warranties, and financing options
- "Getting other quotes": Offer to match or beat competitor quotes
- "Can you do it over the phone?": Explain why in-person assessment ensures accurate pricing`,
  },
  {
    id: 'lawyer',
    name: 'Law Firm',
    icon: Scale,
    color: 'blue',
    description: 'Legal services and consultations',
    tone: 'professional',
    systemPrompt: `You are an AI assistant for a law firm. Your goal is to qualify potential clients and book consultations.

Key questions to ask:
- What type of legal matter do you need help with?
- Has anything been filed yet?
- What's the urgency of your situation?
- Have you spoken with other attorneys?

Be empathetic and professional. Never give legal advice. Always recommend scheduling a consultation.`,
    offerDetails: 'Free initial consultation, experienced attorneys, flexible payment plans, confidential discussions.',
    pricingInfo: 'Free initial consultation. Fees discussed during consultation based on case complexity.',
    objectionHandling: `- "Can't afford a lawyer": Mention payment plans and free consultation
- "Not sure I need a lawyer": Offer free consultation to assess the situation
- "Want to handle it myself": Explain risks of self-representation`,
  },
  {
    id: 'dentist',
    name: 'Dental Practice',
    icon: Stethoscope,
    color: 'cyan',
    description: 'Dentists and dental clinics',
    tone: 'friendly',
    systemPrompt: `You are an AI assistant for a dental practice. Your goal is to book appointments for new and existing patients.

Key questions to ask:
- Are you a new or existing patient?
- What brings you in? (Checkup, pain, cosmetic)
- Do you have dental insurance?
- When was your last dental visit?
- Do you have any preferred days/times?

Be warm and reassuring. Many people have dental anxiety.`,
    offerDetails: 'New patient specials, comprehensive exams, cosmetic dentistry, emergency appointments available.',
    pricingInfo: 'We accept most insurance plans. New patient special: $99 exam and x-rays.',
    objectionHandling: `- "Dental anxiety": Mention sedation options and gentle approach
- "No insurance": Explain membership plans and financing
- "Too busy": Offer early morning, evening, or Saturday appointments`,
  },
  {
    id: 'marketing-agency',
    name: 'Marketing Agency',
    icon: Megaphone,
    color: 'pink',
    description: 'Digital marketing and advertising',
    tone: 'casual',
    systemPrompt: `You are an AI assistant for a marketing agency. Your goal is to book strategy calls with business owners.

Key questions to ask:
- What type of business do you have?
- What's your current marketing strategy?
- What are your growth goals?
- What's your monthly marketing budget?
- Have you worked with agencies before?

Focus on ROI and results. Use case studies and success stories.`,
    offerDetails: 'Free marketing audit, custom strategy, ROI-focused campaigns, transparent reporting.',
    pricingInfo: 'Custom packages starting at $1,500/month. Free strategy session included.',
    objectionHandling: `- "Did it myself before": Ask about results and time spent
- "Had bad experience with agencies": Explain your transparent approach
- "Not sure it works": Share case studies and offer performance guarantees`,
  },
  {
    id: 'fitness',
    name: 'Fitness / Personal Training',
    icon: Dumbbell,
    color: 'red',
    description: 'Gyms, trainers, and fitness studios',
    tone: 'friendly',
    systemPrompt: `You are an AI assistant for a fitness business. Your goal is to book trial sessions and consultations.

Key questions to ask:
- What are your fitness goals?
- Have you worked with a trainer before?
- Any injuries or limitations?
- What's your schedule like?
- How soon do you want to start?

Be motivating and encouraging. Focus on transformation and results.`,
    offerDetails: 'Free trial session, personalized programs, nutrition guidance, flexible scheduling.',
    pricingInfo: 'Packages starting at $199/month. Free trial session for new clients.',
    objectionHandling: `- "Too expensive": Compare to cost of health problems, emphasize investment in self
- "No time": Offer short but effective sessions, early morning or lunch options
- "Tried before and failed": Explain personalized approach and accountability`,
  },
  {
    id: 'auto',
    name: 'Auto Services',
    icon: Car,
    color: 'slate',
    description: 'Auto repair, detailing, dealerships',
    tone: 'casual',
    systemPrompt: `You are an AI assistant for an auto service business. Your goal is to book appointments.

Key questions to ask:
- What's the make and model of your vehicle?
- What service do you need?
- Are you experiencing any specific issues?
- When would you like to bring it in?

Be helpful and avoid technical jargon unless the customer uses it first.`,
    offerDetails: 'Free diagnostics, loaner vehicles available, warranty on all work, competitive pricing.',
    pricingInfo: 'Free diagnostic check. Estimates provided before any work begins.',
    objectionHandling: `- "I'll go to the dealer": Explain same quality at lower cost
- "Just want a quote": Offer free inspection for accurate pricing
- "My friend can do it": Mention warranty and professional equipment`,
  },
  {
    id: 'education',
    name: 'Education / Coaching',
    icon: GraduationCap,
    color: 'violet',
    description: 'Tutors, coaches, online courses',
    tone: 'friendly',
    systemPrompt: `You are an AI assistant for an education or coaching business. Your goal is to book discovery calls.

Key questions to ask:
- What subject or skill are you looking to improve?
- What's your current level?
- What are your goals?
- Do you prefer online or in-person?
- What's your learning style?

Be encouraging and focus on outcomes and transformation.`,
    offerDetails: 'Free consultation, personalized learning plans, flexible scheduling, proven results.',
    pricingInfo: 'Programs starting at $297. Free discovery call to discuss your needs.',
    objectionHandling: `- "Can learn free online": Explain value of structured learning and accountability
- "Tried before, didn't work": Ask what was missing, explain personalized approach
- "Need to think about it": Offer limited-time enrollment bonus`,
  },
  {
    id: 'creative',
    name: 'Creative Services',
    icon: Palette,
    color: 'orange',
    description: 'Design, photography, video production',
    tone: 'casual',
    systemPrompt: `You are an AI assistant for a creative services business. Your goal is to book consultations and project discussions.

Key questions to ask:
- What type of project are you working on?
- What's your vision or style preference?
- What's your timeline?
- Do you have a budget in mind?
- Have you worked with creatives before?

Be enthusiastic about their project. Ask to see examples of what they like.`,
    offerDetails: 'Custom creative solutions, fast turnaround available, unlimited revisions, satisfaction guaranteed.',
    pricingInfo: 'Project-based pricing. Free consultation to discuss your vision and provide a quote.',
    objectionHandling: `- "Can use Canva/Fiverr": Explain value of custom, professional work
- "Budget is tight": Offer package options or phased approach
- "Need it yesterday": Discuss rush options and prioritization`,
  },
  {
    id: 'consulting',
    name: 'Business Consulting',
    icon: Briefcase,
    color: 'indigo',
    description: 'Business coaches and consultants',
    tone: 'professional',
    systemPrompt: `You are an AI assistant for a business consulting firm. Your goal is to book strategy sessions.

Key questions to ask:
- What type of business do you run?
- What's your biggest challenge right now?
- What have you tried so far?
- What would success look like for you?
- Are you the decision-maker?

Focus on ROI and business outcomes. Use business language.`,
    offerDetails: 'Free strategy session, proven frameworks, implementation support, measurable results.',
    pricingInfo: 'Engagement options starting at $2,500. Free strategy session to assess fit.',
    objectionHandling: `- "Can figure it out myself": Ask how long they've been trying, emphasize speed to results
- "Had consultants before": Ask what was missing, explain your approach
- "Too busy": Frame it as investment that saves time long-term`,
  },
];

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const handleApplyTemplate = async (template: typeof industryTemplates[0]) => {
    setApplying(true);

    try {
      const res = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_tone: template.tone,
          ai_system_prompt: template.systemPrompt,
          ai_offer_details: template.offerDetails,
          ai_pricing_info: template.pricingInfo,
          ai_objection_handling: template.objectionHandling,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`${template.name} template applied!`);
        setSelectedTemplate(null);
      } else {
        console.error('Template apply error:', data);
        const errorMsg = data.details || data.error || 'Failed to apply template';
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Template error:', error);
      toast.error('Connection error. Please try again.');
    }

    setApplying(false);
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-500/10`,
    text: `text-${color}-400`,
    border: `border-${color}-500/30`,
    hover: `hover:border-${color}-500/50`,
  });

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Industry Templates</h1>
        <p className="text-dark-400 mt-1">
          Pre-configured AI settings optimized for your industry. Click to preview and apply.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {industryTemplates.map((template) => {
          const colors = getColorClasses(template.color);
          const isSelected = selectedTemplate === template.id;

          return (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
              className={`card cursor-pointer transition-all duration-200 ${
                isSelected ? `border-${template.color}-500/50 ring-2 ring-${template.color}-500/20` : 'hover:border-dark-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <template.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <ChevronRight className={`w-5 h-5 text-dark-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
              <p className="text-sm text-dark-400 mb-4">{template.description}</p>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-dark-700 space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-1">AI Tone</h4>
                    <p className="text-sm text-dark-400 capitalize">{template.tone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-1">Offer Details</h4>
                    <p className="text-sm text-dark-400">{template.offerDetails}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-1">Pricing Info</h4>
                    <p className="text-sm text-dark-400">{template.pricingInfo}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(template);
                    }}
                    disabled={applying}
                    className={`w-full py-2 bg-${template.color}-500 text-white font-medium rounded-lg hover:bg-${template.color}-600 transition-colors disabled:opacity-50`}
                  >
                    {applying ? 'Applying...' : 'Apply This Template'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Template CTA */}
      <div className="card bg-gradient-to-br from-primary-900/30 to-dark-900 border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Need a Custom Template?</h3>
            <p className="text-dark-400 mt-1">
              Don't see your industry? We can create a custom AI configuration for you.
            </p>
          </div>
          <a
            href="mailto:support@vaultai.com?subject=Custom Template Request"
            className="btn btn-primary whitespace-nowrap"
          >
            Request Custom
          </a>
        </div>
      </div>
    </div>
  );
}
