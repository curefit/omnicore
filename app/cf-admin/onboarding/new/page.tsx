import { prisma } from "@/lib/db/client"
import { OnboardingShell } from "@/components/onboarding/OnboardingShell"

async function getAvailableTrainers() {
  return prisma.trainer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, trainerType: true },
    orderBy: { name: "asc" },
  })
}

export default async function NewOnboardingPage() {
  const trainers = await getAvailableTrainers()
  return <OnboardingShell availableTrainers={trainers} />
}
