import { z } from "zod"

import { CenterModuleKey } from "@/lib/constants/enums"

const VALID_MODULE_KEYS = [
  CenterModuleKey.TRAINERS,
  CenterModuleKey.ASSETS,
  CenterModuleKey.VENDING_MACHINES,
  CenterModuleKey.BRANDING,
  CenterModuleKey.MYGATE,
] as const

export const CreateLeadSchema = z.object({
  societyName: z.string().min(2, "Society name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional()
    .or(z.literal("")),
})
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

// Shape of the JSON stored in Lead.formData after RWA Admin completes the wizard.
// Mirrors OnboardingPayloadSchema in app/api/onboarding/route.ts.
const SelectedEquipmentItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  qty: z.number().int().min(1),
  imageUrl: z.string().optional(),
})

export const LeadFormSubmitSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  capacity: z.number().int().min(1).max(500),
  gymSqFt: z.number().int().min(100).optional(),
  rwaName: z.string().min(2),
  totalUnits: z.number().int().min(1),
  contactPersonName: z.string().min(2),
  contactPersonPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  contactPersonEmail: z.string().email(),
  selectedModules: z.array(z.enum(VALID_MODULE_KEYS)),
  selectedEquipment: z.array(SelectedEquipmentItemSchema).optional().default([]),
  trainerIds: z.array(z.string()).optional(),
  myGateSocietyId: z.string().optional(),
  myGateApiKey: z.string().optional(),
  myGateWebhookUrl: z.string().optional(),
  displayName: z.string().optional(),
})
export type LeadFormSubmitInput = z.infer<typeof LeadFormSubmitSchema>
