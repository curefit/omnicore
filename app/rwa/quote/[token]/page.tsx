import { QuoteSummaryCard } from "@/components/rwa/QuoteSummaryCard"
import { QuoteAcceptButtons } from "@/components/rwa/QuoteAcceptButtons"

interface Props {
  params: Promise<{ token: string }>
}

export default async function RWAQuotePage({ params }: Props) {
  const { token } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/leads/token/${token}?forQuote=true`,
    { cache: "no-store" }
  )

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const message = json.error ?? "Unable to load quote"
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Quote Unavailable</h1>
          <p className="text-sm text-[#6b7280]">{message}</p>
        </div>
      </div>
    )
  }

  const { lead } = await res.json()
  const { quote } = lead

  if (!quote || quote.status !== "SENT") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Quote Not Ready</h1>
          <p className="text-sm text-[#6b7280]">
            The CultSport team is still preparing your quote. Check back soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center mx-auto">
            <span className="text-[#f97316] text-lg font-bold">O</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#e5e7eb]">Your Quote</h1>
          <p className="text-sm text-[#6b7280]">
            Review the pricing below for <strong className="text-[#e5e7eb]">{lead.societyName}</strong>.
          </p>
        </div>
        <QuoteSummaryCard quote={quote} />
        <QuoteAcceptButtons leadId={lead.id} />
      </div>
    </div>
  )
}
