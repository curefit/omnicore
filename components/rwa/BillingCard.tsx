import { formatPaise } from "@/lib/leads/quote"
import { CheckCircle2, Calendar, Package } from "lucide-react"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"

interface LineItem {
  moduleKey: string
  pricingType: string
  oneTimeFee: number | null
  monthlyFee: number | null
  takeRatePct: number | null
}

interface Props {
  quote: {
    acceptedAt: Date | null
    quoteMode: string
    totalAmount: number | null
    lineItems: LineItem[]
    notes: string | null
  }
  centerName: string
}

export function BillingCard({ quote, centerName }: Props) {
  const isTotal = quote.quoteMode === "TOTAL"
  const totalOneTime = quote.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0)
  const totalMonthly = quote.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0)
  const modules = quote.lineItems.map((li) => li.moduleKey)

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-emerald-500/10">
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400">Quote Accepted — Setup Confirmed</p>
          <p className="text-xs text-[#6b7280] mt-0.5">{centerName}</p>
          {quote.acceptedAt && (
            <p className="flex items-center gap-1 text-[11px] text-[#6b7280] mt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(quote.acceptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="px-5 py-3 border-b border-emerald-500/10">
        <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
          <Package className="w-3 h-3 inline mr-1" />
          Services Included
        </p>
        <div className="flex flex-wrap gap-1.5">
          {modules.map((m) => (
            <span key={m} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Amounts */}
      <div className="px-5 py-4 space-y-2">
        {isTotal && quote.totalAmount ? (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[#9ca3af]">Total Agreed Amount</span>
            <span className="text-xl font-bold text-emerald-400">{formatPaise(quote.totalAmount)}</span>
          </div>
        ) : (
          <>
            {totalOneTime > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca3af]">One-time Setup</span>
                <span className="font-bold text-white">{formatPaise(totalOneTime)}</span>
              </div>
            )}
            {totalMonthly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca3af]">Monthly</span>
                <span className="font-bold text-white">{formatPaise(totalMonthly)}<span className="text-[#6b7280] text-xs font-normal">/mo</span></span>
              </div>
            )}
          </>
        )}

        {quote.notes && (
          <p className="text-[11px] text-[#6b7280] pt-1 border-t border-emerald-500/10 italic">
            &ldquo;{quote.notes}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
