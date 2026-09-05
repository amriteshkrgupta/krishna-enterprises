'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Lock, Plus, Trash2, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiPost, apiPut } from '@/lib/api';
import { Address } from '@/types';
import AddressForm, { AddressFormValues } from '@/components/forms/AddressForm';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name:  z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile required').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

const inputCls =
  'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

export default function ProfilePage() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (values: ProfileForm) => {
    try {
      const res = await apiPut<{ success: boolean; data: typeof user }>('/auth/profile', values);
      if (res.success && res.data) {
        setUser(res.data as NonNullable<typeof user>);
        toast.success('Profile updated!');
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onPasswordSubmit = async (values: PasswordForm) => {
    try {
      await apiPut('/auth/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed!');
      passwordForm.reset();
    } catch {
      toast.error('Failed to change password. Check your current password.');
    }
  };

  const onAddAddress = async (values: AddressFormValues) => {
    try {
      const res = await apiPost<{ success: boolean; data: typeof user }>('/auth/addresses', values);
      if (res.success && res.data) {
        setUser(res.data as NonNullable<typeof user>);
        toast.success('Address saved!');
        setShowAddressForm(false);
      }
    } catch {
      toast.error('Failed to save address');
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const res = await apiPut<{ success: boolean; data: typeof user }>(`/auth/addresses/${addressId}/delete`, {});
      if (res.success && res.data) {
        setUser(res.data as NonNullable<typeof user>);
        toast.success('Address deleted');
      }
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      const res = await apiPut<{ success: boolean; data: typeof user }>(`/auth/addresses/${addressId}/default`, {});
      if (res.success && res.data) {
        setUser(res.data as NonNullable<typeof user>);
        toast.success('Default address updated');
      }
    } catch {
      toast.error('Failed to update default');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>

      {/* Profile info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary-600" /> Personal Information
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...profileForm.register('name')} className={inputCls} />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...profileForm.register('email')} type="email" className={inputCls} />
              {profileForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...profileForm.register('phone')} maxLength={10} inputMode="tel" className={inputCls} />
              {profileForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.phone.message}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {profileForm.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" /> Change Password
        </h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input {...passwordForm.register(field)} type="password" className={inputCls} />
              {passwordForm.formState.errors[field] && (
                <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors[field]?.message}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60"
          >
            {passwordForm.formState.isSubmitting ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Addresses */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" /> Saved Addresses
          </h2>
          <button
            onClick={() => setShowAddressForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-200 px-3 py-1.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>

        {showAddressForm && (
          <div className="mb-5 rounded-xl border border-dashed border-primary-300 p-4 bg-primary-50">
            <h3 className="text-sm font-bold text-primary-800 mb-3">New Address</h3>
            <AddressForm onSubmit={onAddAddress} onCancel={() => setShowAddressForm(false)} />
          </div>
        )}

        {user?.addresses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No addresses saved yet.</p>
        ) : (
          <div className="space-y-3">
            {user?.addresses.map((addr) => (
              <div
                key={addr._id}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 font-semibold flex items-center gap-1">
                        <Star className="h-2.5 w-2.5" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => addr._id && setDefaultAddress(addr._id)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-primary-600 hover:border-primary-300"
                      title="Set as default"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => addr._id && deleteAddress(addr._id)}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-500 hover:border-red-200"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
