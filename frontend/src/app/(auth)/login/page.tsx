'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Leaf,
  ArrowRight,
  Phone,
  Mail,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  firebaseAuth,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from '@/lib/firebase';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Tab: 'phone' or 'email'
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(0);

  // Email state
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isEmailSubmitting },
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            // Recaptcha resolved
          },
          'expired-callback': () => {
            toast.error('reCAPTCHA expired. Please request OTP again.');
          },
        }
      );
    }
    return window.recaptchaVerifier;
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOtp(true);
    try {
      const appVerifier = setupRecaptcha();
      if (!appVerifier) throw new Error('Recaptcha not initialized');

      const formattedPhone = `+91${cleanPhone}`;
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
      
      window.confirmationResult = confirmation;
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setTimer(30);
      toast.success(`OTP sent to +91 ${cleanPhone}`);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      // Reset recaptcha on failure
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch {}
      }

      if (err?.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format.');
      } else if (err?.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again in a few minutes.');
      } else if (err?.code === 'auth/quota-exceeded') {
        toast.error('SMS quota exceeded for today. Please sign in with email.');
      } else {
        toast.error(err?.message || 'Failed to send OTP. Please check your number.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    const confirmation = confirmationResult || window.confirmationResult;
    if (!confirmation) {
      toast.error('Session expired. Please request a new OTP.');
      setOtpSent(false);
      return;
    }

    setVerifyingOtp(true);
    try {
      const credential = await confirmation.confirm(otpCode);
      const idToken = await credential.user.getIdToken();

      // Sync with backend to get user profile / role
      const res = await apiPost<any>('/auth/login', { idToken });
      const user = res.user || res.data?.user;
      const token = res.token || idToken;

      if (user && token) {
        setAuth(user, token);
        toast.success(`Welcome to Krishna Enterprises, ${user.name}!`);

        const redirect = params.get('redirect');
        if (redirect) {
          router.push(redirect);
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        toast.error('Login response was invalid.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      if (err?.code === 'auth/invalid-verification-code') {
        toast.error('Incorrect OTP code. Please try again.');
      } else if (err?.code === 'auth/code-expired') {
        toast.error('OTP code has expired. Please request a new one.');
      } else {
        toast.error(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Email Login Handler ────────────────────────────────────────────────────
  const onEmailSubmit = async (values: EmailFormValues) => {
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password
      );
      const idToken = await credential.user.getIdToken();

      const res = await apiPost<any>('/auth/login', { idToken });
      const user = res.user || res.data?.user;
      const token = res.token || idToken;

      if (user && token) {
        setAuth(user, token);
        toast.success(`Welcome back, ${user.name}!`);

        const redirect = params.get('redirect');
        if (redirect) {
          router.push(redirect);
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        toast.error('Login response was invalid.');
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      let msg = 'Invalid email or password';
      if (firebaseErr?.code === 'auth/user-not-found') msg = 'No account found with this email.';
      else if (firebaseErr?.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (firebaseErr?.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      else if (firebaseErr?.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      toast.error(msg);
    }
  };

  const inputCls =
    'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-hidden focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-8 shadow-xl border border-gray-100">
        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" />

        {/* Logo & Header */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="flex h-13 w-13 items-center justify-center rounded-2xl bg-green-600 shadow-md transition-transform hover:scale-105"
          >
            <Leaf className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Welcome Back</h1>
          <p className="text-xs text-gray-500">Sign in to your Krishna Enterprises account</p>
        </div>

        {/* ── Method Tabs (Phone OTP vs Email) ──────────────────────────────── */}
        <div className="mb-6 flex rounded-2xl bg-gray-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setOtpSent(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              authMethod === 'phone'
                ? 'bg-white text-green-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Phone className="h-3.5 w-3.5" /> Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              authMethod === 'email'
                ? 'bg-white text-green-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email &amp; Password
          </button>
        </div>

        {/* ── 1. Phone OTP Method ───────────────────────────────────────────── */}
        {authMethod === 'phone' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition">
                    <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-xs font-bold text-gray-600">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      className="h-11 w-full px-3 text-sm text-gray-900 outline-hidden font-medium"
                      autoFocus
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    We will send a 6-digit OTP code to verify your phone.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp || phoneNumber.replace(/\D/g, '').length !== 10}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <>
                      <LoadingSpinner size="sm" /> Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-2xl bg-green-50 p-3.5 border border-green-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-bold text-green-900">OTP Sent</p>
                      <p className="text-green-700">+91 {phoneNumber}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-xs font-extrabold text-green-800 underline hover:text-green-900"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="h-12 w-full rounded-xl border border-gray-300 px-3 text-center text-lg tracking-widest font-black text-gray-900 outline-hidden focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  {timer > 0 ? (
                    <span className="text-gray-400 font-medium">Resend code in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="flex items-center gap-1 font-bold text-green-700 hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" /> Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {verifyingOtp ? (
                    <>
                      <LoadingSpinner size="sm" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify &amp; Sign In <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── 2. Email & Password Method ────────────────────────────────────── */}
        {authMethod === 'email' && (
          <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={inputCls}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={inputCls}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isEmailSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-300"
            >
              {isEmailSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-green-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-orange-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
