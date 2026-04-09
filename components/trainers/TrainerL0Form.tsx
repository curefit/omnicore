"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  TrainerL0CreateSchema,
  type TrainerL0CreateInput,
} from "@/lib/validations/trainerL0"
import { L0_STAGES, L0_STAGE_LABELS } from "@/lib/trainers/l0Stages"

export function TrainerL0Form() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainerL0CreateInput>({
    resolver: zodResolver(TrainerL0CreateSchema),
    defaultValues: {
      l0Stage: "NOT_STARTED",
    },
  })

  const onSubmit = async (data: TrainerL0CreateInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/trainers/l0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
      router.push(`/cf-admin/trainers/l0/${json.enrollment.id}`)
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
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
          Internal / employee ID
        </label>
        <input {...register("employeeRef")} className="form-input" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">L0 start date</label>
          <input {...register("startDate")} type="date" className="form-input" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">L0 end date</label>
          <input {...register("endDate")} type="date" className="form-input" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Notes</label>
        <textarea {...register("notes")} className="form-input min-h-[72px]" rows={3} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">L0 stage</label>
        <select {...register("l0Stage")} className="form-input">
          {L0_STAGES.map((s) => (
            <option key={s} value={s}>
              {L0_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-amber-500/90 text-oc-base text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add enrollment"}
      </button>
    </form>
  )
}
