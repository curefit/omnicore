// Domain enums — used for type-safe validation throughout the app.
// These mirror the String fields in Prisma schema.

export const CenterStatus = {
  ACTIVE: "ACTIVE",
  ONBOARDING: "ONBOARDING",
  INACTIVE: "INACTIVE",
} as const
export type CenterStatus = (typeof CenterStatus)[keyof typeof CenterStatus]

export const TrainerType = {
  FULLTIME: "FULLTIME",
  PT: "PT",
} as const
export type TrainerType = (typeof TrainerType)[keyof typeof TrainerType]

export const AttendanceSource = {
  MYGATE: "MYGATE",
  OTP: "OTP",
  MANUAL: "MANUAL",
} as const
export type AttendanceSource = (typeof AttendanceSource)[keyof typeof AttendanceSource]

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
} as const
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

export const AssetCondition = {
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
} as const
export type AssetCondition = (typeof AssetCondition)[keyof typeof AssetCondition]

export const ServiceRequestStatus = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
} as const
export type ServiceRequestStatus = (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus]

export const ServiceRequestPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const
export type ServiceRequestPriority =
  (typeof ServiceRequestPriority)[keyof typeof ServiceRequestPriority]

// ─── Center modules ───────────────────────────────────────────────────────────
// Which capabilities/modules are enabled for a center.
// Drives onboarding step visibility and CF Admin section access.

export const CenterModuleKey = {
  TRAINERS: "TRAINERS",
  ASSETS: "ASSETS",
  VENDING_MACHINES: "VENDING_MACHINES",
  BRANDING: "BRANDING",
  MYGATE: "MYGATE",
} as const
export type CenterModuleKey = (typeof CenterModuleKey)[keyof typeof CenterModuleKey]

export interface CenterModuleMeta {
  key: CenterModuleKey
  label: string
  description: string
  icon: string
  onboardingStep: string
}

export const CENTER_MODULE_META: CenterModuleMeta[] = [
  {
    key: CenterModuleKey.TRAINERS,
    label: "Trainers",
    description: "Enable trainer management, attendance tracking, and PT payroll.",
    icon: "Users",
    onboardingStep: "Trainer Setup",
  },
  {
    key: CenterModuleKey.ASSETS,
    label: "Asset Management",
    description: "Track gym equipment, service schedules, and condition status.",
    icon: "Wrench",
    onboardingStep: "Asset Setup",
  },
  {
    key: CenterModuleKey.VENDING_MACHINES,
    label: "Vending Machines",
    description: "Manage vending machine placements and service tracking.",
    icon: "Package",
    onboardingStep: "Vending Machine Setup",
  },
  {
    key: CenterModuleKey.BRANDING,
    label: "Branding",
    description: "Configure center branding, display name, and visual identity.",
    icon: "Palette",
    onboardingStep: "Branding Setup",
  },
  {
    key: CenterModuleKey.MYGATE,
    label: "MyGate Integration",
    description: "Enable MyGate-driven footfall tracking and trainer attendance.",
    icon: "Wifi",
    onboardingStep: "MyGate Config",
  },
]

export const FootfallEventType = {
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
} as const
export type FootfallEventType = (typeof FootfallEventType)[keyof typeof FootfallEventType]

export const ServiceType = {
  MEMBERSHIP: "MEMBERSHIP",
  PT: "PT",
  GROUP_CLASS: "GROUP_CLASS",
  ADD_ON: "ADD_ON",
} as const
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

// ─── Asset status calculation ─────────────────────────────────────────────────
// >30 days to service due = GREEN (GOOD)
// 7–30 days = AMBER (FAIR)
// <7 days or overdue = RED (POOR)

export function computeAssetStatus(nextServiceDue: Date | null): AssetCondition {
  if (!nextServiceDue) return AssetCondition.GOOD
  const daysUntilDue = Math.floor(
    (nextServiceDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilDue < 7) return AssetCondition.POOR
  if (daysUntilDue <= 30) return AssetCondition.FAIR
  return AssetCondition.GOOD
}

export const ASSET_STATUS_COLOR: Record<AssetCondition, string> = {
  GOOD: "text-emerald-400",
  FAIR: "text-amber-400",
  POOR: "text-red-400",
}

export const ASSET_STATUS_BG: Record<AssetCondition, string> = {
  GOOD: "bg-emerald-500/10 border-emerald-500/20",
  FAIR: "bg-amber-500/10 border-amber-500/20",
  POOR: "bg-red-500/10 border-red-500/20",
}

export const SERVICE_REQUEST_STATUS_COLOR: Record<ServiceRequestStatus, string> = {
  OPEN: "text-red-400",
  ASSIGNED: "text-amber-400",
  IN_PROGRESS: "text-cyan-400",
  RESOLVED: "text-emerald-400",
}

export const SERVICE_REQUEST_STATUS_BG: Record<ServiceRequestStatus, string> = {
  OPEN: "bg-red-500/10 border-red-500/20",
  ASSIGNED: "bg-amber-500/10 border-amber-500/20",
  IN_PROGRESS: "bg-cyan-500/10 border-cyan-500/20",
  RESOLVED: "bg-emerald-500/10 border-emerald-500/20",
}

// ─── Lead funnel ──────────────────────────────────────────────────────────────

export const LeadStatus = {
  INVITED: "INVITED",
  FORM_SUBMITTED: "FORM_SUBMITTED",
  QUOTE_SENT: "QUOTE_SENT",
  ACCEPTED: "ACCEPTED",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
} as const
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus]

export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]

export const PricingType = {
  MONTHLY: "MONTHLY",
  ONE_TIME: "ONE_TIME",
  ONE_TIME_PLUS_TAKE_RATE: "ONE_TIME_PLUS_TAKE_RATE",
} as const
export type PricingType = (typeof PricingType)[keyof typeof PricingType]

export const EquipmentSizeCategory = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
} as const
export type EquipmentSizeCategory =
  (typeof EquipmentSizeCategory)[keyof typeof EquipmentSizeCategory]

// Maps each module to its pricing type — used in QuoteBuilder and ModuleSelector
export const MODULE_PRICING_TYPE: Record<CenterModuleKey, PricingType> = {
  [CenterModuleKey.TRAINERS]: PricingType.MONTHLY,
  [CenterModuleKey.ASSETS]: PricingType.ONE_TIME,
  [CenterModuleKey.VENDING_MACHINES]: PricingType.ONE_TIME_PLUS_TAKE_RATE,
  [CenterModuleKey.MYGATE]: PricingType.MONTHLY,
  [CenterModuleKey.BRANDING]: PricingType.ONE_TIME,
}

// Human-readable label shown to RWA Admin on module cards (no amounts)
export const MODULE_PRICING_LABEL: Record<CenterModuleKey, string> = {
  [CenterModuleKey.TRAINERS]: "Monthly rate",
  [CenterModuleKey.ASSETS]: "One-time setup",
  [CenterModuleKey.VENDING_MACHINES]: "One-time installation + monthly revenue share",
  [CenterModuleKey.MYGATE]: "Monthly rate",
  [CenterModuleKey.BRANDING]: "One-time setup",
}
