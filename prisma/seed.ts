import { PrismaClient } from "@prisma/client"

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

  await prisma.serviceConfig.createMany({
    data: [
      // Prestige — premium bundle
      { centerId: centerPrestige.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 1800, setupFee: 500 },
      { centerId: centerPrestige.id, serviceName: "Personal Training (8 sessions)", serviceType: "PT", monthlyFee: 6000, setupFee: 0 },
      { centerId: centerPrestige.id, serviceName: "Yoga & Zumba", serviceType: "GROUP_CLASS", monthlyFee: 1200, setupFee: 0 },
      { centerId: centerPrestige.id, serviceName: "Locker Access", serviceType: "ADD_ON", monthlyFee: 300, setupFee: 100 },
      // Brigade — standard bundle
      { centerId: centerBrigade.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 1500, setupFee: 300 },
      { centerId: centerBrigade.id, serviceName: "Personal Training (4 sessions)", serviceType: "PT", monthlyFee: 3500, setupFee: 0 },
      { centerId: centerBrigade.id, serviceName: "Zumba Classes", serviceType: "GROUP_CLASS", monthlyFee: 800, setupFee: 0 },
      // Sobha — minimal (onboarding)
      { centerId: centerSobha.id, serviceName: "Full Gym Access", serviceType: "MEMBERSHIP", monthlyFee: 1200, setupFee: 200 },
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
      {
        centerId: centerBrigade.id,
        name: "Multi-Gym Station",
        category: "Strength",
        brand: "Technogym",
        model: "Selection 900",
        purchasedOn: daysAgo(300),
        lastServicedOn: daysAgo(20),
        nextServiceDue: daysFromNow(70),
        condition: "GOOD",
      },
      {
        centerId: centerBrigade.id,
        name: "Treadmill #1",
        category: "Cardio",
        brand: "Matrix",
        model: "T75",
        purchasedOn: daysAgo(350),
        lastServicedOn: daysAgo(50),
        nextServiceDue: daysFromNow(20),
        condition: "FAIR",
        notes: "Belt tension checked. Within acceptable range.",
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
  await prisma.servicePricingConfig.createMany({
    data: [
      {
        moduleKey: "TRAINERS",
        pricingType: "MONTHLY",
        defaultMonthlyFee: 1500000, // ₹15,000/month in paise
      },
      {
        moduleKey: "ASSETS",
        pricingType: "ONE_TIME",
        defaultOneTimeFee: 50000000, // ₹5,00,000 one-time in paise
      },
      {
        moduleKey: "VENDING_MACHINES",
        pricingType: "ONE_TIME_PLUS_TAKE_RATE",
        defaultOneTimeFee: 5000000, // ₹50,000 installation in paise
        defaultTakeRatePct: 8.5,
      },
      {
        moduleKey: "MYGATE",
        pricingType: "MONTHLY",
        defaultMonthlyFee: 500000, // ₹5,000/month in paise
      },
      {
        moduleKey: "BRANDING",
        pricingType: "ONE_TIME",
        defaultOneTimeFee: 2500000, // ₹25,000 one-time in paise
      },
    ],
  })

  // ─── EquipmentRecommendation — lookup table ───────────────────────────────────
  await prisma.equipmentRecommendation.createMany({
    data: [
      {
        sizeCategory: "SMALL",
        items: JSON.stringify([
          { name: "Treadmill", quantity: 2 },
          { name: "Upright Cycle", quantity: 1 },
          { name: "Dumbbell Rack (5–25 kg)", quantity: 1 },
        ]),
      },
      {
        sizeCategory: "MEDIUM",
        items: JSON.stringify([
          { name: "Treadmill", quantity: 4 },
          { name: "Upright Cycle", quantity: 2 },
          { name: "Elliptical", quantity: 2 },
          { name: "Free Weight Rack", quantity: 1 },
          { name: "Resistance Machine", quantity: 3 },
        ]),
      },
      {
        sizeCategory: "LARGE",
        items: JSON.stringify([
          { name: "Commercial Treadmill", quantity: 8 },
          { name: "Elliptical", quantity: 4 },
          { name: "Upright Cycle", quantity: 4 },
          { name: "Rowing Machine", quantity: 2 },
          { name: "Full Free Weight Suite", quantity: 1 },
          { name: "Resistance Machine", quantity: 6 },
          { name: "Functional Training Rig", quantity: 1 },
          { name: "Boxing Station", quantity: 1 },
        ]),
      },
    ],
  })

  // ─── Sample leads (for demo) ──────────────────────────────────────────────────
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

  await prisma.quote.create({
    data: {
      leadId: lead3.id,
      status: "SENT",
      sentAt: new Date(),
      notes: "Standard pricing applied. Vending take rate negotiable.",
      lineItems: {
        create: [
          { moduleKey: "TRAINERS", pricingType: "MONTHLY", monthlyFee: 1500000 },
          { moduleKey: "ASSETS", pricingType: "ONE_TIME", oneTimeFee: 50000000 },
          {
            moduleKey: "VENDING_MACHINES",
            pricingType: "ONE_TIME_PLUS_TAKE_RATE",
            oneTimeFee: 5000000,
            takeRatePct: 8.5,
          },
          { moduleKey: "MYGATE", pricingType: "MONTHLY", monthlyFee: 500000 },
        ],
      },
    },
  })

  console.log("Seeded: 5 pricing configs, 3 equipment recs, 3 leads, 1 quote")
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
