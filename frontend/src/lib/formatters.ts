export function detectCategory(eventOrCat: any): string {
  let cat = '';
  let text = '';

  if (typeof eventOrCat === 'string') {
    cat = eventOrCat.toUpperCase().trim();
    text = eventOrCat.toLowerCase();
  } else if (eventOrCat && typeof eventOrCat === 'object') {
    cat = (eventOrCat.category || '').toUpperCase().trim();
    text = `${eventOrCat.title || ''} ${eventOrCat.description || ''} ${eventOrCat.locationName || ''} ${eventOrCat.regency || ''} ${eventOrCat.province || ''} ${cat}`.toLowerCase();
  }

  // 1. Direct match on standard categories or known aliases
  if (cat === 'EARTHQUAKE' || cat === 'GEMPA' || cat === 'GEMPABUMI' || cat === 'SEISMIK') return 'EARTHQUAKE';
  if (cat === 'VOLCANO' || cat === 'GUNUNG_API' || cat === 'GUNUNG' || cat === 'ERUPSI' || cat === 'VULKANIK') return 'VOLCANO';
  if (cat === 'FLOOD' || cat === 'BANJIR' || cat === 'GENANGAN' || cat === 'ROB') return 'FLOOD';
  if (cat === 'LANDSLIDE' || cat === 'LONGSOR' || cat === 'TANAH_LONGSOR') return 'LANDSLIDE';
  if (cat === 'WILDFIRE' || cat === 'FIRE' || cat === 'KEBAKARAN' || cat === 'KARHUTLA' || cat === 'HOTSPOT') return 'WILDFIRE';
  if (cat === 'WEATHER' || cat === 'CUACA' || cat === 'EXTREME_WEATHER' || cat === 'CUACA_EKSTREM') return 'WEATHER';

  // 2. Keyword detection from title/description/location text
  if (text.includes('gempa') || text.includes('tektonik') || text.includes('seismik') || text.includes('tsunami') || text.includes('guncangan')) {
    return 'EARTHQUAKE';
  }
  if (text.includes('gunung') || text.includes('erupsi') || text.includes('vulkanik') || text.includes('magma') || text.includes('merapi') || text.includes('sinabung') || text.includes('semeru') || text.includes('krakatau') || text.includes('lewotobi') || text.includes('marapi') || text.includes('ruang') || text.includes('ibu') || text.includes('lahar')) {
    return 'VOLCANO';
  }
  if (text.includes('banjir') || text.includes('genangan') || text.includes('rob') || text.includes('limpasan') || text.includes('sungai meluap') || text.includes('tanggul jebol') || text.includes('terendam')) {
    return 'FLOOD';
  }
  if (text.includes('longsor') || text.includes('tanah longsor') || text.includes('tebing runtuh') || text.includes('amblas') || text.includes('gerakan tanah')) {
    return 'LANDSLIDE';
  }
  if (text.includes('kebakaran') || text.includes('karhutla') || text.includes('lahan terbakar') || text.includes('hutan terbakar') || text.includes('hotspot') || text.includes('titik api')) {
    return 'WILDFIRE';
  }
  if (text.includes('cuaca') || text.includes('hujan lebat') || text.includes('angin kencang') || text.includes('puting beliung') || text.includes('ekstrem') || text.includes('badai') || text.includes('siklon') || text.includes('gelombang tinggi') || text.includes('petir')) {
    return 'WEATHER';
  }

  return cat || 'OTHER';
}

export function translateCategory(catOrEvent: any): string {
  const upper = detectCategory(catOrEvent);
  switch (upper) {
    case 'EARTHQUAKE':
    case 'GEMPA':
      return 'Gempa Bumi';
    case 'VOLCANO':
    case 'GUNUNG_API':
    case 'ERUPSI':
      return 'Gunung Api';
    case 'FLOOD':
    case 'BANJIR':
      return 'Banjir';
    case 'LANDSLIDE':
    case 'LONGSOR':
      return 'Tanah Longsor';
    case 'WILDFIRE':
    case 'FIRE':
    case 'KEBAKARAN':
    case 'KARHUTLA':
      return 'Kebakaran';
    case 'WEATHER':
    case 'CUACA':
    case 'EXTREME_WEATHER':
      return 'Cuaca Ekstrem';
    default:
      return typeof catOrEvent === 'string' ? catOrEvent : 'Bencana Lainnya';
  }
}

export function translateSeverity(sev: string): string {
  if (!sev) return 'Normal';
  const upper = sev.toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return 'Kritis';
    case 'HIGH':
      return 'Tinggi';
    case 'MODERATE':
      return 'Sedang';
    case 'LOW':
      return 'Rendah';
    default:
      return sev;
  }
}

export function getCategoryIcon(catOrEvent: any): string {
  const upper = detectCategory(catOrEvent);
  switch (upper) {
    case 'EARTHQUAKE':
    case 'GEMPA':
      return '💥';
    case 'VOLCANO':
    case 'GUNUNG_API':
    case 'ERUPSI':
      return '🌋';
    case 'FLOOD':
    case 'BANJIR':
      return '🌊';
    case 'LANDSLIDE':
    case 'LONGSOR':
      return '🪨';
    case 'WILDFIRE':
    case 'FIRE':
    case 'KEBAKARAN':
    case 'KARHUTLA':
      return '🔥';
    case 'WEATHER':
    case 'CUACA':
    case 'EXTREME_WEATHER':
      return '⚡';
    default:
      return '⚠️';
  }
}

export function translateMetadataKey(key: string): string {
  if (!key) return '';
  const lower = key.toLowerCase();
  const map: Record<string, string> = {
    magnitude: 'Magnitudo',
    depth_km: 'Kedalaman (km)',
    felt: 'Intensitas Dirasakan',
    volcano_name: 'Nama Gunung',
    alert_level: 'Status Siaga',
    water_level_cm: 'Tinggi Air (cm)',
    affected_households: 'KK Terdampak',
    road_blocked: 'Akses Jalan Tertutup',
    heavy_machinery_deployed: 'Alat Berat Diterjunkan',
    confidence: 'Tingkat Kepercayaan (%)',
    radiative_power_mw: 'Daya Radiasi (MW)',
    sensor: 'Sensor Satelit',
    wave_height_max_m: 'Tinggi Gelombang Maks (m)',
    wind_speed_knots: 'Kecepatan Angin (Knot)',
    simulated: 'Simulasi Sistem',
  };
  if (map[lower]) return map[lower];
  return key.replace(/_/g, ' ');
}

export function translateMetadataValue(val: any): string {
  if (typeof val === 'boolean') {
    return val ? 'Ya' : 'Tidak';
  }
  if (val === null || val === undefined) {
    return '-';
  }
  return String(val);
}
