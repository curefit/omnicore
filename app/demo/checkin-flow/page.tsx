"use client"

import { useState } from "react"

/** Hackathon UI: simulate “MyGate calls CureFit” then show resident QR; test verify below. */
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
  const [loading, setLoading] = useState(false)

  async function createBooking() {
    setLoading(true)
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
        setVerifyResult(JSON.stringify(json, null, 2))
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
    <div className="mx-auto max-w-lg space-y-8 p-6 text-[#e5e7eb]">
      <div>
        <h1 className="text-xl font-semibold">Demo: MyGate proxy → QR → kiosk</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          1) Paste a <code className="text-[#a5b4fc]">centerId</code> from Prisma seed / Studio. 2) Create
          booking (simulates CureFit API after MyGate booking). 3) Scan or paste payload at the gym kiosk
          verify box.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-white/10 bg-[#111] p-4">
        <h2 className="text-sm font-medium text-white">Proxy: POST /api/demo/mygate-proxy/booking</h2>
        <label className="block text-xs text-[#9ca3af]">
          centerId
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            placeholder="cuid from DB"
          />
        </label>
        <label className="block text-xs text-[#9ca3af]">
          Optional: x-demo-secret (if DEMO_MYGATE_PROXY_SECRET is set in .env)
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            type="password"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs text-[#9ca3af]">
          memberName
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
        </label>
        <label className="block text-xs text-[#9ca3af]">
          memberFlat
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
            value={memberFlat}
            onChange={(e) => setMemberFlat(e.target.value)}
          />
        </label>
        <label className="block text-xs text-[#9ca3af]">
          slotDate
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
            type="date"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
          />
        </label>
        <label className="block text-xs text-[#9ca3af]">
          slotHour (5–21)
          <input
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-sm"
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
        <label className="block text-xs text-[#9ca3af]">
          Scanned / pasted raw string
          <textarea
            className="mt-1 w-full rounded border border-white/10 bg-[#0a0a0a] px-2 py-1.5 font-mono text-sm"
            rows={3}
            value={verifyRaw}
            onChange={(e) => setVerifyRaw(e.target.value)}
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
          <pre className="overflow-x-auto rounded bg-[#0a0a0a] p-3 text-xs text-[#d1d5db]">{verifyResult}</pre>
        ) : null}
      </section>
    </div>
  )
}
