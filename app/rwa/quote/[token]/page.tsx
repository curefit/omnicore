import { QuoteSummaryCard } from "@/components/rwa/QuoteSummaryCard"
import { QuoteAcceptButtons } from "@/components/rwa/QuoteAcceptButtons"
import { QuoteRevisionForm } from "@/components/rwa/QuoteRevisionForm"
import { QuoteHistoryTimeline } from "@/components/leads/QuoteHistoryTimeline"

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

  if (!quote) {
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

  if (quote.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Negotiation Cancelled</h1>
          <p className="text-sm text-[#6b7280]">This quote has been cancelled. Contact CultSport to restart.</p>
        </div>
      </div>
    )
  }

  if (quote.status === "ACCEPTED") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <span className="text-emerald-400 text-xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Quote Accepted</h1>
          <p className="text-sm text-[#6b7280]">Your gym setup is confirmed. CultSport will be in touch.</p>
        </div>
      </div>
    )
  }

  if (quote.status === "REVISION_REQUESTED") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <span className="text-amber-400 text-lg">↺</span>
          </div>
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Revision Requested</h1>
          <p className="text-sm text-[#6b7280]">
            Your revision request has been sent to the CultSport team. They will review and send an updated quote shortly.
          </p>
          <p className="text-xs text-[#4b5563]">Round {quote.revisionRound} of negotiation</p>
        </div>
      </div>
    )
  }

  if (quote.status !== "SENT") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Quote Not Ready</h1>
          <p className="text-sm text-[#6b7280]">The CultSport team is still preparing your quote.</p>
        </div>
      </div>
    )
  }

  // Parse current equipment for the revision form
  const formData = lead.formData ? (() => { try { return JSON.parse(lead.formData) } catch { return null } })() : null
  const currentEquipment = formData?.selectedEquipment ?? []

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
          {quote.revisionRound > 0 && (
            <p className="text-xs text-[#6b7280]">Revised quote · Round {quote.revisionRound}</p>
          )}
        </div>

        <QuoteSummaryCard quote={quote} />

        <QuoteAcceptButtons leadId={lead.id} />

        {/* Revision form — add/remove equipment and request changes */}
        <div className="border-t border-[#1f2937] pt-6">
          <QuoteRevisionForm
            leadId={lead.id}
            currentEquipment={currentEquipment}
          />
        </div>

        {/* Quote history */}
        {quote.historyJson && (
          <div className="border-t border-[#1f2937] pt-6">
            <QuoteHistoryTimeline historyJson={quote.historyJson} />
          </div>
        )}
      </div>
    </div>
  )
}
