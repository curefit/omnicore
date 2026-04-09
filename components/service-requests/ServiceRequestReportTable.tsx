import QRCode from "qrcode"
import { AlertCircle, Database } from "lucide-react"
import type { ServiceRequestReportRow, ServiceRequestReportMeta } from "@/lib/reports/serviceRequests"

// ─── Colour helpers ────────────────────────────────────────────────────────────

function statusClass(status: string) {
  if (status === "RESOLVED")    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  if (status === "IN_PROGRESS") return "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"
  if (status === "ASSIGNED")    return "bg-amber-500/10  text-amber-400  border-amber-500/20"
  return "bg-red-500/10 text-red-400 border-red-500/20"
}

function priorityClass(priority: string) {
  if (priority === "CRITICAL") return "text-red-400   font-semibold"
  if (priority === "HIGH")     return "text-amber-400 font-semibold"
  if (priority === "MEDIUM")   return "text-oc-fg-muted"
  return "text-oc-fg-dim"
}

function roleClass(role: ServiceRequestReportRow["raisedByRole"]) {
  if (role === "TRAINER")   return "bg-purple-500/10 text-purple-400 border-purple-500/20"
  if (role === "RWA_ADMIN") return "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"
  return "bg-oc-border text-oc-fg-muted border-oc-muted"
}

// ─── Empty / error state ───────────────────────────────────────────────────────

function EmptyState({ meta }: { meta: ServiceRequestReportMeta }) {
  if (!meta.trinoEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-oc-border p-16 flex flex-col items-center gap-3 text-center">
        <Database className="w-8 h-8 text-oc-muted" />
        <p className="text-sm font-semibold text-oc-fg-muted">Trino not configured</p>
        <p className="text-xs text-oc-fg-dim max-w-sm">
          Add{" "}
          <code className="font-mono bg-oc-border px-1.5 py-0.5 rounded text-[11px]">
            TRINO_HOST / TRINO_USER / TRINO_PASSWORD
          </code>{" "}
          to your <code className="font-mono text-[11px]">.env</code> to pull live AMS data.
        </p>
      </div>
    )
  }

  if (meta.error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-16 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-300">Query error</p>
        <p className="text-xs font-mono text-oc-fg-muted max-w-xl">{meta.error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-oc-border p-16 flex flex-col items-center gap-3 text-center">
      <AlertCircle className="w-8 h-8 text-oc-muted" />
      <p className="text-sm font-semibold text-oc-fg-muted">No service requests found</p>
      {meta.centerIds.length > 0 && (
        <p className="text-xs text-oc-fg-dim">
          Center IDs: <span className="font-mono">{meta.centerIds.join(", ")}</span>
        </p>
      )}
    </div>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────────

export async function ServiceRequestReportTable({
  rows,
  meta,
  readonly,
}: {
  rows: ServiceRequestReportRow[]
  meta: ServiceRequestReportMeta
  readonly: boolean
}) {
  if (rows.length === 0) return <EmptyState meta={meta} />

  // Generate inline QR data-URLs server-side
  const qrMap = new Map<string, string>()
  await Promise.all(
    rows.map(async (row) => {
      const dataUrl = await QRCode.toDataURL(row.qrPayload, {
        margin: 0,
        width: 80,
        color: { dark: "#0d1117", light: "#0000" },
      })
      qrMap.set(row.requestId, dataUrl)
    }),
  )

  return (
    <div className="rounded-2xl border border-oc-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-oc-card border-b border-oc-border">
            <tr className="text-left text-[11px] uppercase tracking-wider text-oc-fg-dim">
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Request</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Equipment</th>
              <th className="px-4 py-3 font-medium">Raised by</th>
              <th className="px-4 py-3 font-medium text-center">QR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border bg-oc-base">
            {rows.map((row) => (
              <tr key={row.requestId} className="align-top hover:bg-oc-card/60 transition-colors">

                {/* Center */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-semibold text-oc-fg leading-tight">{row.centerName}</p>
                  <p className="text-[11px] text-oc-fg-dim font-mono mt-0.5">#{row.centerId}</p>
                </td>

                {/* Request */}
                <td className="px-4 py-3 max-w-[280px]">
                  <p className="font-medium text-oc-fg leading-snug">{row.title}</p>
                  {row.description && (
                    <p className="text-[11px] text-oc-fg-dim mt-1 leading-relaxed line-clamp-2">
                      {row.description}
                    </p>
                  )}
                  <p className="text-[10px] text-oc-placeholder font-mono mt-1">
                    {row.requestId.slice(0, 16)}…
                    {" · "}
                    {new Date(row.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </td>

                {/* Status / Priority */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${statusClass(row.status)}`}>
                    {row.status.replace("_", " ")}
                  </span>
                  <p className={`text-[11px] mt-1.5 ${priorityClass(row.priority)}`}>
                    {row.priority}
                  </p>
                </td>

                {/* Equipment */}
                <td className="px-4 py-3">
                  <p className="font-medium text-oc-fg leading-snug">{row.equipmentName}</p>
                  <p className="text-[11px] text-oc-fg-dim mt-0.5">{row.equipmentCategory}</p>
                  <p className="text-[11px] font-mono text-oc-placeholder mt-0.5">{row.equipmentSerial}</p>
                </td>

                {/* Raised by */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-oc-fg leading-snug">{row.raisedBy}</p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${roleClass(row.raisedByRole)}`}>
                    {row.raisedByRole.replace("_", " ")}
                  </span>
                </td>

                {/* QR */}
                <td className="px-4 py-3 text-center">
                  <div className="inline-block w-14 h-14 rounded-md border border-oc-border bg-white/95 p-1">
                    <img
                      src={qrMap.get(row.requestId) ?? ""}
                      alt={`QR ${row.requestId}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {!readonly && (
                    <p className="text-[9px] text-oc-placeholder mt-1">AMS ref</p>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
