import { PrismaClient } from "@prisma/client"
import { EQUIPMENT_CATALOG, MODEL_GYM_SETUPS, getModelGymItems } from "../lib/equipment/catalog"
import { appendHistory } from "../lib/leads/quoteHistory"

const prisma = new PrismaClient()

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000)

async function main() {
  console.log("🌱 Seeding OmniCore database...")

  // ─── Clear existing data ───────────────────────────────────────────────────
  await prisma.quoteLineItem.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.servicePricingConfig.deleteMany()
  await prisma.equipmentRecommendation.deleteMany()
  await prisma.equipmentCatalogItem.deleteMany()
  await prisma.serviceRequest.deleteMany()
  await prisma.amenityBooking.deleteMany()
  await prisma.pTSession.deleteMany()
  await prisma.trainerAttendance.deleteMany()
  await prisma.centerTrainerMapping.deleteMany()
  await prisma.equipmentAsset.deleteMany()
  await prisma.serviceConfig.deleteMany()
  await prisma.centerModule.deleteMany()
  await prisma.myGateConfig.deleteMany()
  await prisma.residentialDetails.deleteMany()
  await prisma.trainer.deleteMany()
  await prisma.center.deleteMany()

  // ─── Centers ──────────────────────────────────────────────────────────────

  const centerPrestige = await prisma.center.create({
    data: {
      name: "Prestige Lakeside Habitat",
      code: "PLH-001",
      status: "ACTIVE",
      address: "Prestige Lakeside Habitat, Whitefield",
      city: "Bengaluru",
      pincode: "560066",
      capacity: 40,
      operatingSince: daysAgo(180),
    },
  })

  const centerBrigade = await prisma.center.create({
    data: {
      name: "Brigade Orchards",
      code: "BO-002",
      status: "ACTIVE",
      address: "Brigade Orchards, Devanahalli",
      city: "Bengaluru",
      pincode: "562110",
      capacity: 30,
      operatingSince: daysAgo(90),
    },
  })

  // Third center has no MyGate config (to demo missing config state)
  const centerSobha = await prisma.center.create({
    data: {
      name: "Sobha Dream Acres",
      code: "SDA-003",
      status: "ONBOARDING",
      address: "Sobha Dream Acres, Panathur",
      city: "Bengaluru",
      pincode: "560087",
      capacity: 25,
      operatingSince: null,
    },
  })

  console.log("✓ Centers created")

  // ─── Residential Details ───────────────────────────────────────────────────

  await prisma.residentialDetails.createMany({
    data: [
      {
        centerId: centerPrestige.id,
        rwaName: "Prestige Lakeside RWA",
        totalUnits: 1200,
        contactPersonName: "Rajesh Sharma",
        contactPersonPhone: "+91 98450 12345",
        contactPersonEmail: "rajesh.sharma@prestigelakeside.com",
      },
      {
        centerId: centerBrigade.id,
        rwaName: "Brigade Orchards Residents Association",
        totalUnits: 800,
        contactPersonName: "Meena Iyer",
        contactPersonPhone: "+91 99001 67890",
        contactPersonEmail: "meena.iyer@brigadeorchards.com",
      },
      {
        centerId: centerSobha.id,
        rwaName: "Sobha Dream Acres RWA",
        totalUnits: 650,
        contactPersonName: "Pradeep Nair",
        contactPersonPhone: "+91 97440 55555",
        contactPersonEmail: "pradeep@sobhadreamacres.com",
      },
    ],
  })

  console.log("✓ Residential details created")

  // ─── MyGate Configs ────────────────────────────────────────────────────────
  // Sobha has no MyGate config intentionally

  await prisma.myGateConfig.createMany({
    data: [
      {
        centerId: centerPrestige.id,
        societyId: "MGS-PLH-7721",
        apiKey: "mg_live_pk_plh_xxxxxxxxxxxx",
        webhookUrl: "https://omnicore.internal/api/webhooks/mygate/plh",
        isActive: true,
        lastSyncedAt: hoursAgo(1),
      },
      {
        centerId: centerBrigade.id,
        societyId: "MGS-BO-4432",
        apiKey: "mg_live_pk_bo_xxxxxxxxxxxx",
        webhookUrl: "https://omnicore.internal/api/webhooks/mygate/bo",
        isActive: true,
        lastSyncedAt: hoursAgo(3),
      },
    ],
  })

  console.log("✓ MyGate configs created")

  // ─── Service Configs ───────────────────────────────────────────────────────

  // Service configs represent the membership/PT pricing that members pay.
  // For revenue estimation: monthly recurring ≈ active members × membership fee + PT volume.
  // Prestige (1,200 units, ~35 active members): 35 × ₹2,200 + 8 PT × ₹7,500 + 12 classes × ₹1,500 = ~₹1.4L/mo gross
  // Brigade (800 units, ~28 active members): 28 × ₹1,800 + 6 PT × ₹5,000 + classes = ~₹88K/mo gross
  // CultSport take from these: ~35-40% = Prestige ~₹49K/mo, Brigade ~₹31K/mo
  await prisma.serviceConfig.createMany({
    data: [
      // Prestige Lakeside — premium RWA, higher willingness to pay
      { centerId: centerPrestige.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 2200, setupFee: 999 },
      { centerId: centerPrestige.id, serviceName: "Personal Training (8 sessions)", serviceType: "PT", monthlyFee: 7500, setupFee: 0 },
      { centerId: centerPrestige.id, serviceName: "Yoga & Zumba (16 sessions)", serviceType: "GROUP_CLASS", monthlyFee: 1500, setupFee: 0 },
      { centerId: centerPrestige.id, serviceName: "Locker + Towel Service", serviceType: "ADD_ON", monthlyFee: 450, setupFee: 200 },
      // Brigade Orchards — mid-segment, price-sensitive
      { centerId: centerBrigade.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 1800, setupFee: 499 },
      { centerId: centerBrigade.id, serviceName: "Personal Training (6 sessions)", serviceType: "PT", monthlyFee: 5000, setupFee: 0 },
      { centerId: centerBrigade.id, serviceName: "Zumba Classes (12 sessions)", serviceType: "GROUP_CLASS", monthlyFee: 900, setupFee: 0 },
      // Sobha Dream Acres — compact, value tier
      { centerId: centerSobha.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 1400, setupFee: 299 },
      { centerId: centerSobha.id, serviceName: "Personal Training (4 sessions)", serviceType: "PT", monthlyFee: 4000, setupFee: 0 },
    ],
  })

  console.log("✓ Service configs created")

  // ─── Center Modules ────────────────────────────────────────────────────────
  // Prestige — fully set up with all modules
  await prisma.centerModule.createMany({
    data: [
      { centerId: centerPrestige.id, moduleKey: "TRAINERS", isEnabled: true },
      { centerId: centerPrestige.id, moduleKey: "ASSETS", isEnabled: true },
      { centerId: centerPrestige.id, moduleKey: "MYGATE", isEnabled: true },
      { centerId: centerPrestige.id, moduleKey: "BRANDING", isEnabled: true },
      { centerId: centerPrestige.id, moduleKey: "VENDING_MACHINES", isEnabled: false },
    ],
  })

  // Brigade — trainers + assets + mygate
  await prisma.centerModule.createMany({
    data: [
      { centerId: centerBrigade.id, moduleKey: "TRAINERS", isEnabled: true },
      { centerId: centerBrigade.id, moduleKey: "ASSETS", isEnabled: true },
      { centerId: centerBrigade.id, moduleKey: "MYGATE", isEnabled: true },
      { centerId: centerBrigade.id, moduleKey: "VENDING_MACHINES", isEnabled: false },
      { centerId: centerBrigade.id, moduleKey: "BRANDING", isEnabled: false },
    ],
  })

  // Sobha — still onboarding, only trainers selected so far
  await prisma.centerModule.createMany({
    data: [
      { centerId: centerSobha.id, moduleKey: "TRAINERS", isEnabled: true },
      { centerId: centerSobha.id, moduleKey: "ASSETS", isEnabled: false },
      { centerId: centerSobha.id, moduleKey: "MYGATE", isEnabled: false },
    ],
  })

  console.log("✓ Center modules created")

  // ─── Equipment Assets ──────────────────────────────────────────────────────

  const assetsPrestige = await prisma.equipmentAsset.createMany({
    data: [
      // GREEN — >30 days to service
      {
        centerId: centerPrestige.id,
        name: "Treadmill #1",
        category: "Cardio",
        brand: "LifeFitness",
        model: "T5",
        serialNumber: "LF-T5-2023-001",
        purchasedOn: daysAgo(400),
        warrantyExpiry: daysFromNow(200),
        lastServicedOn: daysAgo(60),
        nextServiceDue: daysFromNow(30),
        condition: "GOOD",
      },
      {
        centerId: centerPrestige.id,
        name: "Treadmill #2",
        category: "Cardio",
        brand: "LifeFitness",
        model: "T5",
        serialNumber: "LF-T5-2023-002",
        purchasedOn: daysAgo(400),
        warrantyExpiry: daysFromNow(200),
        lastServicedOn: daysAgo(45),
        nextServiceDue: daysFromNow(45),
        condition: "GOOD",
      },
      {
        centerId: centerPrestige.id,
        name: "Bench Press Station",
        category: "Strength",
        brand: "Impulse",
        model: "IT7001",
        purchasedOn: daysAgo(500),
        lastServicedOn: daysAgo(30),
        nextServiceDue: daysFromNow(60),
        condition: "GOOD",
      },
      // AMBER — 7-30 days to service
      {
        centerId: centerPrestige.id,
        name: "Elliptical Cross Trainer",
        category: "Cardio",
        brand: "Precor",
        model: "EFX 885",
        serialNumber: "PR-EFX-2022-007",
        purchasedOn: daysAgo(600),
        lastServicedOn: daysAgo(80),
        nextServiceDue: daysFromNow(12),
        condition: "FAIR",
        notes: "Minor squeaking noted in flywheel. Service scheduled.",
      },
      // RED — overdue / <7 days
      {
        centerId: centerPrestige.id,
        name: "Rowing Machine",
        category: "Cardio",
        brand: "Concept2",
        model: "Model D",
        serialNumber: "C2-MD-2021-003",
        purchasedOn: daysAgo(900),
        lastServicedOn: daysAgo(120),
        nextServiceDue: daysAgo(3),
        condition: "POOR",
        notes: "SERVICE OVERDUE. Chain showing wear. Do not use until serviced.",
      },
    ],
  })

  await prisma.equipmentAsset.createMany({
    data: [
      // Brigade — Multi-Gym, linked to catalog SKU
      {
        centerId: centerBrigade.id,
        name: "Multi-Gym Station CS-JXS03",
        category: "Strength",
        brand: "Cultsport",
        model: "JXS03",
        catalogItemSku: "CS-JXS03",
        installationDate: daysAgo(300),
        purchasedOn: daysAgo(310),
        lastServicedOn: daysAgo(20),
        nextServiceDue: daysFromNow(70),
        condition: "GOOD",
      },
      // CS-AC800 treadmill — intentionally OLD version (superseded by CS-V6) for upgrade ad demo
      {
        centerId: centerBrigade.id,
        name: "Motorized Treadmill CS-AC800",
        category: "TREADMILL",
        brand: "Cultsport",
        model: "AC800",
        catalogItemSku: "CS-AC800",  // ← isLatestVersion=false in catalog → triggers upgrade ad
        installationDate: daysAgo(350),
        purchasedOn: daysAgo(360),
        lastServicedOn: daysAgo(50),
        nextServiceDue: daysFromNow(20),
        condition: "FAIR",
        notes: "Belt tension checked. Within acceptable range. Newer CS-V6 model available.",
      },
      // Second treadmill — same old version for demo
      {
        centerId: centerBrigade.id,
        name: "Motorized Treadmill CS-AC800 #2",
        category: "TREADMILL",
        brand: "Cultsport",
        model: "AC800",
        catalogItemSku: "CS-AC800",
        installationDate: daysAgo(350),
        purchasedOn: daysAgo(360),
        lastServicedOn: daysAgo(90),
        nextServiceDue: daysAgo(2), // OVERDUE — red timer demo
        condition: "POOR",
        notes: "Service overdue — scheduled with technician.",
      },
      {
        centerId: centerSobha.id,
        name: "Treadmill #1",
        category: "Cardio",
        brand: "Cosco",
        model: "CTM-310",
        purchasedOn: daysAgo(100),
        lastServicedOn: daysAgo(10),
        nextServiceDue: daysFromNow(80),
        condition: "GOOD",
      },
    ],
  })

  console.log("✓ Equipment assets created")

  // ─── Trainers ──────────────────────────────────────────────────────────────

  const [arjun, priya, vikram, sunita, rohan] = await Promise.all([
    prisma.trainer.create({
      data: {
        name: "Arjun Mehta",
        phone: "+91 98441 10001",
        email: "arjun.mehta@omnicore.fit",
        trainerType: "FULLTIME",
        specialization: "Strength & Conditioning",
        certifications: "ACE CPT, NSCA-CSCS",
        joinedOn: daysAgo(200),
        isActive: true,
      },
    }),
    prisma.trainer.create({
      data: {
        name: "Priya Rajan",
        phone: "+91 98441 10002",
        email: "priya.rajan@omnicore.fit",
        trainerType: "PT",
        specialization: "Yoga & Mobility",
        certifications: "RYT-200, ACE CPT",
        joinedOn: daysAgo(150),
        isActive: true,
      },
    }),
    prisma.trainer.create({
      data: {
        name: "Vikram Singh",
        phone: "+91 98441 10003",
        email: "vikram.singh@omnicore.fit",
        trainerType: "FULLTIME",
        specialization: "Functional Fitness",
        certifications: "NASM CPT",
        joinedOn: daysAgo(300),
        isActive: true,
      },
    }),
    prisma.trainer.create({
      data: {
        name: "Sunita Rao",
        phone: "+91 98441 10004",
        email: "sunita.rao@omnicore.fit",
        trainerType: "PT",
        specialization: "Zumba & Dance Fitness",
        certifications: "Zumba Licensed Instructor",
        joinedOn: daysAgo(120),
        isActive: true,
      },
    }),
    prisma.trainer.create({
      data: {
        name: "Rohan Desai",
        phone: "+91 98441 10005",
        email: "rohan.desai@omnicore.fit",
        trainerType: "FULLTIME",
        specialization: "Weight Loss & Nutrition",
        certifications: "ISSA CPT, Precision Nutrition L1",
        joinedOn: daysAgo(60),
        isActive: true,
      },
    }),
  ])

  console.log("✓ Trainers created")

  // ─── Center Trainer Mappings ───────────────────────────────────────────────

  await prisma.centerTrainerMapping.createMany({
    data: [
      { centerId: centerPrestige.id, trainerId: arjun.id, isActive: true },
      { centerId: centerPrestige.id, trainerId: priya.id, isActive: true },
      { centerId: centerPrestige.id, trainerId: sunita.id, isActive: true },
      { centerId: centerBrigade.id, trainerId: vikram.id, isActive: true },
      { centerId: centerBrigade.id, trainerId: rohan.id, isActive: true },
      { centerId: centerSobha.id, trainerId: arjun.id, isActive: true },
    ],
  })

  console.log("✓ Center-trainer mappings created")

  // ─── Trainer Attendance (last 7 days) ────────────────────────────────────

  const attendanceRecords = []

  for (let i = 6; i >= 0; i--) {
    const date = daysAgo(i)
    date.setHours(0, 0, 0, 0)

    // Arjun — present every day via MyGate
    attendanceRecords.push({
      centerId: centerPrestige.id,
      trainerId: arjun.id,
      date,
      checkIn: new Date(date.getTime() + 6 * 60 * 60 * 1000),
      checkOut: new Date(date.getTime() + 14 * 60 * 60 * 1000),
      source: "MYGATE" as const,
      status: "PRESENT" as const,
    })

    // Priya — absent yesterday (demo absent trainer)
    if (i === 1) {
      attendanceRecords.push({
        centerId: centerPrestige.id,
        trainerId: priya.id,
        date,
        checkIn: null,
        checkOut: null,
        source: "MANUAL" as const,
        status: "ABSENT" as const,
        notes: "Called in sick",
      })
    } else {
      attendanceRecords.push({
        centerId: centerPrestige.id,
        trainerId: priya.id,
        date,
        checkIn: new Date(date.getTime() + 7 * 60 * 60 * 1000),
        checkOut: new Date(date.getTime() + 13 * 60 * 60 * 1000),
        source: "OTP" as const,
        status: "PRESENT" as const,
      })
    }

    // Vikram — present via MyGate at Brigade
    attendanceRecords.push({
      centerId: centerBrigade.id,
      trainerId: vikram.id,
      date,
      checkIn: new Date(date.getTime() + 6.5 * 60 * 60 * 1000),
      checkOut: new Date(date.getTime() + 14.5 * 60 * 60 * 1000),
      source: "MYGATE" as const,
      status: "PRESENT" as const,
    })
  }

  await prisma.trainerAttendance.createMany({ data: attendanceRecords })

  console.log("✓ Trainer attendance records created")

  // ─── PT Sessions (last 30 days) ───────────────────────────────────────────

  const ptSessions = []
  const members = ["Anita Verma", "Sanjay Gupta", "Deepa Nair", "Kiran Reddy", "Mahesh Patel"]

  for (let i = 29; i >= 0; i--) {
    const sessionDate = daysAgo(i)
    sessionDate.setHours(8, 0, 0, 0)

    if (i % 3 !== 0) {
      ptSessions.push({
        centerId: centerPrestige.id,
        trainerId: priya.id,
        sessionDate,
        durationMins: 60,
        ratePerHour: 800,
        memberName: members[i % members.length],
        isPaid: i > 7,
      })
    }

    if (i % 4 !== 0) {
      ptSessions.push({
        centerId: centerBrigade.id,
        trainerId: vikram.id,
        sessionDate: new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000),
        durationMins: 45,
        ratePerHour: 700,
        memberName: members[(i + 2) % members.length],
        isPaid: i > 7,
      })
    }
  }

  await prisma.pTSession.createMany({ data: ptSessions })

  console.log("✓ PT sessions created")

  // ─── Amenity Bookings — slot-based footfall (booking = footfall) ──────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysAgoBooking = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d
  }

  const prestigeResidents = [
    { name: "Priya Sharma", flat: "A-204" },
    { name: "Rohan Mehta", flat: "B-101" },
    { name: "Anita Desai", flat: "C-302" },
    { name: "Vikram Nair", flat: "A-105" },
    { name: "Sunita Reddy", flat: "D-201" },
    { name: "Arjun Kapoor", flat: "B-304" },
    { name: "Meena Iyer", flat: "C-103" },
    { name: "Karan Singh", flat: "A-402" },
    { name: "Divya Patel", flat: "D-105" },
    { name: "Rahul Joshi", flat: "B-202" },
    { name: "Neha Gupta", flat: "C-401" },
    { name: "Amit Kumar", flat: "A-301" },
  ]

  const brigadeResidents = [
    { name: "Deepa Rao", flat: "T1-502" },
    { name: "Suresh Pillai", flat: "T2-301" },
    { name: "Kavitha Nambiar", flat: "T1-204" },
    { name: "Rajesh Shetty", flat: "T3-101" },
    { name: "Lakshmi Varma", flat: "T2-402" },
    { name: "Mohan Das", flat: "T1-303" },
    { name: "Usha Krishnan", flat: "T3-205" },
    { name: "Sanjay Bhat", flat: "T2-105" },
  ]

  // Peak slot pattern: hour → typical booking count per day
  const peakPattern: Record<number, number> = {
    5: 2, 6: 8, 7: 11, 8: 9, 9: 6, 10: 4,
    11: 3, 16: 3, 17: 5, 18: 10, 19: 12, 20: 8, 21: 4,
  }

  const amenityBookings: {
    centerId: string
    memberName: string
    memberFlat: string
    slotDate: Date
    slotHour: number
    status: string
    bookedAt: Date
    createdAt: Date
  }[] = []

  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  for (const dayOffset of [6, 5, 4, 3, 2, 1, 0]) {
    const slotDate = daysAgoBooking(dayOffset)

    for (const [hourStr, baseCount] of Object.entries(peakPattern)) {
      const slotHour = parseInt(hourStr)
      const variation = Math.floor(Math.random() * 5) - 2
      const totalCount = Math.max(0, baseCount + variation)

      const prestigeCount = Math.ceil(totalCount * 0.6)
      for (let i = 0; i < prestigeCount; i++) {
        const member = pickRandom(prestigeResidents)
        amenityBookings.push({
          centerId: centerPrestige.id,
          memberName: member.name,
          memberFlat: member.flat,
          slotDate,
          slotHour,
          status: "BOOKED",
          bookedAt: new Date(slotDate.getTime() + slotHour * 3600000 - 86400000),
          createdAt: new Date(slotDate.getTime() + slotHour * 3600000 - 86400000),
        })
      }

      const brigadeCount = Math.ceil(totalCount * 0.4)
      for (let i = 0; i < brigadeCount; i++) {
        const member = pickRandom(brigadeResidents)
        amenityBookings.push({
          centerId: centerBrigade.id,
          memberName: member.name,
          memberFlat: member.flat,
          slotDate,
          slotHour,
          status: "BOOKED",
          bookedAt: new Date(slotDate.getTime() + slotHour * 3600000 - 86400000),
          createdAt: new Date(slotDate.getTime() + slotHour * 3600000 - 86400000),
        })
      }
    }
  }

  await prisma.amenityBooking.createMany({ data: amenityBookings })
  console.log(`✓ ${amenityBookings.length} amenity bookings seeded (7 days, peak-hour distribution)`)

  // ─── Service Requests ──────────────────────────────────────────────────────

  // Get the red asset (Rowing Machine at Prestige)
  const rowingMachine = await prisma.equipmentAsset.findFirst({
    where: { centerId: centerPrestige.id, name: "Rowing Machine" },
  })

  const elliptical = await prisma.equipmentAsset.findFirst({
    where: { centerId: centerPrestige.id, name: "Elliptical Cross Trainer" },
  })

  await prisma.serviceRequest.createMany({
    data: [
      {
        centerId: centerPrestige.id,
        assetId: rowingMachine?.id,
        title: "Rowing Machine — Urgent Service Required",
        description:
          "Chain is showing significant wear. Member complaints about noise. Machine has been flagged as unsafe and marked out of service.",
        status: "OPEN",
        priority: "CRITICAL",
        reportedBy: "Rajesh Sharma (RWA Admin)",
      },
      {
        centerId: centerPrestige.id,
        assetId: elliptical?.id,
        title: "Elliptical Cross Trainer — Scheduled Maintenance",
        description:
          "Flywheel squeaking during use. Lubrication and bearing check required before the quarterly service is due.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        reportedBy: "Arjun Mehta (Trainer)",
        assignedTo: "TechServ Bangalore — Ref #TSB-9872",
      },
      {
        centerId: centerBrigade.id,
        title: "AC Unit Not Cooling Adequately",
        description:
          "The 2-ton split AC in the main gym area is not maintaining temperature below 24°C even at full capacity. Members complaining.",
        status: "ASSIGNED",
        priority: "HIGH",
        reportedBy: "Meena Iyer (RWA Admin)",
        assignedTo: "Carrier Service Center",
      },
      {
        centerId: centerPrestige.id,
        title: "Water Purifier Filter Replacement",
        description: "Quarterly filter replacement due. RO membrane and pre-filter cartridges to be replaced.",
        status: "RESOLVED",
        priority: "LOW",
        reportedBy: "Arjun Mehta",
        assignedTo: "Kent RO Service",
        resolvedAt: daysAgo(5),
      },
    ],
  })

  console.log("✓ Service requests created")

  // ─── ServicePricingConfig — default rate card ────────────────────────────────
  // Default rate card — CF Admin adjusts per-lead based on gym size, negotiation, contract term.
  // Trainers: ₹25,000-45,000/mo depending on headcount. Default = 1 full-time.
  // Assets: Equipment cost varies ₹4L (small) to ₹25L+ (large). Default = MEDIUM baseline.
  // Vending: ₹75,000 install + 9% revenue share.
  // MyGate: ₹8,500/mo (API + support + SMS).
  // Branding: ₹35,000 one-time (signage, app listing, display config).
  await prisma.servicePricingConfig.createMany({
    data: [
      { moduleKey: "TRAINERS",         pricingType: "MONTHLY",               defaultMonthlyFee: 2500000                                       }, // ₹25,000/mo
      { moduleKey: "ASSETS",           pricingType: "ONE_TIME",              defaultOneTimeFee: 128000000                                     }, // ₹12,80,000 (MEDIUM baseline)
      { moduleKey: "VENDING_MACHINES", pricingType: "ONE_TIME_PLUS_TAKE_RATE", defaultOneTimeFee: 7500000, defaultTakeRatePct: 9.0            }, // ₹75,000 + 9%
      { moduleKey: "MYGATE",           pricingType: "MONTHLY",               defaultMonthlyFee: 850000                                        }, // ₹8,500/mo
      { moduleKey: "BRANDING",         pricingType: "ONE_TIME",              defaultOneTimeFee: 3500000                                       }, // ₹35,000 one-time
    ],
  })

  // ─── EquipmentCatalogItem — Cultsport Commercial Catalog 2025 ────────────────
  // Min prices in paise. CS-AC800 is intentionally marked as superseded by CS-V6 for the upgrade ad demo.
  // Full pricing for all 58 catalog items (in paise, ₹1 = 100 paise).
  // Based on Cultsport commercial list pricing with standard RWA B2B discount applied.
  // Cardio: premium for commercial-grade motors + warranties.
  // Strength: selectorized machines priced per series (Flow < Flux < Fuel < Force for plate-loaded).
  // Free weights: per-set pricing (not per kg).
  const CATALOG_MIN_PRICES: Record<string, number> = {
    // ── TREADMILLS ──────────────────────────────────────────────────────────
    "CS-XG-V12":    25000000, // ₹2,50,000 — flagship, 9HP AC, decline feature
    "CS-AC800":     15000000, // ₹1,50,000 — entry commercial (superseded by CS-V6)
    "CS-V6":        20000000, // ₹2,00,000 — current standard commercial
    "CS-T919":      22000000, // ₹2,20,000 — 21.5" touchscreen display
    "CS-XZ8001S":   18000000, // ₹1,80,000 — mid-range motorized
    "CS-XZ8003C":   16000000, // ₹1,60,000 — curved manual (no motor cost)
    // ── ELLIPTICALS ──────────────────────────────────────────────────────────
    "CS-RE500":     18000000, // ₹1,80,000 — self-powered hybrid brake
    "CS-E12-V5":    16500000, // ₹1,65,000 — 15-level incline
    "CS-E17":       22000000, // ₹2,20,000 — 40 resistance levels, 22" stride
    // ── BIKES ────────────────────────────────────────────────────────────────
    "CS-R11-V4":     7500000, // ₹75,000  — recumbent
    "CS-B11V3":      8000000, // ₹80,000  — upright
    "CS-K8938":     10000000, // ₹1,00,000 — spin bike
    "CS-XZ671-E":    9000000, // ₹90,000  — air bike
    // ── HIGH INTENSITY ────────────────────────────────────────────────────────
    "CS-XZ1116E":   20500000, // ₹2,05,000 — commercial stairmill
    "CS-XZ-TK104":   6500000, // ₹65,000  — tank sled
    // ── STRENGTH: FLOW SERIES ─────────────────────────────────────────────────
    "CS-M1-001":    25000000, // ₹2,50,000 — Chest Press
    "CS-M1-003":    24500000, // ₹2,45,000 — Shoulder Press
    "CS-M1-002A":   24000000, // ₹2,40,000 — Pec Fly / Rear Delt
    "CS-M1-012":    25000000, // ₹2,50,000 — Lat Pull Down
    "CS-M1-004":    23500000, // ₹2,35,000 — Seated Row
    "CS-M1-008":    26000000, // ₹2,60,000 — Assisted Dip/Chin
    "CS-M1-013":    24000000, // ₹2,40,000 — Leg Curl
    "CS-M1-014":    24500000, // ₹2,45,000 — Seated Leg Extension
    // ── STRENGTH: FLUX SERIES ─────────────────────────────────────────────────
    "CS-TY01":      23000000, // ₹2,30,000 — Chest Press (Flux)
    "CS-TY16":      28000000, // ₹2,80,000 — Seated Leg Press (Flux, 135kg stack)
    "CS-TY13":      25000000, // ₹2,50,000 — Leg Extension (Flux)
    "CS-TY14":      26000000, // ₹2,60,000 — Seated Leg Curl (Flux)
    // ── STRENGTH: FUEL SERIES (compact) ──────────────────────────────────────
    "CS-ASN001":    21000000, // ₹2,10,000 — Chest Press (Fuel)
    "CS-ASN015":    24000000, // ₹2,40,000 — Seated Leg Press (Fuel)
    "CS-JXS03":     80000000, // ₹8,00,000 — 3-station Multi Gym (7 workouts)
    // ── STRENGTH: FORCE SERIES (plate-loaded, iso-lateral) ────────────────────
    "CS-MWH001":    19000000, // ₹1,90,000 — Chest Press (Force)
    "CS-XH022":     22000000, // ₹2,20,000 — 45° Leg Press (Force)
    // ── CABLE & FUNCTIONAL ────────────────────────────────────────────────────
    "CS-H005":      45000000, // ₹4,50,000 — Cable Crossover (full rig)
    "CS-H005A":     50000000, // ₹5,00,000 — Functional Trainer (Fuel)
    "CS-XH005A":    55000000, // ₹5,50,000 — Functional Trainer (Flow, heavier)
    "CS-H005B":     16000000, // ₹1,60,000 — Single Adjustable Pulley
    "CS-H020":      24000000, // ₹2,40,000 — Smith Machine (Fuel)
    "CS-H021":      18000000, // ₹1,80,000 — Squat Rack (Fuel)
    "CS-MWH018":    16000000, // ₹1,60,000 — Half Rack (Fuel)
    "CS-XH021":     17000000, // ₹1,70,000 — Squat Rack (Flow)
    // ── BENCHES ──────────────────────────────────────────────────────────────
    "CS-H023":       7500000, // ₹75,000  — Olympic Flat Bench (Fuel)
    "CS-H025":       9500000, // ₹95,000  — Olympic Incline Bench (Fuel)
    "CS-H037":       4500000, // ₹45,000  — Adjustable Bench (Fuel)
    "CS-H034":       5500000, // ₹55,000  — Adjustable AB Bench (Fuel)
    "CS-H026":       4200000, // ₹42,000  — Hyperextension Bench
    "CS-H040":       4000000, // ₹40,000  — Preacher Curl Bench
    // ── FREE WEIGHTS ──────────────────────────────────────────────────────────
    "CS-DUMBBELL-2-25":  7500000, // ₹75,000  — Rubber Hex Set 2–25 kg (13 pairs)
    "CS-DUMBBELL-2-40":  8000000, // ₹80,000  — Rubber Hex Set 2–40 kg (full range)
    "CS-H030":           5000000, // ₹50,000  — 2-Tier Dumbbell Rack
    "CS-DH030A":         5000000, // ₹50,000  — 3-Tier Dumbbell Rack
    "CS-BUMPER-SET":     3500000, // ₹35,000  — Bumper Plate Set (5 pairs)
    "CS-BARBELL-20":      850000, // ₹8,500   — Olympic Barbell 20kg
    // ── KETTLEBELLS ──────────────────────────────────────────────────────────
    "CS-KB-4-24":        2800000, // ₹28,000  — Kettlebell Set 4–24 kg (9 sizes)
    // ── ACCESSORIES ──────────────────────────────────────────────────────────
    "CS-ACC-BANDS":       350000, // ₹3,500   — Resistance Band Set (5 levels)
    "CS-ACC-MEDBALLS":   1200000, // ₹12,000  — Medicine Ball Set 3–10 kg
    "CS-ACC-BATTLEROPE":  850000, // ₹8,500   — Battle Rope 15m
    "CS-ACC-TRX":        1500000, // ₹15,000  — TRX Suspension Trainer (commercial)
    "CS-ACC-YOGAMAT":     250000, // ₹2,500   — Premium Yoga Mat
    "CS-ACC-FOAMROLLER":  450000, // ₹4,500   — Foam Roller Set
  }

  await prisma.equipmentCatalogItem.createMany({
    data: EQUIPMENT_CATALOG.map((item) => ({
      sku: item.sku,
      name: item.name,
      category: item.category,
      series: item.series ?? null,
      imageUrl: item.imageUrl ?? null,
      imageUrl2: item.imageUrl2 ?? null,
      specsJson: item.specs ?? null,
      isHighlight: item.isHighlight ?? false,
      minPricePerUnit: CATALOG_MIN_PRICES[item.sku] ?? null,
      version: 1,
      isLatestVersion: item.sku === "CS-AC800" ? false : true,
      supersedesSku: item.sku === "CS-AC800" ? "CS-V6" : null,
    })),
  })
  console.log(`✓ Equipment catalog seeded (${EQUIPMENT_CATALOG.length} items, with pricing + upgrade tracking)`)

  // ─── EquipmentRecommendation — model gym setups per tier ─────────────────────
  // Items reference EquipmentCatalogItem.sku and include resolved name/category for display.
  await prisma.equipmentRecommendation.createMany({
    data: (["SMALL", "MEDIUM", "LARGE"] as const).map((tier) => ({
      sizeCategory: tier,
      items: JSON.stringify(getModelGymItems(tier)),
    })),
  })
  console.log("✓ Equipment recommendations seeded (SMALL / MEDIUM / LARGE)")

  // ─── Sample leads (for demo) ──────────────────────────────────────────────────
  // DEMO-TOKEN-2026 — predictable URL for hackathon demo: /rwa/setup/DEMO-TOKEN-2026
  // All wizard fields pre-filled; RWA Admin can click through without typing.
  await prisma.lead.create({
    data: {
      societyName: "Prestige Greenview",
      contactName: "Anand Krishnamurthy",
      contactEmail: "anand.k@prestigegreenview.com",
      contactPhone: "9844155678",
      status: "INVITED",
      inviteToken: "DEMO-TOKEN-2026",
      inviteExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  // Lead 1: INVITED (not yet acted on)
  await prisma.lead.create({
    data: {
      societyName: "Godrej Emerald",
      contactName: "Rohit Sharma",
      contactEmail: "rohit@godrejemerald.in",
      contactPhone: "9876543210",
      status: "INVITED",
      inviteToken: "demo-token-invited-godrej-emerald-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Lead 2: FORM_SUBMITTED (RWA filled wizard, CF Admin yet to price)
  await prisma.lead.create({
    data: {
      societyName: "Sobha Dream Acres",
      contactName: "Priya Nair",
      contactEmail: "priya@sobhadream.in",
      contactPhone: "9123456789",
      status: "FORM_SUBMITTED",
      inviteToken: "demo-token-submitted-sobha-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      formData: JSON.stringify({
        gymSetupType: "NEW_GYM",
        name: "Sobha Dream Gym",
        code: "SOBHA-DRM-01",
        address: "Sobha Dream Acres, Panathur Road",
        city: "Bangalore",
        pincode: "560087",
        capacity: 60,
        gymSqFt: 1400,
        rwaName: "Sobha Dream Acres RWA",
        totalUnits: 340,
        contactPersonName: "Priya Nair",
        contactPersonPhone: "9123456789",
        contactPersonEmail: "priya@sobhadream.in",
        selectedModules: ["TRAINERS", "ASSETS", "MYGATE"],
        trainerIds: [],
        // Sobha: budget-conscious. Removed 2 strength machines, kept essentials.
        // Estimated equipment cost: ~₹10.8L
        selectedEquipment: getModelGymItems("MEDIUM").filter((i: {sku: string}) =>
          !["CS-M1-003", "CS-M1-004", "CS-ASN001"].includes(i.sku)
        ),
      }),
    },
  })

  // Lead 3: QUOTE_SENT (CF Admin sent quote, awaiting RWA sign-off)
  const lead3 = await prisma.lead.create({
    data: {
      societyName: "Brigade Metropolis",
      contactName: "Anand Kumar",
      contactEmail: "anand@brigademetro.in",
      contactPhone: "9988776655",
      status: "QUOTE_SENT",
      inviteToken: "demo-token-quotesent-brigade-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      formData: JSON.stringify({
        name: "Brigade Metropolis Gym",
        code: "BRIG-MTR-01",
        address: "Brigade Metropolis, Whitefield",
        city: "Bangalore",
        pincode: "560066",
        capacity: 100,
        gymSqFt: 2200,
        rwaName: "Brigade Metropolis RWA",
        totalUnits: 480,
        contactPersonName: "Anand Kumar",
        contactPersonPhone: "9988776655",
        contactPersonEmail: "anand@brigademetro.in",
        selectedModules: ["TRAINERS", "ASSETS", "VENDING_MACHINES", "MYGATE"],
        trainerIds: [],
      }),
    },
  })

  // Brigade Metropolis: 2,200 sqft, 480 units — LARGE-leaning MEDIUM. 
  // Requested: 4 treadmills, 2 bikes, elliptical, 6 Flow Series machines, squat rack, 
  // functional trainer, full free weight set + vending zone.
  // Trainers: 2 full-time (₹25K × 2 = ₹50K) + 1 PT (₹18K) = ₹68K → negotiated ₹62K.
  // Equipment: ₹18.4L (larger than Purva, includes 2 extra machines + heavier free weight set).
  // Vending: ₹90K install + 9% share.
  // MyGate: ₹8,500/mo (standard).
  // Notes: CF Admin discounted trainers by 10% from default on 2-year lock-in.
  const brigadeMQuoteHistory = appendHistory("[]", {
    round: 0, action: "CF_QUOTE_SENT", actorRole: "CF_ADMIN",
    snapshot: { totalOneTime: 192500000, totalMonthly: 7050000, quoteMode: "ITEMIZED" },
  })

  await prisma.quote.create({
    data: {
      leadId: lead3.id,
      status: "SENT",
      sentAt: daysAgo(1),
      notes: "Trainer rate at ₹62K/mo (10% loyalty discount on 2-yr contract). Vending take rate at 9% — standard for 480-unit society. Equipment covers full MEDIUM+ setup per sqft assessment.",
      historyJson: brigadeMQuoteHistory,
      lineItems: {
        create: [
          // 2 full-time + 1 PT trainer → ₹62,000/mo negotiated
          { moduleKey: "TRAINERS",  pricingType: "MONTHLY",               monthlyFee:  6200000 },
          // Full medium+ equipment: 4 treadmills, bikes, elliptical, 6 strength machines,
          // rack, functional trainer, dumbbell set 2-40kg, kettlebells → ₹18,40,000
          { moduleKey: "ASSETS",    pricingType: "ONE_TIME",              oneTimeFee: 184000000 },
          // Vending: 1 machine at ₹90,000 install + 9% share
          { moduleKey: "VENDING_MACHINES", pricingType: "ONE_TIME_PLUS_TAKE_RATE",
            oneTimeFee: 9000000, takeRatePct: 9.0 },
          // MyGate: standard ₹8,500/mo
          { moduleKey: "MYGATE",    pricingType: "MONTHLY",               monthlyFee:   850000 },
        ],
      },
    },
  })

  // ─── DEMO: Purva Panorama — fully accepted lead with 2-round negotiation history ──
  // This is the primary RWA Admin demo center showing the complete journey.
  const purvaEquipment = [
    ...getModelGymItems("MEDIUM"),
    // Extra items added during negotiation round 2
    { sku: "CS-XZ1116E", name: "Stairmill CS-XZ1116E", category: "HIGH_INTENSITY", qty: 1, imageUrl: "/equipment/hiit-1.jpg" },
    { sku: "CS-H025", name: "Olympic Incline Bench (Fuel)", category: "BENCH", qty: 1, imageUrl: "/equipment/bench-1.jpg" },
  ]

  // Purva Panorama: 1,850 sqft, 420 units — solid MEDIUM.
  // Negotiation: CF sent ₹13.85L equipment + ₹35K/mo services.
  // RWA: "Can we add a Stairmill and Incline Bench for the yoga zone?"
  // CF revised: Added ₹2.45L for those items (₹2.05L stairmill + ₹40K bench).
  // Final: ₹16.3L one-time + ₹43.5K/mo. RWA accepted — strong deal.
  let purvaHistory = "[]"
  purvaHistory = appendHistory(purvaHistory, {
    round: 0, action: "CF_QUOTE_SENT", actorRole: "CF_ADMIN",
    snapshot: { totalOneTime: 138500000, totalMonthly: 3500000, quoteMode: "ITEMIZED" },
  })
  purvaHistory = appendHistory(purvaHistory, {
    round: 1, action: "RWA_REVISION_REQUESTED", actorRole: "RWA_ADMIN",
    notes: "Happy with the setup! Can we add a Stairmill and Olympic Incline Bench? We have 180 sqft extra near the yoga zone.",
    snapshot: { equipmentCount: purvaEquipment.length },
  })
  purvaHistory = appendHistory(purvaHistory, {
    round: 1, action: "CF_QUOTE_REVISED", actorRole: "CF_ADMIN",
    snapshot: { totalOneTime: 163000000, totalMonthly: 4350000, quoteMode: "ITEMIZED" },
  })
  purvaHistory = appendHistory(purvaHistory, {
    round: 1, action: "RWA_ACCEPTED", actorRole: "RWA_ADMIN",
    snapshot: { totalOneTime: 163000000, totalMonthly: 4350000, quoteMode: "ITEMIZED" },
  })

  // Create Purva Panorama center
  const centerPurva = await prisma.center.create({
    data: {
      name: "Purva Panorama",
      code: "PP-GYM-001",
      status: "ONBOARDING",
      address: "Purva Panorama, Bellary Road",
      city: "Bengaluru",
      pincode: "560024",
      capacity: 50,
      gymSqFt: 1850,
      operatingSince: null,
    },
  })

  await prisma.residentialDetails.create({
    data: {
      centerId: centerPurva.id,
      rwaName: "Purva Panorama Residents Association",
      totalUnits: 420,
      contactPersonName: "Kavitha Reddy",
      contactPersonPhone: "+91 98861 44321",
      contactPersonEmail: "kavitha@purvapanorama.com",
    },
  })

  await prisma.centerModule.createMany({
    data: [
      { centerId: centerPurva.id, moduleKey: "TRAINERS", isEnabled: true },
      { centerId: centerPurva.id, moduleKey: "ASSETS", isEnabled: true },
      { centerId: centerPurva.id, moduleKey: "MYGATE", isEnabled: true },
    ],
  })

  await prisma.myGateConfig.create({
    data: {
      centerId: centerPurva.id,
      societyId: "MGS-PP-9901",
      apiKey: "mg_live_pk_pp_xxxxxxxxxxxx",
      webhookUrl: "https://omnicore.internal/api/webhooks/mygate/pp",
      isActive: false,
    },
  })

  // Create accepted lead linked to Purva center
  const leadPurva = await prisma.lead.create({
    data: {
      societyName: "Purva Panorama",
      contactName: "Kavitha Reddy",
      contactEmail: "kavitha@purvapanorama.com",
      contactPhone: "9886144321",
      status: "ACCEPTED",
      inviteToken: "DEMO-TOKEN-PURVA-ACCEPTED",
      inviteExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      centerId: centerPurva.id,
      formData: JSON.stringify({
        gymSetupType: "NEW_GYM",
        name: "Purva Panorama Gym",
        code: "PP-GYM-001",
        address: "Purva Panorama, Bellary Road",
        city: "Bengaluru",
        pincode: "560024",
        capacity: 50,
        gymSqFt: 1850,
        rwaName: "Purva Panorama Residents Association",
        totalUnits: 420,
        contactPersonName: "Kavitha Reddy",
        contactPersonPhone: "9886144321",
        contactPersonEmail: "kavitha@purvapanorama.com",
        selectedModules: ["TRAINERS", "ASSETS", "MYGATE"],
        trainerIds: [],
        selectedEquipment: purvaEquipment,
      }),
    },
  })

  // Create accepted quote with full history
  await prisma.quote.create({
    data: {
      leadId: leadPurva.id,
      status: "ACCEPTED",
      sentAt: daysAgo(5),
      acceptedAt: daysAgo(2),
      notes: "Final quote — MEDIUM+ setup with Stairmill & Incline Bench added in Round 2. 2-year contract. Trainers: 1 full-time + 1 PT. MyGate live at go-live.",
      quoteMode: "ITEMIZED",
      revisionRound: 1,
      historyJson: purvaHistory,
      lineItems: {
        create: [
          // 1 full-time trainer (₹28K) + 1 PT specialist (₹15K) = ₹43,000/mo total
          { moduleKey: "TRAINERS",  pricingType: "MONTHLY",  monthlyFee:  4300000 },
          // Equipment: MEDIUM baseline (₹12.8L) + Stairmill (₹2.05L) + Incline Bench (₹40K)
          // + installation (₹45K) + first-year service contract (₹40K) = ₹16,30,000
          { moduleKey: "ASSETS",    pricingType: "ONE_TIME", oneTimeFee: 163000000 },
          // MyGate: standard ₹8,500/mo (includes API, support, resident QR)
          { moduleKey: "MYGATE",    pricingType: "MONTHLY",  monthlyFee:   850000 },
        ],
      },
    },
  })

  // Seed equipment assets for Purva from accepted quote
  const sixMonths = daysFromNow(180)
  const threeMonths = daysFromNow(90)
  const overdue = daysAgo(5)
  const soonDue = daysFromNow(12)

  await prisma.equipmentAsset.createMany({
    data: [
      // Treadmills — CS-AC800 (old version → shows upgrade ad)
      { centerId: centerPurva.id, name: "Motorized Treadmill CS-AC800", category: "TREADMILL",
        catalogItemSku: "CS-AC800", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      { centerId: centerPurva.id, name: "Motorized Treadmill CS-AC800 #2", category: "TREADMILL",
        catalogItemSku: "CS-AC800", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: threeMonths },
      // Bikes
      { centerId: centerPurva.id, name: "Upright Bike CS-B11V3", category: "BIKE",
        catalogItemSku: "CS-B11V3", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      { centerId: centerPurva.id, name: "Upright Bike CS-B11V3 #2", category: "BIKE",
        catalogItemSku: "CS-B11V3", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: threeMonths },
      // Elliptical
      { centerId: centerPurva.id, name: "Elliptical CS-RE500", category: "ELLIPTICAL",
        catalogItemSku: "CS-RE500", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      // Strength machines
      { centerId: centerPurva.id, name: "Chest Press (Flow Series)", category: "STRENGTH_FLOW",
        catalogItemSku: "CS-M1-001", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: threeMonths },
      { centerId: centerPurva.id, name: "Lat Pull Down (Flow Series)", category: "STRENGTH_FLOW",
        catalogItemSku: "CS-M1-012", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: soonDue },  // AMBER — due in 12 days
      // Stairmill (added in revision)
      { centerId: centerPurva.id, name: "Stairmill CS-XZ1116E", category: "HIGH_INTENSITY",
        catalogItemSku: "CS-XZ1116E", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      // Bench (added in revision) — OVERDUE for demo
      { centerId: centerPurva.id, name: "Olympic Incline Bench (Fuel)", category: "BENCH",
        catalogItemSku: "CS-H025", installationDate: daysAgo(2), condition: "POOR",
        notes: "Minor padding tear on left side. Service logged.",
        nextServiceDue: overdue },  // RED — overdue
      // Free weights
      { centerId: centerPurva.id, name: "Rubber Hex Dumbbell Set 2–40kg", category: "FREE_WEIGHTS",
        catalogItemSku: "CS-DUMBBELL-2-40", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      { centerId: centerPurva.id, name: "3-Tier Dumbbell Rack", category: "FREE_WEIGHTS",
        catalogItemSku: "CS-DH030A", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      { centerId: centerPurva.id, name: "Squat Rack CS-H021", category: "CABLE_FUNCTIONAL",
        catalogItemSku: "CS-H021", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: threeMonths },
      { centerId: centerPurva.id, name: "Functional Trainer CS-H005A", category: "CABLE_FUNCTIONAL",
        catalogItemSku: "CS-H005A", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
      { centerId: centerPurva.id, name: "Kettlebell Set 4–24kg", category: "KETTLEBELL",
        catalogItemSku: "CS-KB-4-24", installationDate: daysAgo(2), condition: "GOOD",
        nextServiceDue: sixMonths },
    ],
  })

  // Service request for the overdue bench
  await prisma.serviceRequest.create({
    data: {
      centerId: centerPurva.id,
      title: "Olympic Incline Bench — Padding Repair Required",
      description: "Left-side padding has a 5cm tear. Bench removed from use pending repair.",
      status: "OPEN",
      priority: "HIGH",
      reportedBy: "Kavitha Reddy (RWA Admin)",
    },
  })

  console.log("✓ Purva Panorama demo center seeded (14 assets, 1 overdue SR, 2-round negotiation history)")
  console.log(`✓ Seeded: ${EQUIPMENT_CATALOG.length} catalog items, 3 model gym tiers, 4+ leads (DEMO-TOKEN-2026 + 3 pipeline), 1 quote`)
  console.log("\n✅ Seed complete!")
  console.log(`   Centers: 3 (2 active, 1 onboarding)`)
  console.log(`   Center Modules: seeded per center (Trainers, Assets, MyGate, Branding, VMs)`)
  console.log(`   Trainers: 5 (3 fulltime, 2 PT)`)
  console.log(`   Assets: 8 (including 1 red, 1 amber)`)
  console.log(`   Service Requests: 4 (1 open critical, 1 in-progress, 1 assigned, 1 resolved)`)
  console.log(`   Amenity Bookings: ${amenityBookings.length}`)
  console.log(`   PT Sessions: ${ptSessions.length}`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
