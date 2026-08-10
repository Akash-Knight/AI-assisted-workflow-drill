import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ── Zod schema ────────────────────────────────────────────────
const schema = z
  .object({
    // Original fields
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    notifications: z.boolean(),

    // New fields
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'non-binary', 'prefer-not'], {
      errorMap: () => ({ message: 'Please select a gender' }),
    }),
    address: z.string().min(3, 'Address must be at least 3 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
    website: z
      .string()
      .url('Please enter a valid URL (include https://)')
      .or(z.literal('')),
    linkedin: z
      .string()
      .url('Please enter a valid URL (include https://)')
      .or(z.literal('')),
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
    company: z.string().min(2, 'Company must be at least 2 characters'),
    bio: z
      .string()
      .max(300, 'Bio must be 300 characters or fewer')
      .or(z.literal('')),

    // Password change (all optional; if currentPassword is filled, rest must be too)
    currentPassword: z.string().or(z.literal('')),
    newPassword: z.string().or(z.literal('')),
    confirmPassword: z.string().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const anyPasswordFilled =
      data.currentPassword || data.newPassword || data.confirmPassword
    if (anyPasswordFilled) {
      if (!data.currentPassword) {
        ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Current password is required' })
      }
      if (!data.newPassword || data.newPassword.length < 8) {
        ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'New password must be at least 8 characters' })
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' })
      }
    }
  })

// ── Reusable Field wrapper ────────────────────────────────────
function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Reusable Input ────────────────────────────────────────────
function Input({ id, error, ...props }) {
  const base = 'w-full px-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const state = error
    ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
    : 'border-gray-300 bg-white'
  return (
    <input
      id={id}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
      className={`${base} ${state}`}
      {...props}
    />
  )
}

// ── Reusable Select ───────────────────────────────────────────
function Select({ id, error, children, ...props }) {
  const base = 'w-full px-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
  const state = error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  return (
    <select
      id={id}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
      className={`${base} ${state}`}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Reusable Textarea ─────────────────────────────────────────
function Textarea({ id, error, ...props }) {
  const base = 'w-full px-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none'
  const state = error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  return (
    <textarea
      id={id}
      rows={3}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
      className={`${base} ${state}`}
      {...props}
    />
  )
}

// ── Section heading ───────────────────────────────────────────
function SectionHeading({ title, description }) {
  return (
    <div className="pb-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
  )
}

// ── Avatar upload preview ─────────────────────────────────────
function AvatarUpload({ register }) {
  const [preview, setPreview] = useState(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-indigo-200">
        {preview ? (
          <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
      <div>
        <label
          htmlFor="photo"
          className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition"
        >
          Upload photo
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          className="sr-only"
          {...register('photo')}
          onChange={(e) => {
            register('photo').onChange(e)
            handleChange(e)
          }}
        />
        <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF · Max 2 MB</p>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────
export default function ProfileForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', notifications: false,
      dob: '', gender: '', address: '', city: '',
      username: '', website: '', linkedin: '',
      jobTitle: '', company: '', bio: '',
      currentPassword: '', newPassword: '', confirmPassword: '',
    },
  })

  const bioValue = watch('bio') || ''

  const onSubmit = async (data) => {
    await new Promise((res) => setTimeout(res, 900))
    setSubmittedData(data)
    setSubmitted(true)
    reset()
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile updated!</h2>
        <p className="text-sm text-gray-500 mb-6">Your changes have been saved successfully.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          Edit profile
        </button>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal and account information.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-8 py-8">

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">

          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-8">

            {/* Section 1: Photo */}
            <section className="space-y-4" aria-labelledby="section-photo">
              <SectionHeading title="Profile Photo" id="section-photo" />
              <AvatarUpload register={register} />
            </section>

            {/* Section 2: Personal Info */}
            <section className="space-y-4" aria-labelledby="section-personal">
              <SectionHeading title="Personal Information" id="section-personal" description="Your basic identity details." />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
                  <Input id="name" type="text" placeholder="Sarah Chen" autoComplete="name" error={errors.name?.message} {...register('name')} />
                </Field>
                <Field label="Username" htmlFor="username" error={errors.username?.message} required hint="Lowercase, numbers, underscores only">
                  <Input id="username" type="text" placeholder="sarah_chen" autoComplete="username" error={errors.username?.message} {...register('username')} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of birth" htmlFor="dob" error={errors.dob?.message} required>
                  <Input id="dob" type="date" error={errors.dob?.message} {...register('dob')} />
                </Field>
                <Field label="Gender" htmlFor="gender" error={errors.gender?.message} required>
                  <Select id="gender" error={errors.gender?.message} {...register('gender')}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </Select>
                </Field>
              </div>

              <Field label="Bio" htmlFor="bio" error={errors.bio?.message} hint="Optional · max 300 characters">
                <Textarea id="bio" placeholder="Tell others a bit about yourself…" error={errors.bio?.message} {...register('bio')} />
                <p className={`text-xs text-right ${bioValue.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                  {bioValue.length} / 300
                </p>
              </Field>
            </section>

            {/* Section 3: Contact */}
            <section className="space-y-4" aria-labelledby="section-contact">
              <SectionHeading title="Contact Details" id="section-contact" description="How people can reach you." />

              <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
                <Input id="email" type="email" placeholder="sarah@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
              </Field>

              <Field label="Phone number" htmlFor="phone" error={errors.phone?.message} required hint="10-digit number, no spaces or dashes">
                <Input id="phone" type="tel" placeholder="9876543210" autoComplete="tel" maxLength={10} error={errors.phone?.message} {...register('phone')} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Address" htmlFor="address" error={errors.address?.message} required>
                  <Input id="address" type="text" placeholder="123 Main Street" autoComplete="street-address" error={errors.address?.message} {...register('address')} />
                </Field>
                <Field label="City" htmlFor="city" error={errors.city?.message} required>
                  <Input id="city" type="text" placeholder="Mumbai" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
                </Field>
              </div>
            </section>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="space-y-8">

            {/* Section 4: Professional */}
            <section className="space-y-4" aria-labelledby="section-professional">
              <SectionHeading title="Professional Info" id="section-professional" description="Your work details and online presence." />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle?.message} required>
                  <Input id="jobTitle" type="text" placeholder="Product Designer" error={errors.jobTitle?.message} {...register('jobTitle')} />
                </Field>
                <Field label="Company" htmlFor="company" error={errors.company?.message} required>
                  <Input id="company" type="text" placeholder="Luminos Inc." autoComplete="organization" error={errors.company?.message} {...register('company')} />
                </Field>
              </div>

              <Field label="Website" htmlFor="website" error={errors.website?.message} hint="Optional · include https://">
                <Input id="website" type="url" placeholder="https://yoursite.com" autoComplete="url" error={errors.website?.message} {...register('website')} />
              </Field>

              <Field label="LinkedIn" htmlFor="linkedin" error={errors.linkedin?.message} hint="Optional · include https://">
                <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/yourprofile" error={errors.linkedin?.message} {...register('linkedin')} />
              </Field>
            </section>

            {/* Section 5: Preferences */}
            <section className="space-y-3" aria-labelledby="section-prefs">
              <SectionHeading title="Preferences" id="section-prefs" />
              <div className="flex items-start gap-3">
                <input
                  id="notifications"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  {...register('notifications')}
                />
                <div>
                  <label htmlFor="notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Email notifications
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">Receive updates, alerts, and news via email.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Full-width: Password + Submit ── */}
        <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
          <section className="space-y-4" aria-labelledby="section-password">
            <SectionHeading title="Change Password" id="section-password" description="Leave blank to keep your current password." />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
                <Input id="currentPassword" type="password" placeholder="••••••••" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
              </Field>
              <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} hint="Min. 8 characters">
                <Input id="newPassword" type="password" placeholder="••••••••" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              </Field>
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
