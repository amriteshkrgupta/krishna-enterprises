'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Address } from '@/types';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const inputCls =
  'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition shadow-xs';

export default function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: 'onSubmit',
    defaultValues: {
      label: 'Home',
      street: '',
      city: 'Madhuban',
      state: 'Bihar',
      pincode: '845420',
      phone: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Label</label>
        <div className="flex gap-2">
          {['Home', 'Work', 'Other'].map((lbl) => (
            <label key={lbl} className="cursor-pointer">
              <input
                type="radio"
                value={lbl}
                {...register('label')}
                className="peer sr-only"
              />
              <span className="inline-block rounded-xl border border-gray-300 px-3.5 py-1.5 text-xs font-bold peer-checked:border-green-600 peer-checked:bg-green-50 peer-checked:text-green-700 transition">
                {lbl}
              </span>
            </label>
          ))}
        </div>
        {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Street / Village / Landmark <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Machhaha Chowk, Near Main Road"
          {...register('street')}
          className={inputCls}
        />
        {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            City / Town <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Madhuban"
            {...register('city')}
            className={inputCls}
          />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Bihar"
            {...register('state')}
            className={inputCls}
          />
          {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="845420"
            {...register('pincode')}
            className={inputCls}
          />
          {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Contact Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          maxLength={10}
          placeholder="e.g. 7870885796"
          {...register('phone')}
          className={inputCls}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-green-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-green-700 transition disabled:bg-gray-300"
        >
          {isLoading ? 'Saving...' : 'Save & Deliver Here'}
        </button>
      </div>
    </form>
  );
}

