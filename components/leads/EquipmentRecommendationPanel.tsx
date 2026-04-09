interface EquipmentItem {
  name: string
  quantity: number
}

interface Recommendation {
  sizeCategory: string
  items: string
}

interface Props {
  category: string
  recommendation: Recommendation
}

export function EquipmentRecommendationPanel({ category, recommendation }: Props) {
  let items: EquipmentItem[] = []
  try {
    items = JSON.parse(recommendation.items)
  } catch {
    items = []
  }

  const categoryLabel: Record<string, string> = {
    SMALL: "Small Gym",
    MEDIUM: "Medium Gym",
    LARGE: "Large Gym",
  }

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#e5e7eb]">Equipment Recommendation</h2>
        <span className="text-xs bg-[#1f2937] text-[#9ca3af] px-2 py-0.5 rounded">
          {categoryLabel[category] ?? category}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm text-[#e5e7eb]">{item.name}</span>
            <span className="text-xs text-[#6b7280]">× {item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
