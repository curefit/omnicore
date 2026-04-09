"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  TrainerOnboardingCreateSchema,
  type TrainerOnboardingCreateInput,
} from "@/lib/validations/trainerOnboarding"
import {
  TRAINER_ONBOARDING_STAGES,
  TRAINER_ONBOARDING_STAGE_LABELS,
} from "@/lib/trainers/onboardingStages"

export function TrainerOnboardingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrainerOnboardingCreateInput>({
    resolver: zodResolver(TrainerOnboardingCreateSchema),
    defaultValues: {
      pipelineStage: "HIRING",
      tentativeStartDate: "",
      joinedOn: "",
    },
  })

  const stage = watch("pipelineStage")

  const onSubmit = async (data: TrainerOnboardingCreateInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/trainers/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
      router.push(`/cf-admin/trainers/${json.onboarding.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4 max-w-xl"
    >
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Full name *</label>
        <input {...register("name")} className="form-input" placeholder="e.g. Meera Krishnan" />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Phone *</label>
          <input {...register("phone")} className="form-input" placeholder="+91 …" />
          {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Email</label>
          <input {...register("email")} type="email" className="form-input" placeholder="name@email.com" />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
            Internal / employee ID
          </label>
          <input {...register("employeeRef")} className="form-input" placeholder="e.g. EMP-T-1042" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
            Govt. identity ID
          </label>
          <input {...register("govtIdentityId")} className="form-input" autoComplete="off" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Area / locality</label>
        <input {...register("areaLocality")} className="form-input" placeholder="e.g. Whitefield" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Experience</label>
        <input {...register("experience")} className="form-input" placeholder="e.g. 4 yrs group fitness" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
          Languages known
        </label>
        <input
          {...register("languagesKnown")}
          className="form-input"
          placeholder="English, Hindi, Kannada"
        />
        <p className="text-[11px] text-oc-fg-dim">Comma-separated or JSON array</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Image URL</label>
        <input {...register("imageUrl")} className="form-input" placeholder="https://…" />
        {errors.imageUrl && <p className="text-xs text-red-400">{errors.imageUrl.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Address</label>
        <textarea {...register("address")} className="form-input min-h-[80px]" rows={3} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Pipeline stage</label>
        <select {...register("pipelineStage")} className="form-input">
          {TRAINER_ONBOARDING_STAGES.map((s) => (
            <option key={s} value={s}>
              {TRAINER_ONBOARDING_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {(stage === "OFFER_ROLLED_OUT" || stage === "OFFER_ACCEPTED") && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
            Tentative start date
          </label>
          <input {...register("tentativeStartDate")} type="date" className="form-input" />
          <p className="text-[11px] text-oc-fg-dim">Expected employment or cohort start (can change).</p>
        </div>
      )}

      {stage === "OFFER_ACCEPTED" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Joined on</label>
          <input {...register("joinedOn")} type="date" className="form-input" />
          <p className="text-[11px] text-oc-fg-dim">Actual date they joined the organization.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Saving…" : "Create candidate"}
      </button>
    </form>
  )
}
