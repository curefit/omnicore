import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { TrainerOnboardingDetailPanel } from "@/components/trainers/TrainerOnboardingDetailPanel"
import { TRAINER_ONBOARDING_STAGE_LABELS } from "@/lib/trainers/onboardingStages"
import { toClientTrainerOnboarding } from "@/lib/trainers/trainerOnboardingClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TrainerOnboardingDetailPage({ params }: Props) {
  const { id } = await params
  const onboarding = await prisma.trainerOnboarding.findUnique({
    where: { id },
  })

  if (!onboarding) notFound()

  const stageLabel =
    TRAINER_ONBOARDING_STAGE_LABELS[
      onboarding.pipelineStage as keyof typeof TRAINER_ONBOARDING_STAGE_LABELS
    ] ?? onboarding.pipelineStage

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cf-admin/trainers/hiring" className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to hiring pipeline
        </Link>
      </div>

      <div>
        <p className="text-xs font-medium text-oc-fg-dim uppercase tracking-wider">{stageLabel}</p>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft mt-1">{onboarding.name}</h1>
        {onboarding.employeeRef && (
          <p className="text-sm text-oc-fg-muted mt-1">Ref: {onboarding.employeeRef}</p>
        )}
      </div>

      <TrainerOnboardingDetailPanel onboarding={toClientTrainerOnboarding(onboarding)} />
    </div>
  )
}
