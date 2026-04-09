import { z } from "zod"

import { CenterModuleKey } from "@/lib/constants/enums"

const VALID_MODULE_KEYS = [
  CenterModuleKey.TRAINERS,
  CenterModuleKey.ASSETS,
  CenterModuleKey.VENDING_MACHINES,
  CenterModuleKey.BRANDING,
  CenterModuleKey.MYGATE,
] as const

const VALID_PRICING_TYPES = [
  "MONTHLY",
  "ONE_TIME",
  "ONE_TIME_PLUS_TAKE_RATE",
] as const

export const QuoteLineItemSchema = z.object({
  moduleKey: z.enum(VALID_MODULE_KEYS),
  pricingType: z.enum(VALID_PRICING_TYPES),
  oneTimeFee: z.number().int().min(0).optional(),
  monthlyFee: z.number().int().min(0).optional(),
  takeRatePct: z.number().min(0).max(100).optional(),
})
export type QuoteLineItemInput = z.infer<typeof QuoteLineItemSchema>

export const CreateQuoteSchema = z.object({
  notes: z.string().optional(),
  quoteMode: z.enum(["ITEMIZED", "TOTAL"]).optional().default("ITEMIZED"),
  totalAmount: z.number().int().min(0).optional(),
  lineItems: z.array(QuoteLineItemSchema).min(1, "At least one line item is required"),
})
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

export const UpdatePricingConfigSchema = z.object({
  defaultOneTimeFee: z.number().int().min(0).optional(),
  defaultMonthlyFee: z.number().int().min(0).optional(),
  defaultTakeRatePct: z.number().min(0).max(100).optional(),
})
export type UpdatePricingConfigInput = z.infer<typeof UpdatePricingConfigSchema>
