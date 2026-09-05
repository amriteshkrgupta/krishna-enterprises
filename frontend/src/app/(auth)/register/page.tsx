'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { firebaseAuth, signInWithEmailAndPassword } from '@/lib/firebase';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-md">
            <Leaf className="h-7 w-7 text-white" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500">Order fresh groceries in Madhuban, East Champaran</p>
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
