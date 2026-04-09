import { SectionHeader } from "@/components/shared/SectionHeader"
import { ServiceRequestReportTable } from "@/components/service-requests/ServiceRequestReportTable"
import { getServiceRequestReportRows } from "@/lib/reports/serviceRequests"
import { getDemoCenterIds } from "@/lib/config/demoCenters"

export default async function RWAAdminServiceRequestsPage() {
  const { rows, meta } = await getServiceRequestReportRows()

  const openCount = rows.filter((r) => r.status !== "RESOLVED").length

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Service Requests"
        description="Live view of asset service tickets for your facility — sourced from the CultSport asset management platform."
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
            READ ONLY
          </span>
        }
        action={
          <div className="text-xs text-oc-fg-dim text-right space-y-0.5">
            {meta.trinoEnabled && rows.length > 0 ? (
              <>
                <p>
                  <span className="text-oc-fg font-semibold">{rows.length}</span> requests ·{" "}
                  <span className="text-amber-400 font-semibold">{openCount}</span> open
                </p>
                <p className="text-[10px]">
                  Centers: <span className="font-mono text-oc-fg-muted">{getDemoCenterIds().join(", ")}</span>
                </p>
              </>
            ) : null}
          </div>
        }
      />

      <ServiceRequestReportTable rows={rows} meta={meta} readonly />
    </div>
  )
}
