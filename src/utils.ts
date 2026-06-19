import { PatientRecord, VitalsEntry, BalanceCairan } from './types';

// Web App URL untuk mengambil data dari Google Sheets
export const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzmsKMv8Q1B4_Ikfhu6Lz5ZKulIOZnhOiV2_nOMDcXSHwgQ0VvkHzdGoElp3G_LQiagg/exec';

// Web App URL untuk mengirim Masukan dan Saran ke Google Docs
// Ganti dengan URL hasil Publish Web App dari Google Apps Script Anda nanti
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
