import { z } from "zod"

export const TrainerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  email: z.string().email("Enter a valid email").optional(),
  trainerType: z.enum(["FULLTIME", "PT"] as const),
  specialization: z.string().optional(),
  certifications: z.string().optional(),
  joinedOn: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type TrainerFormValues = z.infer<typeof TrainerSchema>

export const CenterTrainerMappingSchema = z.object({
  centerId: z.string().min(1, "Center is required"),
  trainerId: z.string().min(1, "Trainer is required"),
  assignedOn: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CenterTrainerMappingValues = z.infer<typeof CenterTrainerMappingSchema>
