'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { firebaseAuth, signInWithEmailAndPassword } from '@/lib/firebase';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      // Step 1: Sign in with Firebase Auth to get ID token
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password
      );
      const idToken = await credential.user.getIdToken();

      // Step 2: Send ID token to backend to get user profile + role
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
    'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Logo & Header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-md">
            <Leaf className="h-7 w-7 text-white" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500">Sign in to your Krishna Enterprises account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email Address</label>
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
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Password</label>
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
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-300"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-green-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
