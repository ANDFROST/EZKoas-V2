import React, { useState } from 'react';
import { PatientRecord, VitalsEntry } from '../types';
import { formatPatientRecord, formatVitalsEntry } from '../utils';
import { Reorder, motion, useDragControls } from 'motion/react';
import {
  User,
  Activity,
  Plus,
  Copy,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Heart,
  Droplet,
  Thermometer,
  ShieldAlert,
  SlidersHorizontal,
  ArrowUpDown,
  GripVertical
} from 'lucide-react';

const patientIdMap = new WeakMap<PatientRecord, string>();
let lastId = 0;
const getPatientId = (p: PatientRecord) => {
  if (!patientIdMap.has(p)) {
    lastId++;
    patientIdMap.set(p, `p-id-${lastId}-${p.name || ''}`);
  }
  return patientIdMap.get(p)!;
};

const vitalIdMap = new WeakMap<VitalsEntry, string>();
let lastVitalId = 0;
const getVitalId = (vt: VitalsEntry) => {
  if (!vitalIdMap.has(vt)) {
    lastVitalId++;
    vitalIdMap.set(vt, `v-id-${lastVitalId}-${vt.createdAt || vt.time || Date.now()}`);
  }
  return vitalIdMap.get(vt)!;
};

const normalizeRoom = (room: string) => {
  const clean = (room || '').toUpperCase().replace(/\s+/g, ' ').trim();

  const prefixPositions: Record<string, number> = {
    'RA1': 0,
    'RA1 PSI': 1,
    'RA2': 2,
    'RA3': 3,
    'HCU': 4,
    'RA4': 5,
    'RA5': 6,
    'RA6': 7,
    'RB1': 8,
    'RB2': 9,
    'RB3': 10,
    'RB4': 11,
    'RB5': 12,
    'RB6': 13,
    'ICU': 14,
    'IGD': 15,
    'IGD ICU': 16,
    'IGD PERALIHAN': 17,
    'PAVI': 18,
    'PJT': 19
  };

  let normalizedClean = clean;
  const prefixesToConnect = ['RA', 'RB', 'HCU', 'ICU', 'PAVI', 'PJT', 'IGD'];
  for (const pfx of prefixesToConnect) {
    const regex = new RegExp('\\b' + pfx + '\\s+(\\d+)\\b', 'gi');
    normalizedClean = normalizedClean.replace(regex, pfx + '$1');
  }

  // Also replace double spaces to single spaces again just in case
  normalizedClean = normalizedClean.replace(/\s+/g, ' ').trim();

  let matchedPrefix = '';
  let longestLength = 0;

  for (const pfx of Object.keys(prefixPositions)) {
    if (normalizedClean.includes(pfx)) {
      if (pfx.length > longestLength) {
        matchedPrefix = pfx;
        longestLength = pfx.length;
      }
    }
  }

  let prefixIndex = 999;
  if (matchedPrefix) {
    prefixIndex = prefixPositions[matchedPrefix];
  }

  const digitsMatch = normalizedClean.match(/\d+/);
  let numberVal = Infinity;
  if (digitsMatch) {
    numberVal = parseInt(digitsMatch[0], 10);
  }

  return {
    prefixIndex,
    numberVal,
    suffix: normalizedClean
  };
};

const compareRooms = (roomA: string, roomB: string) => {
  const infoA = normalizeRoom(roomA);
  const infoB = normalizeRoom(roomB);

  if (infoA.prefixIndex !== infoB.prefixIndex) {
    return infoA.prefixIndex - infoB.prefixIndex;
  }
  if (infoA.numberVal !== infoB.numberVal) {
    return infoA.numberVal - infoB.numberVal;
  }
  return infoA.suffix.localeCompare(infoB.suffix);
};

interface PatientListProps {
  patients: PatientRecord[];
  onAddVitals: (patientIdx: number) => void;
  onEditVitals: (patientIdx: number, vitalsIdx: number) => void;
  onDeletePatient: (patientIdx: number) => void;
  onDeleteVitals: (patientIdx: number, vitalsIdx: number) => void;
  onReorder: (reordered: PatientRecord[]) => void;
  showNotification: (msg: string, type: 'success' | 'dev' | 'error') => void;
  filterFolketOnly?: boolean;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onAddVitals,
  onEditVitals,
  onDeletePatient,
  onDeleteVitals,
  onReorder,
  showNotification,
  filterFolketOnly
}) => {
  const [expandedPatientIdxs, setExpandedPatientIdxs] = useState<Record<number, boolean>>({});
  const [sortCriteria, setSortCriteria] = useState<'alphabet' | 'room' | 'newest' | 'manual'>('manual');
  const [tempSortCriteria, setTempSortCriteria] = useState<'alphabet' | 'room' | 'newest' | 'manual'>('manual');
  const [showSortScreen, setShowSortScreen] = useState(false);

  const handleOpenSortScreen = () => {
    setTempSortCriteria(sortCriteria);
    setShowSortScreen(true);
  };

  // Local state for dragging patients
  const [localPatients, setLocalPatients] = useState<PatientRecord[]>(patients);

  React.useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  // Collapse / Expand toggle
  const toggleExpand = (idx: number) => {
    setExpandedPatientIdxs((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Select matching active color schemes based on patients
  const getGenderStyle = (gender: PatientRecord['gender']) => {
    if (gender === 'Laki-laki (L)') {
      return {
        bg: 'bg-blue-50 border-blue-100',
        text: 'text-blue-900',
        avatarBg: 'bg-blue-500 text-white',
        roomBadge: 'bg-blue-100/70 text-blue-800'
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-100',
      text: 'text-rose-905',
      avatarBg: 'bg-rose-500 text-white',
      roomBadge: 'bg-rose-100/70 text-rose-800'
    };
  };

  // Sorting handlers
  const sortedPatientsWIndices = React.useMemo(() => {
    let mapped = patients.map((p, idx) => ({ p, originalIdx: idx }));

    if (filterFolketOnly) {
      mapped = mapped.filter(({ p }) => {
        const nameFolket = (p.name || '').toLowerCase().includes('folket');
        const roomFolket = (p.room || '').toLowerCase().includes('folket');
        const keluhanFolket = p.vitals.some(v => (v.keluhan || '').toLowerCase().includes('folket'));
        return nameFolket || roomFolket || keluhanFolket || p.isFollowTtv || p.isFollowGds || p.isFollowUop || p.isFollowBalance;
      });
    }

    if (sortCriteria === 'alphabet') {
      return mapped.sort((a, b) => a.p.name.localeCompare(b.p.name));
    } else if (sortCriteria === 'room') {
      return mapped.sort((a, b) => compareRooms(a.p.room, b.p.room));
    } else if (sortCriteria === 'newest') {
      return mapped.sort((a, b) => {
        const aT = a.p.vitals.length > 0 ? a.p.vitals[a.p.vitals.length - 1].createdAt : 0;
        const bT = b.p.vitals.length > 0 ? b.p.vitals[b.p.vitals.length - 1].createdAt : 0;
        return bT - aT;
      });
    }
    return mapped; // manual default order
  }, [patients, sortCriteria, filterFolketOnly]);

  // Copy single patient details to clipboard
  const copyPatientToClipboard = (p: PatientRecord) => {
    const text = formatPatientRecord(p);
    navigator.clipboard.writeText(text);
    showNotification(`Data ${p.name || 'Pasien'} disalin ke clipboard!`, 'success');
  };

  if (showSortScreen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm font-sans space-y-6 select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-xs shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">Pengaturan Urutan Pasien</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Pilih kriteria penyusunan urutan TTV pasien.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            {
              key: 'manual',
              title: 'Manual Sort',
              desc: 'Atur posisi pasien sesuka Anda secara manual dengan drag and drop.',
              icon: GripVertical,
              colorClass: 'text-amber-600 bg-amber-50 border-amber-200'
            },
            {
              key: 'alphabet',
              title: 'Abjad',
              desc: 'Urutkan daftar pasien secara alfabetis otomatis berdasarkan nama lengkap pasien.',
              icon: User,
              colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200'
            },
            {
              key: 'room',
              title: 'Ruangan',
              desc: 'Urutkan pasien berdasarkan ruangan.',
              icon: ArrowUpDown,
              colorClass: 'text-teal-600 bg-teal-50 border-teal-200'
            },
            {
              key: 'newest',
              title: 'Recency',
              desc: 'Urutkan berdasarkan TTV pasien terbaru',
              icon: Activity,
              colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200'
            }
          ].map((opt) => {
            const IconComp = opt.icon;
            const isSelected = tempSortCriteria === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  setTempSortCriteria(opt.key as any);
                }}
                className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex gap-4 items-start duration-250 ${isSelected
                  ? 'bg-teal-50/40 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
              >
                <div className={`w-11 h-11 rounded-xl shrink-0 border flex items-center justify-center ${opt.colorClass}`}>
                  <IconComp className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800">
                    <span>{opt.title}</span>
                    {isSelected && (
                      <span className="text-[9px] bg-teal-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-normal shrink-0 shadow-xs font-sans">
                        Terpilih
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed font-sans">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button Strip with Apply Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 select-none">
          <button
            onClick={() => setShowSortScreen(false)}
            className="px-4.5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => {
              setSortCriteria(tempSortCriteria);
              setShowSortScreen(false);
              const optNames: Record<string, string> = {
                manual: 'Alur Manual (Grip & Drag)',
                alphabet: 'Abjad',
                room: 'Ruangan',
                newest: 'Recency'
              };
              showNotification(`Urutan pasien berhasil diubah ke: ${optNames[tempSortCriteria]}`, 'success');
            }}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold font-sans rounded-xl transition shadow shadow-teal-600/10 cursor-pointer"
          >
            Terapkan Urutan
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List controls options header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">List Pasien yang Tersimpan ({patients.length})</h2>
        </div>

        {patients.length > 1 && (
          <button
            onClick={handleOpenSortScreen}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold font-sans rounded-xl transition cursor-pointer select-none text-slate-700 shadow-sm shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <span>
              Urutan Pasien:{" "}
              <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-[11px] font-black">
                {sortCriteria === 'manual'
                  ? 'Manual Shift'
                  : sortCriteria === 'alphabet'
                    ? 'Abjad'
                    : sortCriteria === 'room'
                      ? 'Ruangan'
                      : 'Recency'}
              </span>
            </span>
          </button>
        )}
      </div>

      {patients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-sm select-none">
          <FileSpreadsheet className="w-14 h-14 text-slate-300 mx-auto mb-4 animate-bounce" />
          <h3 className="text-sm font-extrabold text-slate-700 font-sans">Belum Ada Pasien Yang Terdata</h3>
          <p className="text-slate-400 text-xs px-4 mt-1 font-sans max-w-sm mx-auto">
            Gunakan tombol tambah pasien baru di atas atau kanal impor untuk mengumpulkan log klinis Anda dengan cepat.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortCriteria === 'manual' && !filterFolketOnly ? (
            <Reorder.Group
              axis="y"
              values={localPatients}
              onReorder={setLocalPatients}
              className="space-y-4"
            >
              {localPatients.map((p, idx) => (
                <PatientCardItem
                  key={getPatientId(p)}
                  p={p}
                  originalIdx={idx}
                  patients={localPatients}
                  isExpanded={!!expandedPatientIdxs[idx]}
                  toggleExpand={toggleExpand}
                  sortCriteria={sortCriteria}
                  onAddVitals={onAddVitals}
                  onEditVitals={onEditVitals}
                  onDeletePatient={onDeletePatient}
                  onDeleteVitals={onDeleteVitals}
                  onReorder={onReorder}
                  showNotification={showNotification}
                  getGenderStyle={getGenderStyle}
                  copyPatientToClipboard={copyPatientToClipboard}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-4">
              {sortedPatientsWIndices.map(({ p, originalIdx }) => (
                <PatientCardItem
                  key={getPatientId(p)}
                  p={p}
                  originalIdx={originalIdx}
                  patients={patients}
                  isExpanded={!!expandedPatientIdxs[originalIdx]}
                  toggleExpand={toggleExpand}
                  sortCriteria={filterFolketOnly && sortCriteria === 'manual' ? ('filtered-manual' as any) : sortCriteria}
                  onAddVitals={onAddVitals}
                  onEditVitals={onEditVitals}
                  onDeletePatient={onDeletePatient}
                  onDeleteVitals={onDeleteVitals}
                  onReorder={onReorder}
                  showNotification={showNotification}
                  getGenderStyle={getGenderStyle}
                  copyPatientToClipboard={copyPatientToClipboard}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PatientCardItemProps {
  p: PatientRecord;
  originalIdx: number;
  patients: PatientRecord[];
  isExpanded: boolean;
  toggleExpand: (idx: number) => void;
  sortCriteria: 'alphabet' | 'room' | 'newest' | 'manual';
  onAddVitals: (patientIdx: number) => void;
  onEditVitals: (patientIdx: number, vitalsIdx: number) => void;
  onDeletePatient: (patientIdx: number) => void;
  onDeleteVitals: (patientIdx: number, vitalsIdx: number) => void;
  onReorder: (reordered: PatientRecord[]) => void;
  showNotification: (msg: string, type: 'success' | 'dev' | 'error') => void;
  getGenderStyle: (gender: PatientRecord['gender']) => any;
  copyPatientToClipboard: (p: PatientRecord) => void;
}

const PatientCardItem: React.FC<PatientCardItemProps> = ({
  p,
  originalIdx,
  patients,
  isExpanded,
  toggleExpand,
  sortCriteria,
  onAddVitals,
  onEditVitals,
  onDeletePatient,
  onDeleteVitals,
  onReorder,
  showNotification,
  getGenderStyle,
  copyPatientToClipboard
}) => {
  const theme = getGenderStyle(p.gender);
  const dragControls = useDragControls();

  // Local state for vitals reordering during drag
  const [localVitals, setLocalVitals] = useState<VitalsEntry[]>(p.vitals);

  React.useEffect(() => {
    setLocalVitals(p.vitals);
  }, [p.vitals]);

  const cardContent = (
    <div className={`bg-white rounded-2xl ${isExpanded ? '' : 'overflow-hidden'} select-none`}>
      {/* Main collapsed header button card visual */}
      <div className="p-4 sm:p-5 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Gender clinical avatar */}
          <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center font-bold text-base ${theme.avatarBg}`}>
            {p.name ? p.name.substring(0, 1).toUpperCase() : 'P'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-800 truncate leading-tight font-sans">
                {p.name || '(Pasien Tanpa Nama)'}
              </h3>
              {/* Gender abbreviation badge */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${p.gender === 'Laki-laki (L)' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                {p.gender === 'Laki-laki (L)' ? 'L' : 'P'}
              </span>
              {p.age && <span className="text-xs text-slate-500 font-semibold">{p.age}</span>}
              {p.weight && <span className="text-[10.5px] bg-slate-100/70 border border-slate-200/50 text-slate-650 px-1.5 py-0.5 rounded-md font-bold font-sans">BB: {p.weight} kg</span>}
              {p.height && <span className="text-[10.5px] bg-slate-100/70 border border-slate-200/50 text-slate-650 px-1.5 py-0.5 rounded-md font-bold font-sans">TB: {p.height} cm</span>}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap font-sans text-xs text-slate-500 font-medium">
              {p.room && (
                <span className={`${theme.roomBadge} text-[10px] font-extrabold tracking-tight px-2 py-0.5 rounded-lg shrink-0`}>
                  🚪 {p.room}
                </span>
              )}
              {p.rm && (
                <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0">
                  RM: {p.rm}
                </span>
              )}
              <span className="text-[10px] shrink-0 font-sans">• {p.vitals.length} TTV</span>

              {/* Folket (Follow Ketat) Indicators */}
              {p.isFollowTtv && <span className="bg-amber-100 text-amber-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-amber-200">TTV {p.followTtvInterval}</span>}
              {p.isFollowGds && <span className="bg-blue-100 text-blue-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-blue-200">GDS {p.followGdsInterval}</span>}
              {p.isFollowUop && <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-emerald-200">UOP {p.followUopInterval}</span>}
              {p.isFollowBalance && <span className="bg-purple-100 text-purple-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-purple-200">Bal {p.followBalanceInterval}</span>}
            </div>
          </div>
        </div>

        {/* Desktop / compact quick control icons */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          {/* Reorder shift handles (shown active only on manual sort Criteria) */}
          {sortCriteria === 'manual' && (
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="p-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
              title="Tarik handle ini untuk mengatur urutan pasien"
            >
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => toggleExpand(originalIdx)}
            className="p-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition text-slate-500 flex items-center justify-center cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Extended Details Area with trend histories and logs list */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/45 divide-y divide-slate-200/60 select-text">
          {/* Horizontal actions sub-header dashboard bar */}
          <div className="px-4 py-3 flex flex-row items-center justify-between gap-1.5 bg-[#f8fafc] select-none">
            <div className="flex flex-row items-center gap-1.5 min-w-0">
              <button
                onClick={() => onAddVitals(originalIdx)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold font-sans rounded-xl transition shadow shadow-emerald-600/10 cursor-pointer shrink-0"
                title="Tambah TTV Baru"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                <span className="hidden sm:inline">Tambah TTV Baru</span>
              </button>
              <button
                onClick={() => copyPatientToClipboard(p)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans rounded-xl transition cursor-pointer shrink-0"
                title="Salin Data Pasien"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Data Pasien Ini</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm(`Hapus seluruh data pasien atas nama ${p.name || 'ini'} secara permanen?`)) {
                  onDeletePatient(originalIdx);
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 sm:px-3 text-rose-600 hover:bg-rose-50 text-xs font-bold font-sans rounded-xl border border-rose-250 transition cursor-pointer shrink-0"
              title="Hapus Pasien"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Pasien</span>
            </button>
          </div>

          {/* Collapsed entries trend list items */}
          <div className="p-4 sm:p-5 select-none">
            {localVitals.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs italic text-slate-450 font-sans">Belum ada riwayat parameter TTV tercatat.</p>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={localVitals}
                onReorder={setLocalVitals}
                className="space-y-3"
              >
                {localVitals.map((vt, vIdx) => (
                  <VitalEntryItem
                    key={getVitalId(vt)}
                    vt={vt}
                    vIdx={vIdx}
                    originalIdx={originalIdx}
                    onEditVitals={onEditVitals}
                    onDeleteVitals={onDeleteVitals}
                    onDragEnd={() => {
                      const updated = [...patients];
                      updated[originalIdx] = {
                        ...p,
                        vitals: localVitals
                      };
                      onReorder(updated);
                      showNotification('Urutan riwayat TTV berhasil diatur ulang!', 'success');
                    }}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (sortCriteria === 'manual') {
    return (
      <Reorder.Item
        value={p}
        dragListener={false}
        dragControls={dragControls}
        whileDrag={{ scale: 1.015, boxShadow: "0px 15px 35px rgba(15,23,42,0.12)", zIndex: 10 }}
        onDragEnd={() => {
          onReorder(patients);
          showNotification('Fata pasien berhasil diatur ulang!', 'success');
        }}
        className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${isExpanded ? '' : 'overflow-hidden'
          }`}
      >
        {cardContent}
      </Reorder.Item>
    );
  } else {
    return (
      <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${isExpanded ? '' : 'overflow-hidden'
        }`}>
        {cardContent}
      </div>
    );
  }
};

interface VitalEntryItemProps {
  vt: VitalsEntry;
  vIdx: number;
  originalIdx: number;
  onEditVitals: (patientIdx: number, vitalsIdx: number) => void;
  onDeleteVitals: (patientIdx: number, vitalsIdx: number) => void;
  onDragEnd: () => void;
}

const VitalEntryItem: React.FC<VitalEntryItemProps> = ({
  vt,
  vIdx,
  originalIdx,
  onEditVitals,
  onDeleteVitals,
  onDragEnd
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={vt}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.02, boxShadow: "0px 8px 20px rgba(15,23,42,0.08)", zIndex: 20 }}
      onDragEnd={onDragEnd}
      className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 hover:border-slate-400 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
    >
      {/* Left parameters logs breakdown with Grip Handle */}
      <div className="flex items-start gap-3 min-w-0 select-text">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="p-1.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0 mt-0.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          title="Tarik handle ini untuk mengatur urutan TTV (bisa digeser ke atas/bawah)"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-mono font-black text-slate-800 text-sm">Jam {vt.time || '(Blank)'}</span>

            {/* Parameter shortcuts badges */}
            {vt.bp && <span className="bg-slate-50 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded font-black">TD: {vt.bp}</span>}
            {vt.hr && <span className="bg-slate-50 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded font-black">HR: {vt.hr}</span>}
            {vt.rr && <span className="bg-slate-50 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded font-black">RR: {vt.rr}</span>}
            {vt.spo2 && <span className="bg-slate-50 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded font-black">SpO₂: {vt.spo2}%</span>}
          </div>

          {/* Detailed values text view */}
          <div className="text-xs text-slate-500 leading-relaxed font-sans font-medium whitespace-pre-wrap max-w-2xl pl-1">
            {formatVitalsEntry(vt)}
          </div>
        </div>
      </div>

      {/* Vital Log Edit / Delete Controllers */}
      <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-center select-none">
        <button
          onClick={() => onEditVitals(originalIdx, vIdx)}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-teal-600 rounded-xl transition flex items-center justify-center cursor-pointer"
          title="Edit Catatan Vitals"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Hapus catatan log jam ${vt.time || ''} ini?`)) {
              onDeleteVitals(originalIdx, vIdx);
            }
          }}
          className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition flex items-center justify-center cursor-pointer"
          title="Hapus Catatan Vitals"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
};
