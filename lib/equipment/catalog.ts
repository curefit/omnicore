// Cultsport Commercial Equipment Catalog 2025 — extracted from official catalog PDF.
// This is the authoritative master list for OmniCore equipment recommendations.
// All SKUs and specs are from the Cultsport Commercial Equipment Catalog 2025.

export type GymSetupType = "NEW_GYM" | "EXISTING_GYM"

export interface CatalogItem {
  sku: string
  name: string
  category: string
  series?: string     // FLOW | FLUX | FUEL | FORCE (selectorized strength)
  imageUrl?: string   // /equipment/{slug}-1.jpg (product), -2.jpg (in-use)
  imageUrl2?: string  // second image (gym-in-use shot)
  specs?: string      // key specs as display string
  isHighlight?: boolean // featured in model gym baseline
}

export interface ModelGymItem {
  sku: string
  name: string
  category: string
  qty: number
  imageUrl?: string
}

function generatedEquipmentImageUrl(sku: string, variant: 1 | 2): string {
  return `/equipment/generated/${sku.toLowerCase()}-${variant}.jpg`
}

function withGeneratedImages(items: CatalogItem[]): CatalogItem[] {
  return items.map((item) => ({
    ...item,
    imageUrl: generatedEquipmentImageUrl(item.sku, 1),
    imageUrl2: generatedEquipmentImageUrl(item.sku, 2),
  }))
}

// ─── CARDIO ──────────────────────────────────────────────────────────────────

const TREADMILLS: CatalogItem[] = [
  {
    sku: "CS-XG-V12",
    name: "Motorized Treadmill CS-XG-V12",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "4.5–9HP AC Motor | 0.8–22 km/h | -3 to 18% incline | 180 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-AC800",
    name: "Motorized Treadmill CS-AC800",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "3HP AC Motor | 0–20 km/h | 0–20% incline | 150 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-V6",
    name: "Motorized Treadmill CS-V6",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "4HP / 8HP peak | 0.8–22 km/h | -3 to 16% incline | 180 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-T919",
    name: "Motorized Treadmill CS-T919",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "4HP / 8HP peak | 1.0–20 km/h | -3 to 20% incline | 21.5\" display | 180 kg max",
  },
  {
    sku: "CS-XZ8001S",
    name: "Motorized Treadmill CS-XZ8001S",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "4.0–7.0HP AC Motor | 1.0–20 km/h | 0–18% incline | 180 kg max",
  },
  {
    sku: "CS-XZ8003C",
    name: "Curved Treadmill CS-XZ8003C",
    category: "TREADMILL",
    imageUrl: "/equipment/treadmill-1.jpg",
    imageUrl2: "/equipment/treadmill-2.jpg",
    specs: "Manual drive | 1600×580mm running surface | 190 kg max",
  },
]

const ELLIPTICALS: CatalogItem[] = [
  {
    sku: "CS-RE500",
    name: "Elliptical Cross Trainer CS-RE500",
    category: "ELLIPTICAL",
    imageUrl: "/equipment/elliptical-1.jpg",
    imageUrl2: "/equipment/elliptical-2.jpg",
    specs: "Self-powered hybrid brake | 20 resistance levels | 21\" stride | 160 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-E12-V5",
    name: "Elliptical CS-E12-V5",
    category: "ELLIPTICAL",
    imageUrl: "/equipment/elliptical-1.jpg",
    imageUrl2: "/equipment/elliptical-2.jpg",
    specs: "20\" stride | 0–15 incline levels | 20 resistance levels | 150 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-E17",
    name: "Elliptical CS-E17",
    category: "ELLIPTICAL",
    imageUrl: "/equipment/elliptical-1.jpg",
    imageUrl2: "/equipment/elliptical-2.jpg",
    specs: "22\" stride | 0–20 incline levels | 40 resistance levels | 170 kg max",
  },
]

const BIKES: CatalogItem[] = [
  {
    sku: "CS-R11-V4",
    name: "Recumbent Bike CS-R11-V4",
    category: "BIKE",
    imageUrl: "/equipment/bike-1.jpg",
    imageUrl2: "/equipment/bike-2.jpg",
    specs: "Self-powered | 20 resistance levels | 15 kg flywheel | 150 kg max",
  },
  {
    sku: "CS-B11V3",
    name: "Upright Bike CS-B11V3",
    category: "BIKE",
    imageUrl: "/equipment/bike-1.jpg",
    imageUrl2: "/equipment/bike-2.jpg",
    specs: "Self-powered | 20 resistance levels | 12 preset programs | 150 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-K8938",
    name: "Spin Bike CS-K8938",
    category: "BIKE",
    imageUrl: "/equipment/bike-1.jpg",
    imageUrl2: "/equipment/bike-2.jpg",
    specs: "20 kg flywheel | 13-level magnetic resistance | Belt driven | 150 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-XZ671-E",
    name: "Air Bike CS-XZ671-E",
    category: "BIKE",
    imageUrl: "/equipment/bike-1.jpg",
    imageUrl2: "/equipment/bike-2.jpg",
    specs: "Ideal for interval training | Improved LCD console | 3pc crank | 150 kg max",
  },
]

const HIGH_INTENSITY: CatalogItem[] = [
  {
    sku: "CS-XZ1116E",
    name: "Stairmill CS-XZ1116E",
    category: "HIGH_INTENSITY",
    imageUrl: "/equipment/hiit-1.jpg",
    imageUrl2: "/equipment/hiit-2.jpg",
    specs: "1–15 resistance gears | 220V | 200 kg max",
    isHighlight: true,
  },
  {
    sku: "CS-XZ-TK104",
    name: "Tank Sled CS-XZ-TK104",
    category: "HIGH_INTENSITY",
    imageUrl: "/equipment/hiit-1.jpg",
    imageUrl2: "/equipment/hiit-2.jpg",
    specs: "Double resistance | Adjustable | Holds kettlebells, plates & dumbbells | 70 kg",
  },
]

// ─── STRENGTH — SELECTORIZED ─────────────────────────────────────────────────

const STRENGTH_FLOW: CatalogItem[] = [
  {
    sku: "CS-M1-001",
    name: "Chest Press (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 308 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-M1-003",
    name: "Shoulder Press (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 298 kg net weight",
  },
  {
    sku: "CS-M1-002A",
    name: "Pec Fly / Rear Delt (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 273 kg net weight",
  },
  {
    sku: "CS-M1-012",
    name: "Lat Pull Down (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 266 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-M1-004",
    name: "Seated Row (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 251 kg net weight",
  },
  {
    sku: "CS-M1-008",
    name: "Assisted Dip / Chin (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 315 kg net weight",
  },
  {
    sku: "CS-M1-013",
    name: "Leg Curl (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 240 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-M1-014",
    name: "Seated Leg Extension (Flow Series)",
    category: "STRENGTH_FLOW",
    series: "FLOW",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 269 kg net weight",
    isHighlight: true,
  },
]

const STRENGTH_FLUX: CatalogItem[] = [
  {
    sku: "CS-TY01",
    name: "Chest Press (Flux Series)",
    category: "STRENGTH_FLUX",
    series: "FLUX",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 252 kg net weight",
  },
  {
    sku: "CS-TY16",
    name: "Seated Leg Press (Flux Series)",
    category: "STRENGTH_FLUX",
    series: "FLUX",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "135 kg weight stack | 357 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-TY13",
    name: "Leg Extension (Flux Series)",
    category: "STRENGTH_FLUX",
    series: "FLUX",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 279 kg net weight",
  },
  {
    sku: "CS-TY14",
    name: "Seated Leg Curl (Flux Series)",
    category: "STRENGTH_FLUX",
    series: "FLUX",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 298 kg net weight",
  },
]

const STRENGTH_FUEL: CatalogItem[] = [
  {
    sku: "CS-ASN001",
    name: "Chest Press (Fuel Series)",
    category: "STRENGTH_FUEL",
    series: "FUEL",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | Compact design | 225 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-ASN015",
    name: "Seated Leg Press (Fuel Series)",
    category: "STRENGTH_FUEL",
    series: "FUEL",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "100 kg weight stack | 280 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-JXS03",
    name: "Multi Gym Station (3 stations)",
    category: "STRENGTH_FUEL",
    series: "FUEL",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "7 workouts: Lat, Row, Leg Curl/Ext, Chest, Shoulder, Tricep | 100 kg × 3 stacks | 591 kg",
    isHighlight: true,
  },
]

const STRENGTH_FORCE: CatalogItem[] = [
  {
    sku: "CS-MWH001",
    name: "Chest Press (Force Series)",
    category: "STRENGTH_FORCE",
    series: "FORCE",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "ISO lateral | Plate-loaded | 166 kg net weight",
  },
  {
    sku: "CS-XH022",
    name: "45° Leg Press (Force Series)",
    category: "STRENGTH_FORCE",
    series: "FORCE",
    imageUrl: "/equipment/strength-1.jpg",
    imageUrl2: "/equipment/strength-2.jpg",
    specs: "Plate-loaded | 249 kg net weight",
    isHighlight: true,
  },
]

// ─── CABLE & FUNCTIONAL ──────────────────────────────────────────────────────

const CABLE_FUNCTIONAL: CatalogItem[] = [
  {
    sku: "CS-H005",
    name: "Cable Crossover",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/cable-1.jpg",
    imageUrl2: "/equipment/cable-2.jpg",
    specs: "100 kg × 2 weight stacks | 376 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-H005A",
    name: "Functional Trainer (Fuel)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/cable-1.jpg",
    imageUrl2: "/equipment/cable-2.jpg",
    specs: "100 kg × 2 weight stacks | 420 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-XH005A",
    name: "Functional Trainer (Flow)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/cable-1.jpg",
    imageUrl2: "/equipment/cable-2.jpg",
    specs: "100 kg × 2 weight stacks | 553 kg net weight",
  },
  {
    sku: "CS-H020",
    name: "Smith Machine (Fuel)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/rack-1.jpg",
    imageUrl2: "/equipment/rack-2.jpg",
    specs: "228 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-H021",
    name: "Squat Rack (Fuel)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/rack-1.jpg",
    imageUrl2: "/equipment/rack-2.jpg",
    specs: "155 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-MWH018",
    name: "Half Rack (Fuel)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/rack-1.jpg",
    imageUrl2: "/equipment/rack-2.jpg",
    specs: "171 kg net weight",
  },
  {
    sku: "CS-XH021",
    name: "Squat Rack (Flow)",
    category: "CABLE_FUNCTIONAL",
    imageUrl: "/equipment/rack-1.jpg",
    imageUrl2: "/equipment/rack-2.jpg",
    specs: "138 kg net weight",
  },
]

// ─── BENCHES ─────────────────────────────────────────────────────────────────

const BENCHES: CatalogItem[] = [
  {
    sku: "CS-H023",
    name: "Olympic Flat Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "82 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-H025",
    name: "Olympic Incline Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "103 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-H037",
    name: "Adjustable Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "44 kg net weight",
    isHighlight: true,
  },
  {
    sku: "CS-H034",
    name: "Adjustable AB Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "58 kg net weight",
  },
  {
    sku: "CS-H026",
    name: "Hyperextension Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "47 kg net weight",
  },
  {
    sku: "CS-H040",
    name: "Preacher Curl Bench (Fuel)",
    category: "BENCH",
    imageUrl: "/equipment/bench-1.jpg",
    imageUrl2: "/equipment/bench-2.jpg",
    specs: "43 kg net weight",
  },
]

// ─── FREE WEIGHTS ─────────────────────────────────────────────────────────────

const FREE_WEIGHTS: CatalogItem[] = [
  {
    sku: "CS-DUMBBELL-2-25",
    name: "Rubber Hex Dumbbell Set (2–25 kg)",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/dumbbell-1.jpg",
    imageUrl2: "/equipment/dumbbell-2.jpg",
    specs: "CPU rubber hex | Pairs: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25 kg",
    isHighlight: true,
  },
  {
    sku: "CS-DUMBBELL-2-40",
    name: "Rubber Hex Dumbbell Set (2–40 kg)",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/dumbbell-1.jpg",
    imageUrl2: "/equipment/dumbbell-2.jpg",
    specs: "CPU rubber hex | Full range 2–40 kg pairs",
    isHighlight: true,
  },
  {
    sku: "CS-H030",
    name: "2-Tier Dumbbell Rack",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/dumbbell-1.jpg",
    imageUrl2: "/equipment/dumbbell-2.jpg",
    specs: "76 kg net weight | Holds 2 rows of dumbbells",
    isHighlight: true,
  },
  {
    sku: "CS-DH030A",
    name: "3-Tier Dumbbell Rack",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/dumbbell-1.jpg",
    imageUrl2: "/equipment/dumbbell-2.jpg",
    specs: "114 kg net weight | Holds 3 rows of dumbbells",
    isHighlight: true,
  },
  {
    sku: "CS-KB-4-24",
    name: "Kettlebell Set (4–24 kg)",
    category: "KETTLEBELL",
    imageUrl: "/equipment/kettlebell-1.jpg",
    imageUrl2: "/equipment/kettlebell-2.jpg",
    specs: "Premium rubber | 4, 6, 8, 10, 12, 14, 16, 20, 24 kg",
    isHighlight: true,
  },
  {
    sku: "CS-BUMPER-SET",
    name: "Bumper Plate Set",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/weights-1.jpg",
    imageUrl2: "/equipment/weights-2.jpg",
    specs: "Coloured bumper plates | 5, 10, 15, 20, 25 kg pairs",
    isHighlight: true,
  },
  {
    sku: "CS-BARBELL-20",
    name: "Olympic Barbell 20 kg",
    category: "FREE_WEIGHTS",
    imageUrl: "/equipment/weights-1.jpg",
    imageUrl2: "/equipment/weights-2.jpg",
    specs: "20 kg straight barbell | Commercial grade",
    isHighlight: true,
  },
]

// ─── ACCESSORIES ─────────────────────────────────────────────────────────────

const ACCESSORIES: CatalogItem[] = [
  {
    sku: "CS-ACC-BANDS",
    name: "Resistance Band Set",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "5 resistance levels | Light to heavy",
    isHighlight: true,
  },
  {
    sku: "CS-ACC-MEDBALLS",
    name: "Medicine Ball Set (3–10 kg)",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "3, 5, 7, 10 kg | Rubber coated",
    isHighlight: true,
  },
  {
    sku: "CS-ACC-BATTLEROPE",
    name: "Battle Rope (15m)",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "15 m × 38 mm | Heavy duty nylon",
  },
  {
    sku: "CS-ACC-TRX",
    name: "TRX Suspension Trainer",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "Commercial grade | Ceiling/wall mount",
  },
  {
    sku: "CS-ACC-YOGAMAT",
    name: "Yoga Mat (Premium)",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "6 mm TPE | Anti-slip | 183 × 61 cm",
  },
  {
    sku: "CS-ACC-FOAMROLLER",
    name: "Foam Roller Set",
    category: "ACCESSORIES",
    imageUrl: "/equipment/accessories-1.jpg",
    imageUrl2: "/equipment/accessories-2.jpg",
    specs: "Short + long foam rollers | EVA foam",
  },
]

// ─── Master catalog ───────────────────────────────────────────────────────────

export const EQUIPMENT_CATALOG: CatalogItem[] = [
  ...withGeneratedImages(TREADMILLS),
  ...withGeneratedImages(ELLIPTICALS),
  ...withGeneratedImages(BIKES),
  ...withGeneratedImages(HIGH_INTENSITY),
  ...withGeneratedImages(STRENGTH_FLOW),
  ...withGeneratedImages(STRENGTH_FLUX),
  ...withGeneratedImages(STRENGTH_FUEL),
  ...withGeneratedImages(STRENGTH_FORCE),
  ...withGeneratedImages(CABLE_FUNCTIONAL),
  ...withGeneratedImages(BENCHES),
  ...withGeneratedImages(FREE_WEIGHTS),
  ...withGeneratedImages(ACCESSORIES),
]

// ─── Category display names ───────────────────────────────────────────────────

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  TREADMILL: "Treadmills",
  ELLIPTICAL: "Ellipticals",
  BIKE: "Bikes",
  HIGH_INTENSITY: "High Intensity Training",
  STRENGTH_FLOW: "Strength Machines (Flow Series)",
  STRENGTH_FLUX: "Strength Machines (Flux Series)",
  STRENGTH_FUEL: "Strength Machines (Fuel Series)",
  STRENGTH_FORCE: "Strength Machines (Force Series)",
  CABLE_FUNCTIONAL: "Cable & Functional Training",
  BENCH: "Benches",
  FREE_WEIGHTS: "Free Weights",
  KETTLEBELL: "Kettlebells",
  ACCESSORIES: "Accessories",
}

// ─── Model gym setups ─────────────────────────────────────────────────────────
// These define the pre-selected baseline for NEW_GYM recommendations.
// SKUs must reference items in EQUIPMENT_CATALOG.

export interface ModelGymSetupItem {
  sku: string
  qty: number
}

export const MODEL_GYM_SETUPS: Record<"SMALL" | "MEDIUM" | "LARGE", ModelGymSetupItem[]> = {
  // SMALL: < 1000 sqft OR < 200 units
  SMALL: [
    { sku: "CS-AC800", qty: 2 },
    { sku: "CS-B11V3", qty: 1 },
    { sku: "CS-JXS03", qty: 1 },
    { sku: "CS-DUMBBELL-2-25", qty: 1 },
    { sku: "CS-H030", qty: 1 },
    { sku: "CS-H037", qty: 1 },
    { sku: "CS-ACC-BANDS", qty: 1 },
    { sku: "CS-ACC-MEDBALLS", qty: 1 },
  ],

  // MEDIUM: 1000–2500 sqft OR 200–500 units
  MEDIUM: [
    { sku: "CS-AC800", qty: 2 },
    { sku: "CS-V6", qty: 2 },
    { sku: "CS-B11V3", qty: 2 },
    { sku: "CS-RE500", qty: 1 },
    // Flow Series strength
    { sku: "CS-M1-001", qty: 1 },
    { sku: "CS-M1-003", qty: 1 },
    { sku: "CS-M1-012", qty: 1 },
    { sku: "CS-M1-004", qty: 1 },
    { sku: "CS-M1-013", qty: 1 },
    { sku: "CS-M1-014", qty: 1 },
    // Fuel Series (compact, space-efficient)
    { sku: "CS-ASN001", qty: 1 },
    { sku: "CS-H021", qty: 1 },
    { sku: "CS-H023", qty: 1 },
    { sku: "CS-H005A", qty: 1 },
    { sku: "CS-DUMBBELL-2-40", qty: 1 },
    { sku: "CS-DH030A", qty: 1 },
    { sku: "CS-KB-4-24", qty: 1 },
    { sku: "CS-ACC-BANDS", qty: 1 },
    { sku: "CS-ACC-MEDBALLS", qty: 1 },
  ],

  // LARGE: > 2500 sqft OR > 500 units — superset of MEDIUM categories
  LARGE: [
    { sku: "CS-XG-V12", qty: 3 },
    { sku: "CS-V6", qty: 3 },
    { sku: "CS-B11V3", qty: 2 },
    { sku: "CS-K8938", qty: 1 },
    { sku: "CS-E17", qty: 2 },
    { sku: "CS-XZ1116E", qty: 1 },
    // Flow Series (covers STRENGTH_FLOW — superset requirement)
    { sku: "CS-M1-001", qty: 1 },
    { sku: "CS-M1-012", qty: 1 },
    { sku: "CS-M1-013", qty: 1 },
    { sku: "CS-M1-014", qty: 1 },
    // Flux Series (premium for large gyms)
    { sku: "CS-TY01", qty: 1 },
    { sku: "CS-TY16", qty: 1 },
    { sku: "CS-TY13", qty: 1 },
    { sku: "CS-TY14", qty: 1 },
    // Fuel Series (covers STRENGTH_FUEL)
    { sku: "CS-ASN001", qty: 1 },
    { sku: "CS-ASN015", qty: 1 },
    // Force Series (covers STRENGTH_FORCE)
    { sku: "CS-XH022", qty: 1 },
    // Cable & Functional (covers CABLE_FUNCTIONAL)
    { sku: "CS-H005", qty: 1 },
    { sku: "CS-H020", qty: 1 },
    { sku: "CS-H021", qty: 1 },
    { sku: "CS-MWH018", qty: 1 },
    // Benches (covers BENCH)
    { sku: "CS-H023", qty: 2 },
    { sku: "CS-H025", qty: 1 },
    { sku: "CS-H037", qty: 2 },
    { sku: "CS-H034", qty: 1 },
    // Free Weights (covers FREE_WEIGHTS)
    { sku: "CS-DUMBBELL-2-40", qty: 1 },
    { sku: "CS-DH030A", qty: 2 },
    { sku: "CS-BUMPER-SET", qty: 2 },
    { sku: "CS-BARBELL-20", qty: 4 },
    // Kettlebells (covers KETTLEBELL)
    { sku: "CS-KB-4-24", qty: 1 },
    // Accessories (covers ACCESSORIES)
    { sku: "CS-ACC-BATTLEROPE", qty: 2 },
    { sku: "CS-ACC-TRX", qty: 2 },
    { sku: "CS-ACC-MEDBALLS", qty: 1 },
    { sku: "CS-ACC-BANDS", qty: 2 },
  ],
}

// ─── Tier computation ─────────────────────────────────────────────────────────
// PLAN.md §6 business logic — locked

export type GymTier = "SMALL" | "MEDIUM" | "LARGE"

export function computeGymTier(gymSqFt?: number | null, totalUnits?: number | null): GymTier {
  if ((gymSqFt && gymSqFt > 2500) || (totalUnits && totalUnits > 500)) return "LARGE"
  if ((gymSqFt && gymSqFt >= 1000) || (totalUnits && totalUnits >= 200)) return "MEDIUM"
  return "SMALL"
}

export const TIER_LABEL: Record<GymTier, string> = {
  SMALL: "Small Gym",
  MEDIUM: "Medium Gym",
  LARGE: "Large Gym",
}

export function tierReason(gymSqFt?: number | null, totalUnits?: number | null): string {
  const parts: string[] = []
  if (gymSqFt) parts.push(`${gymSqFt.toLocaleString("en-IN")} sq ft`)
  if (totalUnits) parts.push(`${totalUnits.toLocaleString("en-IN")} residential units`)
  return parts.length ? `Based on ${parts.join(" · ")}` : "Based on center size"
}

// ─── Utility functions ────────────────────────────────────────────────────────

export function getCatalogByCategory(category: string): CatalogItem[] {
  return EQUIPMENT_CATALOG.filter((item) => item.category === category)
}

export function getCatalogBySku(sku: string): CatalogItem | undefined {
  return EQUIPMENT_CATALOG.find((item) => item.sku === sku)
}

export function getModelGymItems(tier: "SMALL" | "MEDIUM" | "LARGE"): ModelGymItem[] {
  const result: ModelGymItem[] = []
  for (const { sku, qty } of MODEL_GYM_SETUPS[tier]) {
    const item = getCatalogBySku(sku)
    if (item) result.push({ sku: item.sku, name: item.name, category: item.category, qty, imageUrl: item.imageUrl })
  }
  return result
}

// Best-selling upgrade items per category (for EXISTING_GYM services-needed step)
export const UPGRADE_HIGHLIGHTS: Record<string, string[]> = {
  Cardio: ["CS-XG-V12", "CS-V6", "CS-RE500", "CS-K8938"],
  Strength: ["CS-M1-001", "CS-M1-012", "CS-ASN001", "CS-JXS03"],
  "Cable & Functional": ["CS-H005A", "CS-H020", "CS-H021"],
  "Free Weights": ["CS-DUMBBELL-2-40", "CS-DH030A", "CS-KB-4-24"],
  Accessories: ["CS-ACC-BATTLEROPE", "CS-ACC-TRX", "CS-ACC-MEDBALLS", "CS-ACC-BANDS"],
}
