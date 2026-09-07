'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { firebaseAuth, signInWithEmailAndPassword, googleProvider, signInWithPopup } from '@/lib/firebase';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await credential.user.getIdToken();

      const res = await apiPost<any>('/auth/login', { idToken });
      const user = res.user || res.data?.user;
      const token = res.token || idToken;

      if (user && token) {
        setAuth(user, token);
        toast.success(`Welcome to Krishna Enterprises, ${user.name}! 🎉`);
        router.push('/');
      } else {
        toast.error('Sign-in response was invalid.');
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('Google Sign-In Error:', err);
      toast.error(err?.message || 'Google Sign-In failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Step 1: Backend creates Firebase Auth user + Firestore profile
      await apiPost<any>('/auth/register', {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      // Step 2: Sign in with Firebase Auth to get a real ID token
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password
      );
      const idToken = await credential.user.getIdToken();

      // Step 3: Get profile from backend
      const res = await apiPost<any>('/auth/login', { idToken });
      const user = res.user || res.data?.user;
      const token = res.token || idToken;

      if (user && token) {
        setAuth(user, token);
        toast.success('Account created successfully! Welcome 🎉');
        router.push('/');
      } else {
        toast.error('Registration response was invalid.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  const inputCls =
    'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100 space-y-5">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-md">
            <Leaf className="h-7 w-7 text-white" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500">Order fresh groceries in Madhuban, East Champaran</p>
        </div>

        {/* Google 1-Click Sign-Up Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white py-3 px-4 text-xs sm:text-sm font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign up with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-gray-200" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Full Name</label>
            <input type="text" placeholder="Rahul Sharma" {...register('name')} className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email Address</label>
            <input type="email" placeholder="rahul@example.com" {...register('email')} className={inputCls} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Mobile Number</label>
            <input type="tel" placeholder="9876543210" {...register('phone')} className={inputCls} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min 6 characters"
                {...register('password')}
                className={inputCls}
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

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <input
                type={showCPw ? 'text' : 'password'}
                placeholder="Repeat password"
                {...register('confirmPassword')}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowCPw((v) => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showCPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-300 mt-2"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-green-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
