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
import { languagesToDisplay } from "@/lib/trainers/languages"
import { toDateInputValue } from "@/lib/trainers/dateInput"
import type { ClientTrainerOnboarding } from "@/lib/trainers/trainerOnboardingClient"

type FormValues = TrainerOnboardingCreateInput

export function TrainerOnboardingDetailPanel({ onboarding }: { onboarding: ClientTrainerOnboarding }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(TrainerOnboardingCreateSchema),
    defaultValues: {
      name: onboarding.name,
      phone: onboarding.phone,
      email: onboarding.email ?? "",
      employeeRef: onboarding.employeeRef ?? "",
      govtIdentityId: onboarding.govtIdentityId ?? "",
      areaLocality: onboarding.areaLocality ?? "",
      experience: onboarding.experience ?? "",
      languagesKnown: languagesToDisplay(onboarding.languagesKnown),
      imageUrl: onboarding.imageUrl ?? "",
      address: onboarding.address ?? "",
      pipelineStage: onboarding.pipelineStage as FormValues["pipelineStage"],
      tentativeStartDate: toDateInputValue(onboarding.tentativeStartDate),
      joinedOn: toDateInputValue(onboarding.joinedOn),
    },
  })

  const stage = watch("pipelineStage")

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trainers/onboarding/${onboarding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to update")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    if (!confirm("Remove this candidate from the pipeline?")) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/trainers/onboarding/${onboarding.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/cf-admin/trainers/hiring")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4 max-w-2xl"
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Full name *</label>
          <input {...register("name")} className="form-input" />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Phone *</label>
            <input {...register("phone")} className="form-input" />
            {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Email</label>
            <input {...register("email")} type="email" className="form-input" />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
              Internal / employee ID
            </label>
            <input {...register("employeeRef")} className="form-input" />
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
          <input {...register("areaLocality")} className="form-input" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Experience</label>
          <input {...register("experience")} className="form-input" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
            Languages known
          </label>
          <input {...register("languagesKnown")} className="form-input" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Image URL</label>
          <input {...register("imageUrl")} className="form-input" />
          {errors.imageUrl && <p className="text-xs text-red-400">{errors.imageUrl.message}</p>}
        </div>

        {onboarding.imageUrl && (
          <div className="relative max-w-xs rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={onboarding.imageUrl}
              alt=""
              className="w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-oc-base/70 to-transparent" />
          </div>
        )}

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
            <p className="text-[11px] text-oc-fg-dim">Expected employment or cohort start.</p>
          </div>
        )}

        {stage === "OFFER_ACCEPTED" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Joined on</label>
            <input {...register("joinedOn")} type="date" className="form-input" />
            <p className="text-[11px] text-oc-fg-dim">Actual join date as an employee.</p>
          </div>
        )}

        <p className="text-[11px] text-oc-fg-dim">
          After offer acceptance, enroll them in{" "}
          <span className="text-oc-fg-muted">L0 training</span> (separate tab). Center assignment uses{" "}
          <span className="text-oc-fg-muted">Assigned to centers</span> once they are on the roster.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="px-4 py-2 border border-red-500/40 text-red-400 text-sm rounded-lg hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove from pipeline"}
          </button>
        </div>
      </form>
    </div>
  )
}
