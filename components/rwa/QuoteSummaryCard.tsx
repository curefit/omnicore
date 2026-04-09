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
  quoteMode?: string
  totalAmount?: number | null
}

interface Props {
  quote: Quote
}

function LineAmounts({ li }: { li: LineItem }) {
  const showOneTime =
    (li.pricingType === "ONE_TIME" || li.pricingType === "ONE_TIME_PLUS_TAKE_RATE") &&
    li.oneTimeFee != null &&
    li.oneTimeFee > 0
  const showMonthly =
    (li.pricingType === "MONTHLY" || li.pricingType === "ONE_TIME_PLUS_TAKE_RATE") &&
    li.monthlyFee != null &&
    li.monthlyFee > 0
  const showTake =
    li.pricingType === "ONE_TIME_PLUS_TAKE_RATE" && li.takeRatePct != null && li.takeRatePct > 0
  if (!showOneTime && !showMonthly && !showTake) {
    return <span className="text-xs text-oc-fg-dim">—</span>
  }
  return (
    <div className="text-right space-y-0.5">
      {showOneTime && <p className="text-sm text-oc-fg-soft">{formatPaise(li.oneTimeFee!)} one-time</p>}
      {showMonthly && <p className="text-sm text-oc-fg-soft">{formatPaise(li.monthlyFee!)}/month</p>}
      {showTake && <p className="text-xs text-oc-fg-dim">{li.takeRatePct}% revenue share</p>}
    </div>
  )
}

export function QuoteSummaryCard({ quote }: Props) {
  const isTotal = quote.quoteMode === "TOTAL"
  const totalOneTime = quote.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0)
  const totalMonthly = quote.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0)
  const totalModeHasLumpSum = quote.totalAmount != null && quote.totalAmount > 0
  /** Lump-sum-only quote: no per-line fees in data — show agreed total so something is still visible. */
  const showLumpSumOnly =
    isTotal && totalModeHasLumpSum && totalOneTime === 0 && totalMonthly === 0

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border overflow-hidden">
      <div className="px-6 py-4 border-b border-oc-border">
        <h2 className="text-sm font-medium text-oc-fg-soft">Service Pricing</h2>
        <p className="text-xs text-oc-fg-dim mt-0.5">
          Price for each selected service. Review one-time and recurring amounts before accepting.
        </p>
      </div>

      <div className="divide-y divide-oc-border">
        {quote.lineItems.map((li) => (
          <div key={li.id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-oc-fg-soft">{li.moduleKey}</p>
              <p className="text-xs text-oc-fg-dim">
                {MODULE_PRICING_LABEL[li.moduleKey as keyof typeof MODULE_PRICING_LABEL]}
              </p>
            </div>
            {showLumpSumOnly ? (
              <span className="text-xs text-oc-fg-dim text-right max-w-[200px]">
                Covered by the agreed total below (no per-line split on this quote)
              </span>
            ) : (
              <LineAmounts li={li} />
            )}
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-oc-border bg-oc-inset space-y-1">
        {showLumpSumOnly ? (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-oc-fg-dim">Agreed Total Amount</span>
            <span className="text-lg font-semibold text-[#f97316]">{formatPaise(quote.totalAmount!)}</span>
          </div>
        ) : (
          <>
            {totalOneTime > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-oc-fg-dim">Total One-time Investment</span>
                <span className="text-oc-fg-soft font-semibold">{formatPaise(totalOneTime)}</span>
              </div>
            )}
            {totalMonthly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-oc-fg-dim">Total Monthly</span>
                <span className="text-oc-fg-soft font-semibold">{formatPaise(totalMonthly)}</span>
              </div>
            )}
            {!totalOneTime && !totalMonthly && !showLumpSumOnly && (
              <div className="flex justify-between text-sm">
                <span className="text-oc-fg-dim">Totals</span>
                <span className="text-oc-fg-soft">—</span>
              </div>
            )}
          </>
        )}
      </div>

      {quote.notes && (
        <div className="px-6 py-4 border-t border-oc-border">
          <p className="text-xs text-oc-fg-dim">Notes from CultSport</p>
          <p className="text-sm text-oc-fg-soft mt-1">{quote.notes}</p>
        </div>
      )}
    </div>
  )
}
