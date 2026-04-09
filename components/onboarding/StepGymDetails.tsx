"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { OnboardingStep1Schema, type OnboardingStep1 } from "@/lib/validations/center"
import { Button } from "@/components/ui/button"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronRight } from "lucide-react"
import { FormField } from "./FormField"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
}

export function StepGymDetails({ data, onChange, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingStep1>({
    resolver: zodResolver(OnboardingStep1Schema),
    defaultValues: {
      name: data.name,
      code: data.code,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      capacity: data.capacity || undefined,
      gymSqFt: data.gymSqFt,
      rwaName: data.rwaName,
      totalUnits: data.totalUnits || undefined,
      contactPersonName: data.contactPersonName,
      contactPersonPhone: data.contactPersonPhone,
      contactPersonEmail: data.contactPersonEmail,
    },
  })

  function onSubmit(values: OnboardingStep1) {
    onChange(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Gym / Center Info */}
      <section>
        <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-4">
          Gym Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Center / Gym Name" error={errors.name?.message} required>
            <input
              {...register("name")}
              placeholder="e.g. Prestige Lakeside Gym"
              className="form-input"
            />
          </FormField>

          <FormField
            label="Center Code"
            error={errors.code?.message}
            hint="Unique identifier — uppercase, no spaces"
            required
          >
            <input
              {...register("code")}
              placeholder="e.g. PLH-001"
              className="form-input uppercase"
            />
          </FormField>

          <FormField label="Gym Area (sq ft)" error={errors.gymSqFt?.message}>
            <input
              {...register("gymSqFt", { valueAsNumber: true })}
              type="number"
              placeholder="e.g. 2500"
              className="form-input"
            />
          </FormField>

          <FormField label="Member Capacity" error={errors.capacity?.message} required>
            <input
              {...register("capacity", { valueAsNumber: true })}
              type="number"
              placeholder="e.g. 40"
              className="form-input"
            />
          </FormField>

          <FormField label="Address" error={errors.address?.message} required className="sm:col-span-2">
            <input
              {...register("address")}
              placeholder="Full address"
              className="form-input"
            />
          </FormField>

          <FormField label="City" error={errors.city?.message} required>
            <input {...register("city")} placeholder="e.g. Bengaluru" className="form-input" />
          </FormField>

          <FormField label="Pincode" error={errors.pincode?.message} required>
            <input
              {...register("pincode")}
              placeholder="e.g. 560066"
              maxLength={6}
              className="form-input"
            />
          </FormField>
        </div>
      </section>

      {/* RWA / Society Info */}
      <section>
        <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-4">
          Society / Residential Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="RWA / Society Name" error={errors.rwaName?.message} required className="sm:col-span-2">
            <input
              {...register("rwaName")}
              placeholder="e.g. Prestige Lakeside Residents Association"
              className="form-input"
            />
          </FormField>

          <FormField label="Total Residential Units" error={errors.totalUnits?.message} required>
            <input
              {...register("totalUnits", { valueAsNumber: true })}
              type="number"
              placeholder="e.g. 1200"
              className="form-input"
            />
          </FormField>
        </div>
      </section>

      {/* Contact Person */}
      <section>
        <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-4">
          RWA Contact Person
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" error={errors.contactPersonName?.message} required>
            <input
              {...register("contactPersonName")}
              placeholder="Contact person name"
              className="form-input"
            />
          </FormField>

          <FormField label="Phone" error={errors.contactPersonPhone?.message} required>
            <input
              {...register("contactPersonPhone")}
              placeholder="+91 98765 43210"
              className="form-input"
            />
          </FormField>

          <FormField label="Email" error={errors.contactPersonEmail?.message} required>
            <input
              {...register("contactPersonEmail")}
              type="email"
              placeholder="contact@rwa.com"
              className="form-input"
            />
          </FormField>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <Button type="submit">
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
