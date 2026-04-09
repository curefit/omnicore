import { ArrowUpCircle, Sparkles } from "lucide-react"

interface Props {
  currentSku: string
  currentName: string
  newItem: {
    sku: string
    name: string
    imageUrl: string | null
    specsJson: string | null
  }
}

export function UpgradeAdCard({ currentSku, currentName, newItem }: Props) {
  return (
    <div className="relative rounded-xl overflow-hidden mt-2">
      {/* Animated glow border */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-[gradient_3s_ease_infinite] opacity-70 bg-[length:200%_200%]" />

      <div className="relative rounded-xl bg-oc-base overflow-hidden">
        {/* Full-bleed background image */}
        {newItem.imageUrl && (
          <>
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage: `url(${newItem.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center right",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-oc-base via-oc-base/80 to-transparent pointer-events-none" />
          </>
        )}

        <div className="relative p-4 space-y-3">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Upgrade Available</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs text-oc-fg-dim">
              Your <span className="text-oc-fg-muted">{currentName.split(" CS-")[0].trim()}</span> has a newer model
            </p>
            <p className="text-sm font-semibold text-oc-fg">{newItem.name}</p>
            {newItem.specsJson && (
              <p className="text-[11px] text-oc-fg-dim mt-1 line-clamp-2">{newItem.specsJson}</p>
            )}
          </div>

          <button
            type="button"
            className="w-full py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
          >
            Learn More about {newItem.sku}
          </button>
        </div>
      </div>
    </div>
  )
}
