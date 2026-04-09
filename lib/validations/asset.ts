import { z } from "zod"

export const AssetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category: z.string().min(2, "Category is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchasedOn: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  lastServicedOn: z.string().optional(),
  nextServiceDue: z.string().optional(),
  condition: z.enum(["GOOD", "FAIR", "POOR"] as const).default("GOOD"),
  notes: z.string().optional(),
})

export type AssetFormValues = z.infer<typeof AssetSchema>
