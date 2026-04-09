import { SectionHeader } from "@/components/shared/SectionHeader"
import { ServiceRequestReportTable } from "@/components/service-requests/ServiceRequestReportTable"
import { getServiceRequestReportRows } from "@/lib/reports/serviceRequests"
import { getDemoCenterIds } from "@/lib/config/demoCenters"
import { isTrinoEnabled } from "@/lib/trino/client"

export default async function CFAdminServiceRequestsPage() {
  const { rows, meta } = await getServiceRequestReportRows()

  const openCount     = rows.filter((r) => r.status !== "RESOLVED").length
  const criticalCount = rows.filter((r) => r.priority === "CRITICAL" && r.status !== "RESOLVED").length

  const centerIds = getDemoCenterIds()
  const trinoUp   = isTrinoEnabled()

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Service Requests"
        description="Live asset management service requests from Trino AMS."
        action={
          <div className="flex items-center gap-2">
            {/* Trino connection status */}
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              trinoUp
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${trinoUp ? "bg-emerald-400" : "bg-red-400"}`} />
              {trinoUp ? "Trino connected" : "Trino offline"}
            </span>

            {/* AMS schema */}
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-oc-border bg-oc-card text-oc-fg-dim">
              delta.pk_prod_cultsport_asset_management_service
            </span>
          </div>
        }
      />

      {/* Stats row — only when data is present */}
      {rows.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: rows.length, color: "text-oc-fg" },
            { label: "Open", value: openCount, color: openCount > 0 ? "text-amber-400" : "text-oc-fg" },
            { label: "Critical", value: criticalCount, color: criticalCount > 0 ? "text-red-400" : "text-oc-fg" },
            { label: "Centers", value: centerIds.length > 0 ? centerIds.length : "all", color: "text-cyan-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-oc-border bg-oc-card px-4 py-3 text-center">
              <p className={`text-xl font-bold font-mono-metric ${color}`}>{value}</p>
              <p className="text-[11px] text-oc-fg-dim mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Center filter badge */}
      {centerIds.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-oc-fg-dim">Filtered to center IDs:</span>
          {centerIds.map((id) => (
            <span key={id} className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
              {id}
            </span>
          ))}
        </div>
      )}

      <ServiceRequestReportTable rows={rows} meta={meta} readonly={false} />
    </div>
  )
}
