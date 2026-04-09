import { z } from "zod"

export const ServiceRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  centerId: z.string().min(1, "Center is required"),
  assetId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).default("MEDIUM"),
  reportedBy: z.string().optional(),
})

export type ServiceRequestFormValues = z.infer<typeof ServiceRequestSchema>

export const UpdateServiceRequestSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"] as const),
  assignedTo: z.string().optional(),
  resolvedAt: z.string().optional(),
})

export type UpdateServiceRequestValues = z.infer<typeof UpdateServiceRequestSchema>
