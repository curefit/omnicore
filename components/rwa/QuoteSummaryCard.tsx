import { formatPaise } from "@/lib/leads/quote"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"

interface LineItem {
  id: string
  moduleKey: string
  pricingType: string
  oneTimeFee: number | null
  monthlyFee: number | null
  takeRatePct: number | null
}

interface Quote {
  id: string
  status: string
  notes: string | null
  lineItems: LineItem[]
}

interface Props {
  quote: Quote
}

export function QuoteSummaryCard({ quote }: Props) {
  const totalOneTime = quote.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0)
  const totalMonthly = quote.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0)

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f2937] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f2937]">
        <h2 className="text-sm font-medium text-[#e5e7eb]">Service Pricing</h2>
      </div>

      <div className="divide-y divide-[#1f2937]">
        {quote.lineItems.map((li) => (
          <div key={li.id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#e5e7eb]">{li.moduleKey}</p>
              <p className="text-xs text-[#6b7280]">
                {MODULE_PRICING_LABEL[li.moduleKey as keyof typeof MODULE_PRICING_LABEL]}
              </p>
            </div>
            <div className="text-right space-y-0.5">
              {li.oneTimeFee != null && li.oneTimeFee > 0 && (
                <p className="text-sm text-[#e5e7eb]">{formatPaise(li.oneTimeFee)} one-time</p>
              )}
              {li.monthlyFee != null && li.monthlyFee > 0 && (
                <p className="text-sm text-[#e5e7eb]">{formatPaise(li.monthlyFee)}/month</p>
              )}
              {li.takeRatePct != null && li.takeRatePct > 0 && (
                <p className="text-xs text-[#6b7280]">{li.takeRatePct}% revenue share</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-[#1f2937] bg-[#0a0a0a] space-y-1">
        {totalOneTime > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Total One-time Investment</span>
            <span className="text-[#e5e7eb] font-semibold">{formatPaise(totalOneTime)}</span>
          </div>
        )}
        {totalMonthly > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Total Monthly</span>
            <span className="text-[#e5e7eb] font-semibold">{formatPaise(totalMonthly)}</span>
          </div>
        )}
      </div>

      {quote.notes && (
        <div className="px-6 py-4 border-t border-[#1f2937]">
          <p className="text-xs text-[#6b7280]">Notes from CultSport</p>
          <p className="text-sm text-[#e5e7eb] mt-1">{quote.notes}</p>
        </div>
      )}
    </div>
  )
}
