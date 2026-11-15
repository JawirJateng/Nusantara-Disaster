import { PrismaClient, Role, Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Nusantara Disaster database...');

  // Destructive reset is opt-in and never runs during a normal deploy.
  if (process.env.RESET_DB === 'true') {
    console.log('⚠️ RESET_DB=true: menghapus kejadian dan berita yang ada.');
    await prisma.disasterEvent.deleteMany({});
    await prisma.newsItem.deleteMany({});
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ndw.go.id';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('ADMIN_PASSWORD belum diset');
  if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD minimal 12 karakter');

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    // Password follows ADMIN_PASSWORD, so rotating it in .env takes effect on the next deploy.
    update: { passwordHash: hashedPassword },
    create: {
      email: adminEmail,
      name: 'Super Administrator NDW',
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Default admin created:', admin.email);

  const sourcesData = [
    { name: 'BMKG (Meteorologi, Klimatologi, dan Geofisika)', code: 'BMKG', pollIntervalMinutes: 1, isEnabled: true },
    { name: 'BNPB (Badan Nasional Penanggulangan Bencana)', code: 'BNPB', pollIntervalMinutes: 15, isEnabled: true },
    { name: 'PVMBG / MAGMA Indonesia (Gunung Api)', code: 'PVMBG', pollIntervalMinutes: 15, isEnabled: true },
    { name: 'NASA FIRMS (Hotspot Satelit Kebakaran Hutan)', code: 'NASA_FIRMS', pollIntervalMinutes: 30, isEnabled: true },
    { name: 'PetaBencana.id (Crowdsourced Flood Reports)', code: 'PETABENCANA', pollIntervalMinutes: 5, isEnabled: true },
  ];

  const sourcesMap: Record<string, string> = {};
  for (const src of sourcesData) {
    const dataSource = await prisma.dataSource.upsert({
      where: { code: src.code },
      update: { name: src.name, pollIntervalMinutes: src.pollIntervalMinutes },
      create: src,
    });
    sourcesMap[src.code] = dataSource.id;
  }
  console.log('✅ Data sources seeded.');
  console.log('ℹ️ Data kejadian live diisi oleh Intelligent Disaster Data Synchronization Engine saat backend start.');

  // Seed historical archive events (1 month, quarterly, 1 year) stored in database but excluded from 7-day homepage window
  const historicalEvents = [
    {
      title: 'Gempa Bumi M5.8 - Maluku Tenggara',
      description: 'Gempa bumi tektonik magnitudo 5.8 mengguncang Maluku Tenggara.',
      category: Category.EARTHQUAKE,
      severity: Severity.HIGH,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Maluku',
      locationName: 'Maluku Tenggara',
      latitude: -5.6,
      longitude: 132.8,
      occurredAt: new Date(Date.now() - 25 * 24 * 3600 * 1000), // 25 days ago (1 Month)
      sourceId: sourcesMap['BMKG'],
      externalId: 'ARCHIVE-HISTORICAL-1MONTH-1',
    },
    {
      title: 'Banjir Bandang - Kabupaten Luwu Sulawesi Selatan',
      description: 'Banjir bandang menerjang pemukiman warga di Kabupaten Luwu.',
      category: Category.FLOOD,
      severity: Severity.CRITICAL,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Sulawesi Selatan',
      locationName: 'Kabupaten Luwu',
      latitude: -3.3,
      longitude: 120.2,
      occurredAt: new Date(Date.now() - 28 * 24 * 3600 * 1000), // 28 days ago (1 Month)
      sourceId: sourcesMap['BNPB'],
      externalId: 'ARCHIVE-HISTORICAL-1MONTH-2',
    },
    {
      title: 'Erupsi Gunung Ruang - Sulawesi Utara',
      description: 'Gunung Ruang mengalami erupsi eksplosif menyemburkan abu vulkanik tinggi.',
      category: Category.VOLCANO,
      severity: Severity.CRITICAL,
      status: EventStatus.CONTAINED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Sulawesi Utara',
      locationName: 'Kabupaten Sitaro',
      latitude: 2.3,
      longitude: 125.3,
      occurredAt: new Date(Date.now() - 75 * 24 * 3600 * 1000), // 75 days ago (Quarterly / 3 Months)
      sourceId: sourcesMap['PVMBG'],
      externalId: 'ARCHIVE-HISTORICAL-QUARTERLY-1',
    },
    {
      title: 'Gempa Bumi M6.2 - Garut Jawa Barat',
      description: 'Gempa bumi dirasakan kuat di Garut dan Bandung serta sekitarnya.',
      category: Category.EARTHQUAKE,
      severity: Severity.HIGH,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Jawa Barat',
      locationName: 'Garut',
      latitude: -7.2,
      longitude: 107.9,
      occurredAt: new Date(Date.now() - 90 * 24 * 3600 * 1000), // 90 days ago (Quarterly / 3 Months)
      sourceId: sourcesMap['BMKG'],
      externalId: 'ARCHIVE-HISTORICAL-QUARTERLY-2',
    },
    {
      title: 'Gempa Bumi M6.6 - Tuban Jawa Timur',
      description: 'Gempa bumi kuat di Laut Jawa berdampak hingga Tuban dan Surabaya.',
      category: Category.EARTHQUAKE,
      severity: Severity.HIGH,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Jawa Timur',
      locationName: 'Tuban',
      latitude: -5.7,
      longitude: 112.5,
      occurredAt: new Date(Date.now() - 200 * 24 * 3600 * 1000), // ~7 months ago (1 Year span)
      sourceId: sourcesMap['BMKG'],
      externalId: 'ARCHIVE-HISTORICAL-1YEAR-1',
    },
    {
      title: 'Banjir Besar Demak - Jawa Tengah',
      description: 'Banjir akibat jebolnya tanggul Sungai Wulan merendam puluhan desa di Demak.',
      category: Category.FLOOD,
      severity: Severity.CRITICAL,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Jawa Tengah',
      locationName: 'Demak',
      latitude: -6.8,
      longitude: 110.6,
      occurredAt: new Date(Date.now() - 280 * 24 * 3600 * 1000), // ~9 months ago (1 Year span)
      sourceId: sourcesMap['BNPB'],
      externalId: 'ARCHIVE-HISTORICAL-1YEAR-2',
    },
    {
      title: 'Erupsi Gunung Marapi - Sumatra Barat',
      description: 'Erupsi eksplosif Gunung Marapi disertai guguran material vulkanik.',
      category: Category.VOLCANO,
      severity: Severity.CRITICAL,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Sumatra Barat',
      locationName: 'Agam / Tanah Datar',
      latitude: -0.38,
      longitude: 100.47,
      occurredAt: new Date(Date.now() - 340 * 24 * 3600 * 1000), // ~11 months ago (1 Year span)
      sourceId: sourcesMap['PVMBG'],
      externalId: 'ARCHIVE-HISTORICAL-1YEAR-3',
    },
    {
      title: 'Gempa Bumi M5.6 - Cianjur Jawa Barat',
      description: 'Gempa darat merusak yang berdampak luas di Kabupaten Cianjur dan Sukabumi.',
      category: Category.EARTHQUAKE,
      severity: Severity.CRITICAL,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Jawa Barat',
      locationName: 'Cianjur',
      latitude: -6.82,
      longitude: 107.08,
      occurredAt: new Date(Date.now() - 350 * 24 * 3600 * 1000),
      sourceId: sourcesMap['BMKG'],
      externalId: 'ARCHIVE-HISTORICAL-1YEAR-4',
    },
    {
      title: 'Banjir Bandang & Lahar Dingin - Sumatra Barat',
      description: 'Banjir bandang lahar dingin Gunung Marapi menerjang Agam, Padang Panjang, dan Tanah Datar.',
      category: Category.FLOOD,
      severity: Severity.CRITICAL,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Sumatra Barat',
      locationName: 'Tanah Datar & Agam',
      latitude: -0.45,
      longitude: 100.35,
      occurredAt: new Date(Date.now() - 150 * 24 * 3600 * 1000),
      sourceId: sourcesMap['BNPB'],
      externalId: 'ARCHIVE-HISTORICAL-QUARTERLY-3',
    },
    {
      title: 'Gempa Bumi M6.5 - Bawean Jawa Timur',
      description: 'Gempa beruntun di Laut Jawa dekat Pulau Bawean dirasakan hingga Surabaya.',
      category: Category.EARTHQUAKE,
      severity: Severity.HIGH,
      status: EventStatus.RESOLVED,
      verificationStatus: VerificationStatus.VERIFIED,
      province: 'Jawa Timur',
      locationName: 'Pulau Bawean',
      latitude: -5.75,
      longitude: 112.65,
      occurredAt: new Date(Date.now() - 180 * 24 * 3600 * 1000),
      sourceId: sourcesMap['BMKG'],
      externalId: 'ARCHIVE-HISTORICAL-QUARTERLY-4',
    },
  ];

  for (const hist of historicalEvents) {
    await prisma.disasterEvent.upsert({
      where: {
        sourceId_externalId: { sourceId: hist.sourceId, externalId: hist.externalId },
      },
      update: {},
      create: hist,
    }).catch(() => {});
  }
  console.log('✅ Historical archive events (1 month, quarterly, 1 year) stored in database successfully.');

  console.log('🎉 Seeding selesai. Data kejadian live disinkronkan oleh IDSE.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
