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
    <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-oc-fg-soft">Equipment Recommendation</h2>
        <span className="text-xs bg-oc-border text-oc-fg-muted px-2 py-0.5 rounded">
          {categoryLabel[category] ?? category}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm text-oc-fg-soft">{item.name}</span>
            <span className="text-xs text-oc-fg-dim">× {item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
