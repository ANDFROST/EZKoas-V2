import { PatientRecord, VitalsEntry, BalanceCairan, SpreadsheetRow } from './types';
// 1. Web App URL untuk mengambil identitas pasien di pasien baru database
export const GOOGLE_SHEETS_PATIENT_DB_URL = 'https://script.google.com/macros/s/AKfycbwSfq24sW60zArOA0pOFe9Sa8LS33ISp4UhKtVY6vrma2xA6x2-LaryJSBBU5rrX6fw6g/exec';

// 2. Web App URL untuk import data pasien dari database
export const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzmsKMv8Q1B4_Ikfhu6Lz5ZKulIOZnhOiV2_nOMDcXSHwgQ0VvkHzdGoElp3G_LQiagg/exec';

// 3. Web App URL untuk mengirimkan hasil TTV apapun setelah simpan atau update
export const GOOGLE_SHEETS_TTV_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzWCKBqHWW6u5yRjwvmMFRz7Lk52QBaBMeXQK50v_UayuXKqoU_a9E7gDJzQmcdfhpX_A/exec';

// 4. Web App URL untuk mengirim Masukan dan Saran
export const GOOGLE_DOCS_FEEDBACK_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzkyVkNZYrddec7XN6fvz5cLV_illz_j9JZQ5l6aLlSizq-MlWUCt43CtVmL2HeLGRu/exec';

// Normalisasi jenis kelamin
export function normalizeGender(val: string): 'Laki-laki (L)' | 'Perempuan (P)' {
  const lower = val.trim().toLowerCase();
  if (lower.startsWith('l') || lower.includes('laki') || lower.includes('pria')) {
    return 'Laki-laki (L)';
  }
  if (lower.startsWith('p') || lower.includes('perempuan') || lower.includes('wanita')) {
    return 'Perempuan (P)';
  }
  return 'Laki-laki (L)';
}

// Format waktu saat ini atau input
export function formatTime(input: string): string {
  const s = input.trim();
  if (!s) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // ISO datetime seperti 1899-12-30T01:32:00Z
  const isoMatch = s.match(/\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1].padStart(2, '0')}:${isoMatch[2].padStart(2, '0')}`;
  }

  // Cari HH:MM pertama
  const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(1, '0').padStart(2, '0')}`;
  }

  // Gantian titik dengan titik dua
  const sanitized = s.replace(/\./g, ':');
  const parts = sanitized.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].trim().padStart(2, '0');
    let mm = parts[1].trim();
    mm = mm.length === 1 ? `0${mm}` : mm.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return s;
}

// Pembantu pembersihan kata
function stripTd(raw: string): string {
  return raw.replace(/mmhg/gi, '').trim();
}

function stripNumber(raw: string): string {
  return raw.replace(/[^0-9.,]/g, '').replace(/,/g, '.').trim();
}

function normalizeAge(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '';
  if (/^[0-9]+\s*(thn|tahun)?$/i.test(cleaned)) {
    const number = cleaned.match(/^[0-9]+/)?.[0] || cleaned;
    return `${number} thn`;
  }
  return cleaned;
}

export function formatSP(sp?: import('./types').SuaraPernapasan): string {
  if (!sp || !sp.type) return '';
  const abnormalities: string[] = [];
  
  const regionsMap: Record<string, string> = {
    apexRight: 'apex hemitoraks kanan',
    midRight: 'medial hemitoraks kanan',
    lowerRight: 'basal hemitoraks kanan',
    apexLeft: 'apex hemitoraks kiri',
    midLeft: 'medial hemitoraks kiri',
    lowerLeft: 'basal hemitoraks kiri'
  };

  const getSpLocationString = (regions: string[]) => {
    const rightRegions = regions.filter(r => r.endsWith('Right'));
    const leftRegions = regions.filter(r => r.endsWith('Left'));

    const res: string[] = [];

    if (rightRegions.length === 3 && leftRegions.length === 3) {
      return 'bilateral';
    }

    // Sinistra first
    if (leftRegions.length === 3) {
      res.push('hemithoraks kiri');
    } else {
      res.push(...leftRegions.map(r => regionsMap[r]));
    }

    // Dextra second
    if (rightRegions.length === 3) {
      res.push('hemithoraks kanan');
    } else {
      res.push(...rightRegions.map(r => regionsMap[r]));
    }

    return res.join(', ');
  };

  const melemahRegions = Object.keys(sp.regions).filter((k) => sp.regions[k as import('./types').LungRegion] === 'Melemah');
  const menguatRegions = Object.keys(sp.regions).filter((k) => sp.regions[k as import('./types').LungRegion] === 'Menguat');

  const melemahStr = getSpLocationString(melemahRegions);
  const menguatStr = getSpLocationString(menguatRegions);

  if (melemahStr) abnormalities.push(`melemah di ${melemahStr}`);
  if (menguatStr) abnormalities.push(`menguat di ${menguatStr}`);

  if (abnormalities.length > 0) {
    return `${sp.type} (${abnormalities.join(' dan ')})`;
  }
  return sp.type;
}

export function formatST(st?: import('./types').SuaraTambahan): string {
  if (!st) return '';
  const parts: string[] = [];
  
  // Rh and Wh always shown — format: (sinistra/dextra)
  parts.push(`Rh (${st.rh.left ? '+' : '-'}/${st.rh.right ? '+' : '-'})`);
  parts.push(`Wh (${st.wh.left ? '+' : '-'}/${st.wh.right ? '+' : '-'})`);

  // PFR only shown if positive
  if (st.pleuralFrictionRub.left || st.pleuralFrictionRub.right) {
    parts.push(`PFR (${st.pleuralFrictionRub.left ? '+' : '-'}/${st.pleuralFrictionRub.right ? '+' : '-'})`);
  }

  // Stridor only shown if positive
  if (st.stridor.left || st.stridor.right) {
    parts.push(`Stridor (${st.stridor.left ? '+' : '-'}/${st.stridor.right ? '+' : '-'})`);
  }

  // Hippocrates Succusion only shown if positive
  if (st.hippocratesSuccusion.left || st.hippocratesSuccusion.right) {
    parts.push(`HS (${st.hippocratesSuccusion.left ? '+' : '-'}/${st.hippocratesSuccusion.right ? '+' : '-'})`);
  }

  return parts.join(', ');
}

// Konversi vitals ke string EZKOAS yang diformat
export function formatVitalsEntry(v: VitalsEntry): string {
  const lines: string[] = [];

  if (v.time) lines.push(`(${v.time})`);
  if (v.keluhan) lines.push(`Keluhan: ${v.keluhan}`);

  if (v.sens || v.gcs) {
    let sensLabel = v.sens;
    if (v.sens === 'Compos mentis') {
      sensLabel = 'CM';
    } else if (v.sens === 'Dalam Penggunaan Obat (DPO)') {
      sensLabel = 'DPO';
    }

    if (sensLabel && v.gcs) {
      lines.push(`Sens: ${sensLabel} ${v.gcs}`);
    } else if (sensLabel) {
      lines.push(`Sens: ${sensLabel}`);
    } else if (v.gcs) {
      lines.push(`Sens: ${v.gcs}`);
    }
  }

  if (v.bp) lines.push(`TD: ${v.bp} mmHg`);
  if (v.hr) lines.push(`HR: ${v.hr} x/i`);
  if (v.rr) lines.push(`RR: ${v.rr} x/i`);

  if (v.spo2) {
    let o2Abbr = '';
    if (v.o2Method === 'Room Air (RA)') o2Abbr = 'RA';
    else if (v.o2Method === 'Nasal Cannula (NK)') o2Abbr = 'NK';
    else if (v.o2Method === 'Non Rebreathing Mask (NRM)') o2Abbr = 'NRM';
    else if (v.o2Method === 'Trakeostomi') o2Abbr = 'Trakeostomi';
    else if (v.o2Method === 'Ventilator') o2Abbr = 'Ventilator';

    if (v.o2Method === 'Room Air (RA)' || v.o2Method === 'Ventilator') {
      lines.push(`SpO2: ${v.spo2}% ${o2Abbr}`);
    } else {
      const lpmStr = v.lpm ? ` ${v.lpm} lpm` : '';
      lines.push(`SpO2: ${v.spo2}% on ${o2Abbr}${lpmStr}`);
    }
  }

  if (v.temp) lines.push(`Temp: ${v.temp} C`);
  if (v.isGdsChecked && v.gdsValue) lines.push(`GDS: ${v.gdsValue} mg/dL`);

  if (v.sp) {
    const spStr = formatSP(v.sp);
    if (spStr) lines.push(`SP: ${spStr}`);
  }
  
  if (v.st) {
    const stStr = formatST(v.st);
    if (stStr) lines.push(`ST: ${stStr}`);
  }

  if (v.isOnIVDrug && v.ivDrugNames.length > 0) {
    for (let i = 0; i < v.ivDrugNames.length; i++) {
      const rate = v.ivDrugRates && v.ivDrugRates[i] ? ` ${v.ivDrugRates[i]} cc/jam` : '';
      lines.push(`Terpasang ${v.ivDrugNames[i]}${rate}`);
    }
  }

  if (v.isUopChecked && v.uopValue) {
    lines.push(`UOP: ${v.uopValue} cc/24j`);
  }

  let base = lines.join('\n');

  if (v.balanceCairan) {
    const b = v.balanceCairan;
    const intake = b.makanValue + b.minumValue + b.ivfdValue + b.transfusiValue + b.syringePumpValue;
    const output = b.babValue + b.uopValue + b.muntahValue + (b.iwl ? b.iwlValue : 0);
    const balance = intake - output;

    const sb: string[] = [];
    sb.push(`\n*Intake: ${intake}*`);
    sb.push(`Makan: ${b.makanValue} cc`);
    sb.push(`Minum: ${b.minumValue} cc`);
    sb.push(`IVFD: ${b.ivfdValue} cc`);
    if (b.transfusiValue > 0) sb.push(`Transfusi: ${b.transfusiValue} cc`);
    if (b.syringePumpValue > 0) sb.push(`Syringe Pump: ${b.syringePumpValue} cc`);

    sb.push('');
    sb.push(`*Output: ${output}*`);
    if (b.babValue > 0) sb.push(`BAB: ${b.babValue} cc`);
    if (b.uopValue > 0) sb.push(`UOP: ${b.uopValue} cc`);
    if (b.muntahValue > 0) sb.push(`Muntah: ${b.muntahValue} cc`);
    if (b.iwl && b.iwlValue > 0) sb.push(`IWL: ${b.iwlValue} cc`);

    sb.push('');
    sb.push(`*Balance Cairan = ${balance} cc*`);

    base = (base + '\n' + sb.join('\n')).trim();
  }

  return base;
}

// Gabung daftar nama follow up ketat
function joinFollowNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} dan ${names[1]}`;
  const last = names[names.length - 1];
  const prefix = names.slice(0, -1).join(', ');
  return `${prefix}, dan ${last}`;
}

// Bikin ringkasan follow up ketat
export function buildFollowKetatSummary(p: PatientRecord): string {
  const groups: Record<string, string[]> = {};

  const add = (interval: string, label: string) => {
    if (!groups[interval]) groups[interval] = [];
    groups[interval].push(label);
  };

  if (p.isFollowTtv) add(p.followTtvInterval, 'TTV');
  if (p.isFollowGds) add(p.followGdsInterval, 'GDS');
  if (p.isFollowUop) add(p.followUopInterval, 'UOP');
  if (p.isFollowBalance) add(p.followBalanceInterval, 'Balance Cairan');

  const intervals = Object.keys(groups);
  if (intervals.length === 0) return '';

  const parts = intervals.map((interval) => {
    const names = joinFollowNames(groups[interval]);
    return `${names} per ${interval.toLowerCase()}`;
  });

  return parts.join(', ');
}

// Konversi PatientRecord ke string EZKOAS lengkap
export function formatPatientRecord(p: PatientRecord): string {
  const headerParts: string[] = [];

  if (p.room && p.rm) {
    headerParts.push(`${p.room} / ${p.rm}`);
  } else {
    if (p.room) headerParts.push(p.room);
    if (p.rm) headerParts.push(p.rm);
  }

  if (p.name) headerParts.push(p.name);
  headerParts.push(p.gender === 'Laki-laki (L)' ? 'L' : 'P');

  if (p.age) {
    const ageLower = p.age.toLowerCase();
    const hasTimeUnit = ageLower.includes('th') || ageLower.includes('bl') || ageLower.includes('hr');
    const ageStr = hasTimeUnit ? p.age : `${p.age} thn`;
    headerParts.push(ageStr);
  }

  if (p.weight) {
    headerParts.push(`${p.weight} kg`);
  }

  if (p.height) {
    headerParts.push(`${p.height} cm`);
  }

  const followSummary = buildFollowKetatSummary(p);
  if (followSummary) {
    headerParts.push(followSummary);
  }

  const header = headerParts.join(' / ');
  const sortedVitals = [...p.vitals].sort((a, b) => a.createdAt - b.createdAt);
  const vitalsStr = sortedVitals.map((v) => formatVitalsEntry(v)).join('\n\n');

  return `${header}\n\nTTV\n${vitalsStr}`.trim();
}

// --- PARSER UNTUK CLIPBOARD ---
function extractInterval(text: string): string | null {
  const match = text.match(/(\d+\s*(?:jam|menit))/i);
  return match ? match[1].trim() : null;
}

function parseFollowSummary(summary: string) {
  const data = {
    ttv: false,
    gds: false,
    uop: false,
    balance: false,
    ttvInterval: '3 Jam',
    gdsInterval: '3 Jam',
    uopInterval: '3 Jam',
    balanceInterval: '3 Jam',
  };

  const parts = summary.split(',');
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower.includes('ttv')) {
      data.ttv = true;
      data.ttvInterval = extractInterval(lower) || '3 Jam';
    }
    if (lower.includes('gds')) {
      data.gds = true;
      data.gdsInterval = extractInterval(lower) || '3 Jam';
    }
    if (lower.includes('uop')) {
      data.uop = true;
      data.uopInterval = extractInterval(lower) || '3 Jam';
    }
    if (lower.includes('balance') || lower.includes('cairan')) {
      data.balance = true;
      data.balanceInterval = extractInterval(lower) || '3 Jam';
    }
  }

  return data;
}

function parseSensAndGcs(raw: string) {
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { sens: '', gcs: '' };
  }
  const last = parts[parts.length - 1];
  const gcsValue = /^[0-9]{1,2}$/.test(last) ? last : last.replace(/[^0-9]/g, '');
  if (gcsValue && !isNaN(parseInt(gcsValue, 10))) {
    return {
      sens: parts.slice(0, -1).join(' ').trim(),
      gcs: gcsValue,
    };
  }
  return { sens: raw, gcs: '' };
}

function normalizeO2Method(raw: string): VitalsEntry['o2Method'] {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('room') || lower === 'ra') {
    return 'Room Air (RA)';
  }
  if (lower.includes('nasal') || lower === 'nk') {
    return 'Nasal Cannula (NK)';
  }
  if (lower.includes('non') || lower === 'nrm') {
    return 'Non Rebreathing Mask (NRM)';
  }
  if (lower.includes('trake')) {
    return 'Trakeostomi';
  }
  if (lower.includes('vent')) {
    return 'Ventilator';
  }
  return 'Room Air (RA)';
}

function parseSpo2Line(raw: string) {
  let spo2 = '';
  let o2Method: VitalsEntry['o2Method'] = 'Room Air (RA)';
  let lpm = '';

  const spo2Match = raw.match(/([0-9]{1,3})\s*%/);
  let remain = raw;
  if (spo2Match) {
    spo2 = spo2Match[1];
    remain = raw.substring(spo2Match.index! + spo2Match[0].length).trim();
  }

  if (remain) {
    const methodMatch = remain.match(/(RA|NK|NRM|Trakeostomi|Ventilator|Room Air|Nasal Cannula|Non Rebreathing Mask)/i);
    if (methodMatch) {
      o2Method = normalizeO2Method(methodMatch[0]);
    }
    const lpmMatch = remain.match(/([0-9]+(?:\.[0-9]+)?)\s*lpm/i);
    if (lpmMatch) {
      lpm = lpmMatch[1];
    }
  }

  return { spo2, o2Method, lpm };
}

function parseVitalsEntryLines(lines: string[]): VitalsEntry | null {
  let time = '';
  let keluhan = '';
  let bp = '';
  let sens = '';
  let gcs = '';
  let hr = '';
  let rr = '';
  let spo2 = '';
  let o2Method: VitalsEntry['o2Method'] = 'Room Air (RA)';
  let lpm = '';
  let temp = '';
  let isGdsChecked = false;
  let gdsValue = '';
  let isOnIVDrug = false;
  const ivDrugNames: string[] = [];
  const ivDrugRates: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('(') && line.includes(')')) {
      time = line.substring(1, line.indexOf(')')).trim();
      continue;
    }
    if (line.toLowerCase().startsWith('keluhan:')) {
      keluhan = line.substring(8).trim();
      continue;
    }
    if (line.toLowerCase().startsWith('sens:')) {
      const rawData = line.substring(5).trim();
      const sensGcs = parseSensAndGcs(rawData);
      sens = sensGcs.sens;
      gcs = sensGcs.gcs;

      // Map back abbreviations to user-friendly options
      if (sens === 'CM' || sens === 'cm') {
        sens = 'Compos mentis';
      } else if (sens === 'DPO' || sens === 'dpo') {
        sens = 'Dalam Penggunaan Obat (DPO)';
      }
      continue;
    }
    if (line.toLowerCase().startsWith('td:')) {
      bp = stripTd(line.substring(3).trim());
      continue;
    }
    if (line.toLowerCase().startsWith('hr:')) {
      hr = stripNumber(line.substring(3));
      continue;
    }
    if (line.toLowerCase().startsWith('rr:')) {
      rr = stripNumber(line.substring(3));
      continue;
    }
    if (line.toLowerCase().startsWith('spo2:')) {
      const parsed = parseSpo2Line(line.substring(5).trim());
      spo2 = stripNumber(parsed.spo2);
      o2Method = parsed.o2Method;
      lpm = stripNumber(parsed.lpm);
      continue;
    }
    if (line.toLowerCase().startsWith('temp:')) {
      temp = stripNumber(line.substring(5));
      continue;
    }
    if (line.toLowerCase().startsWith('gds:')) {
      const rawData = line.substring(4);
      gdsValue = stripNumber(rawData);
      isGdsChecked = !!gdsValue;
      continue;
    }
    if (line.toLowerCase().startsWith('terpasang')) {
      const content = line.substring(9).trim();
      const rateMatch = content.match(/([0-9]+(?:[\.,][0-9]+)?)\s*cc\/jam/i);
      let rate = '';
      let name = content;
      if (rateMatch) {
        rate = rateMatch[1] || '';
        name = content.substring(0, rateMatch.index).trim();
        rate = rate.replace(/,/g, '.');
      }
      if (name) {
        isOnIVDrug = true;
        ivDrugNames.push(name);
        ivDrugRates.push(rate);
      }
    }
  }

  if (!time && !keluhan && !bp && !hr && !rr && !spo2 && !temp && !gdsValue && ivDrugNames.length === 0) {
    return null;
  }

  return {
    time,
    bp,
    sens,
    gcs,
    hr,
    rr,
    spo2,
    o2Method,
    lpm,
    temp,
    isGdsChecked,
    gdsValue,
    isOnIVDrug,
    ivDrugNames,
    ivDrugRates,
    keluhan,
    createdAt: Date.now(),
  };
}

export function parseClipboardPatient(block: string): PatientRecord | null {
  const rawLines = block.split('\n');
  const lines = rawLines
    .map((line) => line.trim())
    .filter((line) => {
      const lower = line.toLowerCase();
      if (lower === 'or') return false;
      if (lower.startsWith('izin') && lower.includes('atas nama')) return false;
      return !!line;
    });

  if (lines.length === 0) return null;

  const ttvIndex = lines.findIndex((line) => line.toUpperCase() === 'TTV');
  if (ttvIndex === -1 || ttvIndex === 0 || ttvIndex === lines.length - 1) {
    return null;
  }

  const headerLines = lines.slice(0, ttvIndex);
  const vitalsLines = lines.slice(ttvIndex + 1);

  const headerText = headerLines.join(' ');
  const headerParts = headerText
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  let room = '';
  let rm = '';
  let name = '';
  let gender: PatientRecord['gender'] = 'Laki-laki (L)';
  let age = '';
  let followSummary = '';

  if (headerParts.length > 0) {
    const firstTokens = headerParts[0].split(/\s+/).filter(Boolean);
    if (firstTokens.length > 1) {
      const lastToken = firstTokens[firstTokens.length - 1];
      if (/^[0-9]+$/.test(lastToken)) {
        rm = lastToken;
        room = firstTokens.slice(0, -1).join(' ');
      } else {
        room = firstTokens.join(' ');
      }
    } else {
      room = headerParts[0];
    }
  }

  if (headerParts.length > 1) name = headerParts[1];
  if (headerParts.length > 2) gender = normalizeGender(headerParts[2]);
  if (headerParts.length > 3) age = normalizeAge(headerParts[3]);
  if (headerParts.length > 4) followSummary = headerParts.slice(4).join(' / ');

  const followData = parseFollowSummary(followSummary);

  const vitals: VitalsEntry[] = [];
  const parsedVitals = parseVitalsEntryLines(vitalsLines);
  if (parsedVitals) {
    vitals.push(parsedVitals);
  }

  if (!name && !rm) {
    return null;
  }

  return {
    room,
    rm,
    name,
    gender,
    age,
    isFollowTtv: followData.ttv,
    followTtvInterval: followData.ttvInterval,
    isFollowGds: followData.gds,
    followGdsInterval: followData.gdsInterval,
    isFollowUop: followData.uop,
    followUopInterval: followData.uopInterval,
    isFollowBalance: followData.balance,
    followBalanceInterval: followData.balanceInterval,
    vitals: vitals.length > 0 ? vitals : [
      {
        time: '',
        bp: '',
        sens: '',
        gcs: '',
        hr: '',
        rr: '',
        spo2: '',
        o2Method: 'Room Air (RA)',
        lpm: '',
        temp: '',
        isGdsChecked: false,
        gdsValue: '',
        isOnIVDrug: false,
        ivDrugNames: [],
        ivDrugRates: [],
        keluhan: '',
        createdAt: Date.now(),
      }
    ]
  };
}

export function parseClipboardPatients(text: string): PatientRecord[] {
  const cleaned = text.replace(/\r/g, '');
  const blocks = cleaned
    .split(/\n\s*[-]{3,}\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const patients: PatientRecord[] = [];
  for (const block of blocks) {
    const patient = parseClipboardPatient(block);
    if (patient) {
      patients.push(patient);
    }
  }
  return patients;
}

// Safe field checks
export const getRowValue = (row: SpreadsheetRow, keys: string[]): string => {
  for (const key of keys) {
    const val = (row as any)[key];
    if (val !== undefined && val !== null) {
      const text = String(val).trim();
      if (text) return text;
    }
  }
  return '';
};

// Convert standard date string to DD/MM/YY
export const formatSheetDate = (value: string): string => {
  const normalized = value.replace(/\//g, '-').replace(/\./g, '-').trim();
  const parsed = Date.parse(normalized);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear()).substring(2);
    return `${dd}/${mm}/${yy}`;
  }
  return value;
};

// Convert Sheet row structure back to typed PatientRecord
export const mapSheetRowToPatient = (row: SpreadsheetRow): PatientRecord => {
  const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']);
  const rmVal = getRowValue(row, ['No RM', 'No. RM', 'RM']);
  const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']);
  const ageVal = getRowValue(row, ['Umur', 'Age', 'Usia']);
  const genderVal = normalizeGender(getRowValue(row, ['Jenis Kelamin', 'Gender', 'Sex']));

  const isFollowTtv = getRowValue(row, ['FollowTtv', 'Follow TTV', 'isFollowTtv']).toLowerCase() === 'true' || getRowValue(row, ['FollowTtv', 'Follow TTV', 'isFollowTtv']).toLowerCase() === 'ya';
  const isFollowGds = getRowValue(row, ['FollowGds', 'Follow GDS', 'isFollowGds']).toLowerCase() === 'true' || getRowValue(row, ['FollowGds', 'Follow GDS', 'isFollowGds']).toLowerCase() === 'ya';
  const isFollowUop = getRowValue(row, ['FollowUop', 'Follow UOP', 'isFollowUop']).toLowerCase() === 'true' || getRowValue(row, ['FollowUop', 'Follow UOP', 'isFollowUop']).toLowerCase() === 'ya';
  const isFollowBalance = getRowValue(row, ['FollowBalance', 'Follow Balance', 'isFollowBalance']).toLowerCase() === 'true' || getRowValue(row, ['FollowBalance', 'Follow Balance', 'isFollowBalance']).toLowerCase() === 'ya';

  const followTtvInterval = getRowValue(row, ['FollowTtvInterval', 'Follow TTV Interval', 'Interval TTV']) || '3 Jam';
  const followGdsInterval = getRowValue(row, ['FollowGdsInterval', 'Follow GDS Interval', 'Interval GDS']) || '3 Jam';
  const followUopInterval = getRowValue(row, ['FollowUopInterval', 'Follow UOP Interval', 'Interval UOP']) || '3 Jam';
  const followBalanceInterval = getRowValue(row, ['FollowBalanceInterval', 'Follow Balance Interval', 'Interval Balance']) || '3 Jam';

  const rawTime = getRowValue(row, ['VitalsTime', 'Waktu', 'Time', 'Waktu TTV']);
  const mappedTime = rawTime ? formatTime(rawTime) : '';

  const bpVal = getRowValue(row, ['BP', 'TD', 'Tekanan Darah']).replace(/mmhg/gi, '').trim();
  const hrVal = getRowValue(row, ['HR', 'Heart Rate']);
  const rrVal = getRowValue(row, ['RR', 'Respiratory Rate']);
  const spo2Val = getRowValue(row, ['SpO2', 'SPO2', 'SpO2%']).replace(/%/g, '').trim();

  const o2MethodVal = getRowValue(row, ['O2Method', 'O2 Method', 'Metode O2']);
  let mapO2: VitalsEntry['o2Method'] = 'Room Air (RA)';
  if (o2MethodVal.toLowerCase().includes('nasal') || o2MethodVal.toLowerCase().includes('nk')) mapO2 = 'Nasal Cannula (NK)';
  if (o2MethodVal.toLowerCase().includes('non') || o2MethodVal.toLowerCase().includes('nrm')) mapO2 = 'Non Rebreathing Mask (NRM)';
  if (o2MethodVal.toLowerCase().includes('trake')) mapO2 = 'Trakeostomi';
  if (o2MethodVal.toLowerCase().includes('vent')) mapO2 = 'Ventilator';

  const lpmVal = getRowValue(row, ['LPM', 'Lpm', 'flow']).replace(/[^0-9.]/g, '');
  const tempVal = getRowValue(row, ['Temp', 'Temperature', 'Suhu']).replace(/[^0-9.]/g, '');

  const gdsChecked = getRowValue(row, ['GDSChecked', 'isGdsChecked', 'Cek GDS']).toLowerCase() === 'true' || getRowValue(row, ['GDSChecked', 'isGdsChecked', 'Cek GDS']).toLowerCase() === 'ya';
  const gdsV = getRowValue(row, ['GDSValue', 'GDS', 'Nilai GDS']).replace(/[^0-9.]/g, '');

  const uopChecked = getRowValue(row, ['Cek UOP', 'UOPChecked', 'isUopChecked']).toLowerCase() === 'true' || getRowValue(row, ['Cek UOP', 'UOPChecked', 'isUopChecked']).toLowerCase() === 'ya';
  const uopV = getRowValue(row, ['Nilai UOP', 'UOPValue', 'UOP']).replace(/[^0-9.]/g, '');

  const isOnIV = getRowValue(row, ['IsOnIVDrug', 'OnIVDrug', 'isOnIVDrug', 'Pakai Obat IV']).toLowerCase() === 'true' || getRowValue(row, ['IsOnIVDrug', 'OnIVDrug', 'isOnIVDrug', 'Pakai Obat IV']).toLowerCase() === 'ya';

  // Parse semicolon list for IV medications
  const rawIvNames = getRowValue(row, ['IVDrugNames', 'IV Drug Names', 'Nama Obat IV', 'ivDrugNames']);
  const rawIvRates = getRowValue(row, ['IVDrugRates', 'IV Drug Rates', 'Rate Obat IV', 'ivDrugRates', 'Rate IV', 'Rate', 'Dosis', 'Dosis Obat IV', 'Dosis Obat', 'Rate Obat', 'Rate (cc/jam)', 'Dosis (cc/jam)', 'Kecepatan', 'Rate Obat IV (cc/jam)']);

  const ivDrugNames = rawIvNames ? rawIvNames.split(/[;|/]+/).map((s) => s.trim()).filter(Boolean) : [];
  const ivDrugRates = rawIvRates ? rawIvRates.split(/[;|/]+/).map((s) => s.trim().replace(/,/g, '.')).filter(Boolean) : [];

  const keluhanVal = getRowValue(row, ['Keluhan', 'Complaint', 'Notes']);

  const bcMakanValue = Number(getRowValue(row, ['BC Makan Value (cc)', 'bcMakanValue'])) || 0;
  const bcMinumValue = Number(getRowValue(row, ['BC Minum Value (cc)', 'bcMinumValue'])) || 0;
  const bcIvfdValue = Number(getRowValue(row, ['BC IVFD Value (cc)', 'bcIvfdValue'])) || 0;
  const bcTransfusiValue = Number(getRowValue(row, ['BC Transfusi Value (cc)', 'bcTransfusiValue'])) || 0;
  const bcSyringePumpValue = Number(getRowValue(row, ['BC Syringe Pump Value (cc)', 'bcSyringePumpValue'])) || 0;
  const bcBabValue = Number(getRowValue(row, ['BC BAB Value (cc)', 'bcBabValue'])) || 0;
  const bcUopValue = Number(getRowValue(row, ['BC UOP Value (cc)', 'bcUopValue'])) || 0;
  const bcMuntahValue = Number(getRowValue(row, ['BC Muntah Value (cc)', 'bcMuntahValue'])) || 0;
  const iwl = getRowValue(row, ['BC Ada IWL', 'bcIwl']).toLowerCase() === 'ya' || getRowValue(row, ['BC Ada IWL', 'bcIwl']).toLowerCase() === 'true';
  const bcIwlValue = Number(getRowValue(row, ['BC IWL Value (cc)', 'bcIwlValue'])) || 0;

  const hasBalanceData = bcMakanValue > 0 || bcMinumValue > 0 || bcIvfdValue > 0 || bcTransfusiValue > 0 || bcSyringePumpValue > 0 || bcBabValue > 0 || bcUopValue > 0 || bcMuntahValue > 0 || iwl || bcIwlValue > 0;

  const entry: VitalsEntry = {
    time: mappedTime,
    bp: bpVal,
    sens: getRowValue(row, ['Sens', 'Sensitivity']),
    gcs: getRowValue(row, ['GCS', 'Glasgow']),
    hr: hrVal,
    rr: rrVal,
    spo2: spo2Val,
    o2Method: mapO2,
    lpm: lpmVal,
    temp: tempVal,
    isGdsChecked: gdsChecked || !!gdsV,
    gdsValue: gdsV,
    isUopChecked: uopChecked || !!uopV,
    uopValue: uopV,
    isOnIVDrug: isOnIV || ivDrugNames.length > 0,
    ivDrugNames,
    ivDrugRates,
    keluhan: keluhanVal,
    createdAt: Date.now(),
    ...(hasBalanceData && {
      balanceCairan: {
        makanType: (getRowValue(row, ['BC Makan Type', 'bcMakanType']) as any) || 'Makan',
        makanCount: Number(getRowValue(row, ['BC Makan Count', 'bcMakanCount'])) || 0,
        makanValue: bcMakanValue,
        minumOption: (getRowValue(row, ['BC Minum Option', 'bcMinumOption']) as any) || 'None',
        minumValue: bcMinumValue,
        ivfdOption: (getRowValue(row, ['BC IVFD Option', 'bcIvfdOption']) as any) || 'None',
        ivfdValue: bcIvfdValue,
        transfusiBags: Number(getRowValue(row, ['BC Transfusi Bags', 'bcTransfusiBags'])) || 0,
        transfusiValue: bcTransfusiValue,
        syringePumpCc: Number(getRowValue(row, ['BC Syringe Pump Cc', 'bcSyringePumpCc'])) || 0,
        syringePumpValue: bcSyringePumpValue,
        babType: (getRowValue(row, ['BC BAB Type', 'bcBabType']) as any) || 'Keras/biasa',
        babCount: Number(getRowValue(row, ['BC BAB Count', 'bcBabCount'])) || 0,
        babValue: bcBabValue,
        uopOption: (getRowValue(row, ['BC UOP Option', 'bcUopOption']) as any) || 'None',
        uopValue: bcUopValue,
        muntahCount: Number(getRowValue(row, ['BC Muntah Count', 'bcMuntahCount'])) || 0,
        muntahValue: bcMuntahValue,
        iwl: iwl,
        iwlValue: bcIwlValue,
      }
    })
  };

  return {
    room: roomVal,
    rm: rmVal,
    name: nameVal,
    gender: genderVal,
    age: ageVal,
    weight: getRowValue(row, ['Berat Badan', 'Weight']),
    height: getRowValue(row, ['Tinggi Badan', 'Height']),
    isFollowTtv,
    followTtvInterval,
    isFollowGds,
    followGdsInterval,
    isFollowUop,
    followUopInterval,
    isFollowBalance,
    followBalanceInterval,
    vitals: [entry]
  };
};
