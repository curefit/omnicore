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

      <div className="relative rounded-xl bg-[#0a0d14] p-4 space-y-3">
        {/* Badge */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Upgrade Available</span>
        </div>

        <div className="flex items-start gap-3">
          {newItem.imageUrl && (
            <div className="relative shrink-0">
              <img
                src={newItem.imageUrl}
                alt={newItem.name}
                className="w-20 h-14 rounded-lg object-cover border border-cyan-500/30"
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                <ArrowUpCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6b7280] truncate">
              Your <span className="text-[#9ca3af]">{currentName.split(" CS-")[0].trim()}</span> has a newer model
            </p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{newItem.name}</p>
            {newItem.specsJson && (
              <p className="text-[11px] text-[#6b7280] mt-1 line-clamp-2">{newItem.specsJson}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="w-full py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
        >
          Learn More about {newItem.sku}
        </button>
      </div>
    </div>
  )
}
