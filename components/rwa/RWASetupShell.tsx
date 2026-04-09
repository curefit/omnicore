"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CENTER_MODULE_META } from "@/lib/constants/enums"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"

const GymDetailsSchema = z.object({
  name: z.string().min(2, "Gym name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  capacity: z.coerce.number().int().min(1).max(500),
  gymSqFt: z.coerce.number().int().min(100).optional().or(z.literal("")),
  rwaName: z.string().min(2, "RWA name is required"),
  totalUnits: z.coerce.number().int().min(1, "Total units is required"),
  contactPersonName: z.string().min(2, "Contact name is required"),
  contactPersonPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  contactPersonEmail: z.string().email("Enter a valid email"),
})
type GymDetailsInput = z.infer<typeof GymDetailsSchema>

const STEPS = ["Gym Details", "Services", "Confirm"]

interface Props {
  leadId: string
  token: string
  societyName: string
}

export function RWASetupShell({ leadId, token, societyName }: Props) {
  const [step, setStep] = useState(0)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gymData, setGymData] = useState<GymDetailsInput | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GymDetailsInput>({
    // z.coerce fields have `unknown` input type in Zod v4; cast is safe since the
    // schema's output type matches GymDetailsInput exactly.
    resolver: zodResolver(GymDetailsSchema) as unknown as Resolver<GymDetailsInput>,
  })

  const toggleModule = (key: string) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const onGymDetailsSubmit = (data: GymDetailsInput) => {
    setGymData(data)
    setStep(1)
  }

  const handleFinalSubmit = async () => {
    if (!gymData) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/leads/${leadId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...gymData,
          gymSqFt: gymData.gymSqFt === "" ? undefined : gymData.gymSqFt,
          selectedModules,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Submission failed")
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <span className="text-emerald-400 text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-[#e5e7eb]">Submitted!</h2>
        <p className="text-sm text-[#6b7280]">
          Thank you! The CultSport team will review your information and send a quote shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                i < step
                  ? "bg-emerald-500/20 text-emerald-400"
                  : i === step
                  ? "bg-[#f97316]/20 text-[#f97316]"
                  : "bg-[#1f2937] text-[#6b7280]"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs ${
                i === step ? "text-[#e5e7eb] font-medium" : "text-[#6b7280]"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[#1f2937] min-w-[20px]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Step 0: Gym Details */}
      {step === 0 && (
        <form
          onSubmit={handleSubmit(onGymDetailsSubmit)}
          className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-[#e5e7eb]">Gym Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Gym Name *</label>
              <input {...register("name")} className="form-input" placeholder={`${societyName} Gym`} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Capacity *</label>
              <input {...register("capacity")} className="form-input" placeholder="50" inputMode="numeric" />
              {errors.capacity && <p className="text-xs text-red-400">{errors.capacity.message}</p>}
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Address *</label>
              <input {...register("address")} className="form-input" placeholder="Building A, Main Road" />
              {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">City *</label>
              <input {...register("city")} className="form-input" placeholder="Bangalore" />
              {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Pincode *</label>
              <input {...register("pincode")} className="form-input" placeholder="560001" />
              {errors.pincode && <p className="text-xs text-red-400">{errors.pincode.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Gym Size (sq ft)</label>
              <input {...register("gymSqFt")} className="form-input" placeholder="1200" inputMode="numeric" />
              {errors.gymSqFt && <p className="text-xs text-red-400">{String(errors.gymSqFt.message)}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Total Households *</label>
              <input {...register("totalUnits")} className="form-input" placeholder="200" inputMode="numeric" />
              {errors.totalUnits && <p className="text-xs text-red-400">{errors.totalUnits.message}</p>}
            </div>

            <hr className="col-span-2 border-[#1f2937]" />
            <p className="col-span-2 text-xs font-medium text-[#9ca3af] uppercase tracking-wider">RWA Information</p>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">RWA Name *</label>
              <input {...register("rwaName")} className="form-input" placeholder={`${societyName} RWA`} />
              {errors.rwaName && <p className="text-xs text-red-400">{errors.rwaName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Your Name *</label>
              <input {...register("contactPersonName")} className="form-input" placeholder="Rohit Sharma" />
              {errors.contactPersonName && <p className="text-xs text-red-400">{errors.contactPersonName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Phone *</label>
              <input {...register("contactPersonPhone")} className="form-input" placeholder="9876543210" />
              {errors.contactPersonPhone && <p className="text-xs text-red-400">{errors.contactPersonPhone.message}</p>}
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Email *</label>
              <input {...register("contactPersonEmail")} type="email" className="form-input" placeholder="rohit@society.in" />
              {errors.contactPersonEmail && <p className="text-xs text-red-400">{errors.contactPersonEmail.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
          >
            Next: Choose Services →
          </button>
        </form>
      )}

      {/* Step 1: Module Selection */}
      {step === 1 && (
        <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#e5e7eb]">Which services do you need?</h2>
          <p className="text-xs text-[#6b7280]">
            Select the services you want at your gym. Pricing details will be included in the quote.
          </p>

          <div className="space-y-3">
            {CENTER_MODULE_META.map((mod) => {
              const selected = selectedModules.includes(mod.key)
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => toggleModule(mod.key)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected
                      ? "border-[#f97316] bg-[#f97316]/5"
                      : "border-[#1f2937] hover:border-[#374151]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#e5e7eb]">{mod.label}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{mod.description}</p>
                      <p className="text-xs text-[#f97316]/70 mt-1">
                        {MODULE_PRICING_LABEL[mod.key as keyof typeof MODULE_PRICING_LABEL]}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        selected
                          ? "bg-[#f97316] border-[#f97316]"
                          : "border-[#374151]"
                      }`}
                    >
                      {selected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2 bg-[#1f2937] text-[#e5e7eb] text-sm font-medium rounded-lg hover:bg-[#374151] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={selectedModules.length === 0}
              className="flex-1 py-2.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && gymData && (
        <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#e5e7eb]">Review & Submit</h2>

          <div className="space-y-2">
            <ConfirmRow label="Gym Name" value={gymData.name} />
            <ConfirmRow label="Address" value={`${gymData.address}, ${gymData.city} - ${gymData.pincode}`} />
            <ConfirmRow label="Capacity" value={`${gymData.capacity} members`} />
            {gymData.gymSqFt && <ConfirmRow label="Gym Size" value={`${gymData.gymSqFt} sq ft`} />}
            <ConfirmRow label="Total Households" value={`${gymData.totalUnits}`} />
            <ConfirmRow label="RWA" value={gymData.rwaName} />
            <ConfirmRow label="Contact" value={`${gymData.contactPersonName} (${gymData.contactPersonPhone})`} />
          </div>

          <div>
            <p className="text-xs text-[#6b7280] mb-2">Selected Services</p>
            <div className="flex flex-wrap gap-2">
              {selectedModules.map((m) => (
                <span key={m} className="text-xs bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-[#1f2937] text-[#e5e7eb] text-sm font-medium rounded-lg hover:bg-[#374151] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting…" : "Submit to CultSport →"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-xs text-[#6b7280]">{label}</span>
      <span className="text-xs text-[#e5e7eb] text-right">{value}</span>
    </div>
  )
}
