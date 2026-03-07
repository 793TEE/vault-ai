'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, User, ArrowRight, Loader2, Check, Gift } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for referral code and source in URL params
  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('referral');
    const src = searchParams.get('source') || searchParams.get('src');

    if (ref) setReferralCode(ref);
    if (src) setSource(src);

    // Check if coming from hissecretvault.net
    if (typeof document !== 'undefined' && document.referrer.includes('hissecretvault.net') || src === 'hsv' || src === 'hissecretvault') {
      setSource('hissecretvault');
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use our API endpoint to create user (bypasses RLS issues)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          source,
          referralCode: referralCode || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Account created successfully, now sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account created but couldn't auto-sign in
        toast.success('Account created! Please sign in.');
        router.push('/login');
      } else {
        toast.success('Account created! Welcome to Vault AI!');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <div>
        <label className="label">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input pl-11"
            placeholder="John Smith"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-11"
            placeholder="you@company.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-11"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>
        <p className="text-dark-500 text-sm mt-1.5">
          Must be at least 8 characters
        </p>
      </div>

      <div>
        <label className="label">Referral Code <span className="text-dark-500">(Optional)</span></label>
        <div className="relative">
          <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="input pl-11"
            placeholder="Enter referral code"
          />
        </div>
        <p className="text-dark-500 text-sm mt-1.5">
          Paid members get 250 free messages
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Create account
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
    </form>
  );
}

function GoogleSignIn() {
  const supabase = createClient();

  return (
    <button
      type="button"
      onClick={async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) toast.error(error.message);
      }}
      className="btn btn-secondary w-full mt-4"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export default function SignupPage() {
  const features = [
    'Instant AI responses to leads',
    'Automated follow-up sequences',
    'Built-in CRM dashboard',
    'Appointment booking integration',
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-dark-900 to-dark-950 p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Vault AI</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-6">
            Start automating your<br />revenue today
          </h1>

          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-primary-200">
                <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-400" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-primary-200 text-sm">
            Free trial - No credit card required - Cancel anytime
          </p>
          <p className="text-primary-300/70 text-xs mt-1">
            HSV members get up to 250 free messages
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Vault AI</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-dark-400 mb-8">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Sign in
            </Link>
          </p>

          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          }>
            <SignupForm />
          </Suspense>

          <p className="text-dark-500 text-sm mt-6 text-center">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-primary-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-400 hover:underline">
              Privacy Policy
            </Link>
          </p>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark-950 text-dark-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignIn />
          </div>
        </div>
      </div>
    </div>
  );
}
