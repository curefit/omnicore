import { z } from "zod"
import { CenterModuleKey } from "@/lib/constants/enums"

// ─── Step 1: Gym & Society Details ────────────────────────────────────────────

export const GymDetailsSchema = z.object({
  name: z.string().min(2, "Center name must be at least 2 characters"),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  capacity: z
    .number()
    .int()
    .min(1, "Capacity must be at least 1")
    .max(500, "Capacity cannot exceed 500"),
  gymSqFt: z
    .number()
    .int()
    .min(100, "Gym must be at least 100 sq ft")
    .optional(),
  operatingSince: z.string().optional(),
})

export const ResidentialDetailsSchema = z.object({
  rwaName: z.string().min(2, "RWA name is required"),
  totalUnits: z
    .number()
    .int()
    .min(1, "Must have at least 1 unit"),
  contactPersonName: z.string().min(2, "Contact name is required"),
  contactPersonPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  contactPersonEmail: z.string().email("Enter a valid email address"),
})

// Combined step 1
export const OnboardingStep1Schema = GymDetailsSchema.merge(ResidentialDetailsSchema)
export type OnboardingStep1 = z.infer<typeof OnboardingStep1Schema>

// ─── Step 2: Module Selection ─────────────────────────────────────────────────

const moduleKeys = [
  CenterModuleKey.TRAINERS,
  CenterModuleKey.ASSETS,
  CenterModuleKey.VENDING_MACHINES,
  CenterModuleKey.BRANDING,
  CenterModuleKey.MYGATE,
] as const

export const ModuleSelectionSchema = z.object({
  modules: z
    .array(z.enum(moduleKeys))
    .min(1, "Select at least one module to proceed"),
})
export type ModuleSelection = z.infer<typeof ModuleSelectionSchema>

// ─── Step 3e: MyGate Config ───────────────────────────────────────────────────

export const MyGateConfigSchema = z.object({
  societyId: z.string().min(1, "Society ID is required"),
  apiKey: z.string().min(10, "API key must be at least 10 characters"),
  webhookUrl: z.string().url("Enter a valid webhook URL").optional().or(z.literal("")),
})
export type MyGateConfig = z.infer<typeof MyGateConfigSchema>

// ─── Service Config ───────────────────────────────────────────────────────────

export const ServiceConfigSchema = z.object({
  serviceName: z.string().min(2, "Service name is required"),
  serviceType: z.enum(["MEMBERSHIP", "PT", "GROUP_CLASS", "ADD_ON"] as const),
  monthlyFee: z
    .number()
    .min(0, "Fee cannot be negative"),
  setupFee: z
    .number()
    .min(0, "Fee cannot be negative")
    .default(0),
  isActive: z.boolean().default(true),
})
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>
