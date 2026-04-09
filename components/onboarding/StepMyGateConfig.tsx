"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MyGateConfigSchema, type MyGateConfig } from "@/lib/validations/center"
import { Button } from "@/components/ui/button"
import { FormField } from "./FormField"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight, Wifi } from "lucide-react"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepMyGateConfig({ data, onChange, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MyGateConfig>({
    resolver: zodResolver(MyGateConfigSchema),
    defaultValues: {
      societyId: data.myGateSocietyId ?? "",
      apiKey: data.myGateApiKey ?? "",
      webhookUrl: data.myGateWebhookUrl ?? "",
    },
  })

  function onSubmit(values: MyGateConfig) {
    onChange({
      myGateSocietyId: values.societyId,
      myGateApiKey: values.apiKey,
      myGateWebhookUrl: values.webhookUrl,
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-base font-semibold text-oc-fg">MyGate Integration</h2>
        </div>
        <p className="text-sm text-oc-fg-muted mt-1">
          Connect MyGate to enable automatic footfall tracking and trainer attendance
          via gate scans. Get credentials from the MyGate society admin.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400 font-medium">
          Stub mode — MyGate integration is configured but not live yet.
          Events will be simulated until the webhook is activated.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="MyGate Society ID" error={errors.societyId?.message} required>
          <input
            {...register("societyId")}
            placeholder="e.g. MGS-PLH-7721"
            className="form-input"
          />
        </FormField>

        <FormField
          label="API Key"
          error={errors.apiKey?.message}
          hint="From MyGate developer console"
          required
        >
          <input
            {...register("apiKey")}
            type="password"
            placeholder="mg_live_pk_..."
            className="form-input font-mono-metric"
          />
        </FormField>

        <FormField
          label="Webhook URL"
          error={errors.webhookUrl?.message}
          hint="Where MyGate will POST events"
          className="sm:col-span-2"
        >
          <input
            {...register("webhookUrl")}
            placeholder="https://omnicore.internal/api/webhooks/mygate/{centerId}"
            className="form-input font-mono-metric text-xs"
          />
        </FormField>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" type="button" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button type="submit">
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
