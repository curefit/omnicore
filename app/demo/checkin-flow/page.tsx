"use client"

import { useEffect, useState, type ClipboardEvent } from "react"

/** Ensures paste updates React state (some browsers/embeddings skip onChange on paste for controlled inputs). */
function handlePasteText(setter: (value: string) => void) {
  return (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text/plain").trim()
    if (!text) return
    e.preventDefault()
    setter(text)
  }
}

/** Hackathon UI: simulate "MyGate calls CureFit" then show resident QR; test verify below. */
export default function DemoCheckinFlowPage() {
  const [centerId, setCenterId] = useState("")
  const [memberName, setMemberName] = useState("Demo Resident")
  const [memberFlat, setMemberFlat] = useState("A-101")
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [slotHour, setSlotHour] = useState(10)
  const [secret, setSecret] = useState("")
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [payload, setPayload] = useState<string | null>(null)
  const [verifyRaw, setVerifyRaw] = useState("")
  const [verifyResult, setVerifyResult] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [centers, setCenters] = useState<{ id: string; name: string; code: string }[] | null>(null)
  const [centersError, setCentersError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/demo/centers")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ centers: { id: string; name: string; code: string }[] }>
      })
      .then((data) => {
        if (cancelled) return
        setCenters(data.centers ?? [])
        setCenterId((prev) => {
          if (prev.trim()) return prev
          const first = data.centers?.[0]?.id
          return first ?? ""
        })
      })
      .catch(() => {
        if (!cancelled) setCentersError("Could not load centers (is the DB migrated and seeded?)")
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function createBooking() {
    setLoading(true)
    setBookingError(null)
    setVerifyResult(null)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (secret.trim()) headers["x-demo-secret"] = secret.trim()
      const res = await fetch("/api/demo/mygate-proxy/booking", {
        method: "POST",
        headers,
        body: JSON.stringify({
          centerId,
          memberName,
          memberFlat,
          slotDate,
          slotHour,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setQrSvg(null)
        setPayload(null)
        setBookingError(JSON.stringify(json, null, 2))
        return
      }
      setQrSvg(json.qrSvg as string)
      setPayload(json.checkInPayload as string)
      setVerifyRaw(json.checkInPayload as string)
    } finally {
      setLoading(false)
    }
  }

  async function verify() {
    setLoading(true)
    setBookingError(null)
    try {
      const res = await fetch("/api/kiosk/verify-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: verifyRaw, strictSlot: false }),
      })
      const json = await res.json()
      setVerifyResult(JSON.stringify(json, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6 text-oc-fg-soft">
      <div>
        <h1 className="text-xl font-semibold">Demo: MyGate proxy → QR → kiosk</h1>
        <p className="mt-2 text-sm text-oc-fg-muted">
          1) Choose a <code className="text-[#a5b4fc]">centerId</code> from the dropdown (loaded from this server&apos;s DB) or paste one that exists after{" "}
          <code className="text-[#a5b4fc]">npm run db:seed</code> — ids change each seed, so an old id from docs or another machine will fail. 2) Create booking + QR. 3) Verify below.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-white/10 bg-[#111] p-4">
        <h2 className="text-sm font-medium text-white">Proxy: POST /api/demo/mygate-proxy/booking</h2>
        {centersError ? (
          <p className="text-xs text-amber-400">{centersError}</p>
        ) : null}
        {centers && centers.length > 0 ? (
          <label className="block text-xs text-oc-fg-muted">
            Center (seeded in this database)
            <select
              className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              name="demo-center-pick"
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-xs text-oc-fg-muted">
          centerId (must match a row in the DB this server uses)
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm font-mono"
            value={centerId}
            onChange={(e) => setCenterId(e.target.value.trim())}
            onPaste={handlePasteText(setCenterId)}
            placeholder="cuid — use dropdown above when available"
            autoComplete="off"
            spellCheck={false}
            name="demo-center-id"
          />
        </label>
        <label className="block text-xs text-oc-fg-muted">
          Optional: x-demo-secret (if DEMO_MYGATE_PROXY_SECRET is set in .env)
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onPaste={handlePasteText(setSecret)}
            type="password"
            autoComplete="off"
            name="demo-proxy-secret"
          />
        </label>
        <label className="block text-xs text-oc-fg-muted">
          memberName
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
        </label>
        <label className="block text-xs text-oc-fg-muted">
          memberFlat
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
            value={memberFlat}
            onChange={(e) => setMemberFlat(e.target.value)}
          />
        </label>
        <label className="block text-xs text-oc-fg-muted">
          slotDate
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
            type="date"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
          />
        </label>
        <label className="block text-xs text-oc-fg-muted">
          slotHour (5–21)
          <input
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 text-sm"
            type="number"
            min={5}
            max={21}
            value={slotHour}
            onChange={(e) => setSlotHour(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={loading || !centerId}
          onClick={createBooking}
          className="rounded bg-[#6366f1] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? "…" : "Create booking + QR"}
        </button>
        {bookingError ? (
          <pre className="overflow-x-auto rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 whitespace-pre-wrap">
            {bookingError}
          </pre>
        ) : null}
        {qrSvg ? (
          <div className="flex justify-center rounded bg-white p-4">
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
              alt="Check-in QR code"
              className="h-auto max-w-full"
            />
          </div>
        ) : null}
        {payload ? (
          <p className="break-all font-mono text-xs text-[#a5b4fc]">
            Payload: {payload}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border border-white/10 bg-[#111] p-4">
        <h2 className="text-sm font-medium text-white">Kiosk: POST /api/kiosk/verify-checkin</h2>
        <p className="text-[11px] text-oc-fg-dim">
          Response JSON appears here after <strong className="text-oc-fg-muted">Verify check-in</strong> — not from Create booking.
        </p>
        <label className="block text-xs text-oc-fg-muted">
          Scanned / pasted raw string
          <textarea
            className="mt-1 w-full rounded border border-white/10 bg-oc-inset px-2 py-1.5 font-mono text-sm"
            rows={3}
            value={verifyRaw}
            onChange={(e) => setVerifyRaw(e.target.value)}
            onPaste={handlePasteText(setVerifyRaw)}
            autoComplete="off"
            spellCheck={false}
            name="demo-verify-raw"
          />
        </label>
        <button
          type="button"
          disabled={loading || !verifyRaw.trim()}
          onClick={verify}
          className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Verify check-in
        </button>
        {verifyResult ? (
          <pre className="overflow-x-auto rounded bg-oc-inset p-3 text-xs text-oc-fg-hint">{verifyResult}</pre>
        ) : null}
      </section>
    </div>
  )
}
