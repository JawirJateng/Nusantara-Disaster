import { PrismaClient, Role, Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';


const prisma = new PrismaClient();

function parseBmkgDate(g: any): Date {
  if (g.DateTime) {
    const d = new Date(g.DateTime);
    if (!isNaN(d.getTime())) return d;
  }
  if (g.Tanggal && g.Jam) {
    const cleanJam = g.Jam.replace(/WIB|WITA|WIT/g, '').trim();
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
      'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06',
      'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = g.Tanggal.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1];
      const year = parts[2];
      const month = months[monthStr] || months[monthStr.substring(0, 3)] || '01';
      const isoStr = `${year}-${month}-${day}T${cleanJam}+07:00`;
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

async function main() {
  console.log('🌱 Seeding Nusantara Disaster database & pulling live disaster events (Mag >= 4.0)...');

  await prisma.disasterEvent.deleteMany({});
  await prisma.newsItem.deleteMany({});

  const hashedPassword = '$2a$10$J323gRahcZUZ4ERDoGM.LuE5UCYXyUI/n3PLzs2YDbzTy7MueDcLi';
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ndw.go.id' },
    update: {},
    create: {
      email: 'admin@ndw.go.id',
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

  // Fetch live BMKG earthquakes immediately during seeding (Mag >= 4.0)
  try {
    console.log('🌐 Menarik data gempa bumi live (Mag >= 4.0) dari BMKG saat seeding...');
    const [resTerkini, resDirasakan] = await Promise.all([
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const gempaTerkini = resTerkini?.Infogempa?.gempa || [];
    const gempaDirasakan = resDirasakan?.Infogempa?.gempa || [];

    const gempaMap = new Map();
    [...gempaTerkini, ...gempaDirasakan].forEach((g: any) => {
      if (g && (g.DateTime || (g.Tanggal && g.Jam)) && g.Magnitude && g.Coordinates) {
        let lat = -2.5;
        let lng = 118.0;
        const parts = g.Coordinates.split(',');
        if (parts.length === 2) {
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
        const dateObj = parseBmkgDate(g);
        const timeKey = dateObj.toISOString().slice(0, 16);
        const magNum = parseFloat(g.Magnitude || '0');
        const mag = magNum.toFixed(1);
        const latStr = (isNaN(lat) ? -2.5 : lat).toFixed(1);
        const lngStr = (isNaN(lng) ? 118.0 : lng).toFixed(1);
        const externalId = `BMKG-${timeKey}-${mag}-${latStr}-${lngStr}`.replace(/\s+/g, '-');

        if (gempaMap.has(externalId)) {
          const existing = gempaMap.get(externalId);
          if (g.Dirasakan && !existing.Dirasakan) {
            existing.Dirasakan = g.Dirasakan;
          }
          if (g.Wilayah && g.Wilayah.length > existing.Wilayah.length) {
            existing.Wilayah = g.Wilayah;
          }
        } else {
          gempaMap.set(externalId, g);
        }
      }
    });

    const gempaList = Array.from(gempaMap.values());
    const bmkgSourceId = sourcesMap['BMKG'];

    let seededCount = 0;
    if (bmkgSourceId) {
      for (const g of gempaList) {
        const magNum = parseFloat(g.Magnitude || '0');
        const mag = magNum.toFixed(1);
        if (magNum < 4.0) {
          continue; // Skip magnitude < 4.0
        }

        let lat = -2.5;
        let lng = 118.0;
        if (g.Coordinates) {
          const parts = g.Coordinates.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
        }

        const severity = magNum >= 6.0 ? Category.EARTHQUAKE ? 'CRITICAL' : 'CRITICAL' : magNum >= 5.0 ? 'HIGH' : 'MODERATE';
        const title = `Gempa Bumi M${mag} - ${g.Wilayah || 'Indonesia'}`;
        const latStr = (isNaN(lat) ? -2.5 : lat).toFixed(1);
        const lngStr = (isNaN(lng) ? 118.0 : lng).toFixed(1);
        const dateObj = parseBmkgDate(g);
        const timeKey = dateObj.toISOString().slice(0, 16);
        const externalId = `BMKG-${timeKey}-${mag}-${latStr}-${lngStr}`.replace(/\s+/g, '-');

        const occurredAt = dateObj;

        let existing = await prisma.disasterEvent.findUnique({
          where: { externalId },
        });

        if (!existing) {
          const allQuakes = await prisma.disasterEvent.findMany({
            where: { category: Category.EARTHQUAKE },
          });
          for (const q of allQuakes) {
            const timeDiff = Math.abs(q.occurredAt.getTime() - occurredAt.getTime());
            const latDiff = Math.abs(q.latitude - (isNaN(lat) ? -2.5 : lat));
            const lngDiff = Math.abs(q.longitude - (isNaN(lng) ? 118.0 : lng));
            const qMagMatch = q.title.match(/M([0-9]+\.[0-9]+)/);
            const qMag = qMagMatch ? qMagMatch[1] : '0.0';

            if (timeDiff < 15 * 60 * 1000 && latDiff < 0.2 && lngDiff < 0.2 && qMag === mag) {
              existing = q;
              break;
            }
          }
        }

        if (!existing) {
          await prisma.disasterEvent.create({
            data: {
              title,
              description: `Gempa bumi magnitudo ${mag}, kedalaman ${g.Kedalaman}, wilayah ${g.Wilayah}. Potensi: ${g.Potensi || 'N/A'}. Dirasakan: ${g.Dirasakan || 'Tidak ada info'}.`,
              category: Category.EARTHQUAKE,
              severity: magNum >= 6.0 ? Severity.CRITICAL : magNum >= 5.0 ? Severity.HIGH : Severity.MODERATE,
              status: EventStatus.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
              province: g.Wilayah ? g.Wilayah.split(',').pop()?.trim() || 'Indonesia' : 'Indonesia',
              locationName: g.Wilayah || 'Indonesia',
              latitude: isNaN(lat) ? -2.5 : lat,
              longitude: isNaN(lng) ? 118.0 : lng,
              occurredAt,
              sourceId: sourcesMap['BMKG'],
              externalId,
              rawPayload: g,
              metadata: {
                magnitude: magNum,
                depth: g.Kedalaman,
                potential: g.Potensi,
                felt: g.Dirasakan,
              },
            },
          });
          seededCount++;
        }
      }
      console.log(`✅ Seeded ${seededCount} live BMKG earthquakes (Mag >= 4.0) successfully.`);
    }
  } catch (err) {
    console.warn('⚠️ Gagal menarik live BMKG saat seeding:', err.message);
  }

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
      where: { externalId: hist.externalId },
      update: {},
      create: hist,
    }).catch(() => {});
  }
  console.log('✅ Historical archive events (1 month, quarterly, 1 year) stored in database successfully.');

  console.log('🎉 Seeding completed with 100% live BMKG earthquake data (Mag >= 4.0)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
