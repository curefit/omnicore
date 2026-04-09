import { QuoteSummaryCard } from "@/components/rwa/QuoteSummaryCard"
import { QuoteAcceptButtons } from "@/components/rwa/QuoteAcceptButtons"
import { QuoteRevisionForm } from "@/components/rwa/QuoteRevisionForm"
import { QuoteHistoryTimeline } from "@/components/leads/QuoteHistoryTimeline"
import { OmniMascot } from "@/components/shared/OmniMascot"

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
      <div className="min-h-screen bg-oc-inset flex flex-col items-center justify-center px-4 gap-4">
        <OmniMascot variant="alert" size="lg" />
        <h1 className="text-xl font-display font-bold text-oc-fg tracking-[-0.01em]">Quote Unavailable</h1>
        <p className="text-sm text-oc-fg-dim">{message}</p>
      </div>
    )
  }

  const { lead } = await res.json()
  const { quote } = lead

  if (!quote) {
    return (
      <div className="min-h-screen bg-oc-inset flex flex-col items-center justify-center px-4 gap-4">
        <OmniMascot variant="empty" size="lg" />
        <h1 className="text-xl font-display font-bold text-oc-fg tracking-[-0.01em]">Quote Not Ready</h1>
        <p className="text-sm text-oc-fg-dim">
          The CultSport team is still preparing your quote. Check back soon.
        </p>
      </div>
    )
  }

  if (quote.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-oc-inset flex flex-col items-center justify-center px-4 gap-4">
        <OmniMascot variant="alert" size="lg" />
        <h1 className="text-xl font-display font-bold text-oc-fg tracking-[-0.01em]">Negotiation Cancelled</h1>
        <p className="text-sm text-oc-fg-dim">This quote has been cancelled. Contact CultSport to restart.</p>
      </div>
    )
  }

  if (quote.status === "ACCEPTED") {
    return (
      <div className="min-h-screen bg-oc-inset flex flex-col items-center justify-center px-4 gap-4">
        <OmniMascot variant="success" size="xl" />
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-emerald-400">Quote Accepted!</h1>
        <p className="text-sm text-oc-fg-dim text-center max-w-xs">
          Your gym setup is confirmed. The CultSport team will be in touch to schedule installation.
        </p>
      </div>
    )
  }

  if (quote.status === "REVISION_REQUESTED") {
    return (
      <div className="min-h-screen bg-oc-inset py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6 flex flex-col items-center text-center">
          <OmniMascot variant="empty" size="lg" />
          <h1 className="text-xl font-display font-bold text-oc-fg tracking-[-0.01em]">Revision Requested</h1>
          <p className="text-sm text-oc-fg-dim">
            Your revision request has been sent to the CultSport team. They will review and send an updated quote shortly.
          </p>
          <p className="text-xs text-oc-placeholder">Round {quote.revisionRound} of negotiation</p>
        </div>
      </div>
    )
  }

  if (quote.status !== "SENT") {
    return (
      <div className="min-h-screen bg-oc-inset flex flex-col items-center justify-center px-4 gap-4">
        <OmniMascot variant="empty" size="lg" />
        <h1 className="text-xl font-display font-bold text-oc-fg tracking-[-0.01em]">Quote Not Ready</h1>
        <p className="text-sm text-oc-fg-dim">The CultSport team is still preparing your quote.</p>
      </div>
    )
  }

  const formData = lead.formData ? (() => { try { return JSON.parse(lead.formData) } catch { return null } })() : null
  const currentEquipment = formData?.selectedEquipment ?? []

  return (
    <div className="min-h-screen bg-oc-inset py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="relative mx-auto size-16 rounded-full overflow-hidden bg-oc-deep ring-2 ring-cyan-500/20">
            <OmniMascot variant="avatar" size="sm" className="absolute inset-0 w-full h-full object-cover rounded-none ring-0" />
          </div>
          <h1 className="text-2xl font-display font-bold text-oc-fg tracking-[-0.02em]">Your Quote</h1>
          <p className="text-sm text-oc-fg-dim">
            Review the pricing below for <strong className="text-oc-fg-soft">{lead.societyName}</strong>.
          </p>
          {quote.revisionRound > 0 && (
            <p className="text-xs text-oc-fg-dim">Revised quote · Round {quote.revisionRound}</p>
          )}
        </div>

        <QuoteSummaryCard quote={quote} />

        <QuoteAcceptButtons leadId={lead.id} inviteToken={token} />

        {/* Revision form — add/remove equipment and request changes */}
        <div className="border-t border-oc-border pt-6">
          <QuoteRevisionForm
            leadId={lead.id}
            currentEquipment={currentEquipment}
          />
        </div>

        {/* Quote history */}
        {quote.historyJson && (
          <div className="border-t border-oc-border pt-6">
            <QuoteHistoryTimeline historyJson={quote.historyJson} />
          </div>
        )}
      </div>
    </div>
  )
}
