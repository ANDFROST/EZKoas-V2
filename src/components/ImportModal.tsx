import React, { useState, useEffect, useMemo } from 'react';
import { PatientRecord, VitalsEntry, SpreadsheetRow } from '../types';
import {
  parseClipboardPatients,
  normalizeGender,
  formatTime,
  GOOGLE_SHEETS_SCRIPT_URL
} from '../utils';
import {
  Import,
  ClipboardList,
  Cloud,
  X,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Loader2,
  Minimize2,
  Calendar
} from 'lucide-react';

interface ImportModalProps {
  onImportCompleted: (imported: PatientRecord[]) => void;
  onClose: () => void;
  showNotification: (msg: string, type: 'success' | 'dev' | 'error') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onImportCompleted,
  onClose,
  showNotification
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'clipboard'>('sheet');

  // Clipboard States
  const [clipboardText, setClipboardText] = useState('');

  // Spreadsheet States
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetRows, setSheetRows] = useState<SpreadsheetRow[]>([]);

  // Search filter inputs
  const [filterName, setFilterName] = useState('');
  const [filterRm, setFilterRm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterTime, setFilterTime] = useState('');

  // Selection states mapping: rowIndex -> boolean
  const [selectedIndices, setSelectedIndices] = useState<Record<number, boolean>>({});

  // Expanded patient groups: key -> boolean
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Load database on mount
  useEffect(() => {
    if (activeTab === 'sheet') {
      fetchSpreadsheet();
    }
  }, [activeTab]);

  const fetchSpreadsheet = async () => {
    setIsLoadingSheet(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      if (response.ok) {
        const data = await response.json();
        setSheetRows(data);

        // Pre-select nothing by default
        const initialSelected: Record<number, boolean> = {};
        data.forEach((_: any, idx: number) => {
          initialSelected[idx] = false;
        });
        setSelectedIndices(initialSelected);
      } else {
        showNotification('Gagal menghubungi server Google Sheets.', 'error');
      }
    } catch (e) {
      showNotification('Kesalahan jaringan saat mengunduh data.', 'error');
    }
    setIsLoadingSheet(false);
  };

  // Safe field checks
  const getRowValue = (row: SpreadsheetRow, keys: string[]): string => {
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
  const formatSheetDate = (value: string): string => {
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

  // Re-build groupings of spreadsheet rows under specific unique key
  const getPatientKey = (row: SpreadsheetRow): string => {
    const rmVal = getRowValue(row, ['No RM', 'No. RM', 'RM']).toLowerCase();
    const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']).toLowerCase();
    const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']).toLowerCase();
    if (rmVal) return `${rmVal}|${nameVal}|${roomVal}`;
    return `${nameVal}|${roomVal}`;
  };

  const getPatientLabel = (row: SpreadsheetRow): string => {
    const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']);
    const rmVal = getRowValue(row, ['No RM', 'No. RM', 'RM']);
    const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']);

    const parts = [];
    if (nameVal) parts.push(nameVal);
    if (rmVal) parts.push(`RM: ${rmVal}`);
    if (roomVal) parts.push(`Kamar: ${roomVal}`);
    return parts.join(' • ') || '(Tanpa Identitas)';
  };

  // Filter spreadsheet rows based on inputs
  const filteredRowsAndIndices = useMemo(() => {
    const qName = filterName.trim().toLowerCase();
    const qRm = filterRm.trim().toLowerCase();
    const qRoom = filterRoom.trim().toLowerCase();
    const qTime = filterTime.trim().toLowerCase();

    const results: { row: SpreadsheetRow; originalIndex: number }[] = [];

    sheetRows.forEach((row, idx) => {
      const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']).toLowerCase();
      const rmVal = String(row['No RM'] || row['No. RM'] || row.RM || '').toLowerCase();
      const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']).toLowerCase();
      const timeVal = getRowValue(row, ['VitalsTime', 'Waktu', 'Time']).toLowerCase();

      if (qName && !nameVal.includes(qName)) return;
      if (qRm && !rmVal.includes(qRm)) return;
      if (qRoom && !roomVal.includes(qRoom)) return;
      if (qTime && !timeVal.includes(qTime)) return;

      results.push({ row, originalIndex: idx });
    });

    return results;
  }, [sheetRows, filterName, filterRm, filterRoom, filterTime]);

  // Group filtered results for the Tree View
  const groupedPatients = useMemo(() => {
    const groups: Record<string, { label: string; key: string; itemIndices: number[]; headerRow: SpreadsheetRow }> = {};

    filteredRowsAndIndices.forEach(({ row, originalIndex }) => {
      const pKey = getPatientKey(row);
      if (!groups[pKey]) {
        groups[pKey] = {
          label: getPatientLabel(row),
          key: pKey,
          itemIndices: [],
          headerRow: row
        };
      }
      groups[pKey].itemIndices.push(originalIndex);
    });

    return Object.values(groups);
  }, [filteredRowsAndIndices]);

  // Toggle single child vitals row item selection
  const toggleRowSelected = (idx: number) => {
    setSelectedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Select / Deselect full parent patient group
  const toggleGroupSelected = (pKey: string, currentSelectedState: boolean) => {
    const groupMatches = groupedPatients.find((g) => g.key === pKey);
    if (!groupMatches) return;

    const copy = { ...selectedIndices };
    groupMatches.itemIndices.forEach((idx) => {
      copy[idx] = !currentSelectedState;
    });
    setSelectedIndices(copy);
  };

  const getGroupSelectionStatus = (pKey: string): 'all' | 'some' | 'none' => {
    const groupMatches = groupedPatients.find((g) => g.key === pKey);
    if (!groupMatches) return 'none';

    const childIndices = groupMatches.itemIndices;
    const allChecked = childIndices.every((idx) => selectedIndices[idx]);
    const anyChecked = childIndices.some((idx) => selectedIndices[idx]);

    if (allChecked) return 'all';
    if (anyChecked) return 'some';
    return 'none';
  };

  const toggleGroupExpanded = (pKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [pKey]: !prev[pKey]
    }));
  };

  // Convert Sheet row structure back to typed PatientRecord
  const mapSheetRowToPatient = (row: SpreadsheetRow): PatientRecord => {
    const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']);
    const rmVal = getRowValue(row, ['No RM', 'No. RM', 'RM']);
    const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']);
    const ageVal = getRowValue(row, ['Umur', 'Age', 'Usia']);
    const genderVal = normalizeGender(getRowValue(row, ['Jenis Kelamin', 'Gender', 'Sex']));

    const isFollowTtv = getRowValue(row, ['FollowTtv', 'Follow TTV', 'isFollowTtv']).toLowerCase() === 'true';
    const isFollowGds = getRowValue(row, ['FollowGds', 'Follow GDS', 'isFollowGds']).toLowerCase() === 'true';
    const isFollowUop = getRowValue(row, ['FollowUop', 'Follow UOP', 'isFollowUop']).toLowerCase() === 'true';
    const isFollowBalance = getRowValue(row, ['FollowBalance', 'Follow Balance', 'isFollowBalance']).toLowerCase() === 'true';

    const followTtvInterval = getRowValue(row, ['FollowTtvInterval', 'Follow TTV Interval']) || '3 Jam';
    const followGdsInterval = getRowValue(row, ['FollowGdsInterval', 'Follow GDS Interval']) || '3 Jam';
    const followUopInterval = getRowValue(row, ['FollowUopInterval', 'Follow UOP Interval']) || '3 Jam';
    const followBalanceInterval = getRowValue(row, ['FollowBalanceInterval', 'Follow Balance Interval']) || '3 Jam';

    const rawTime = getRowValue(row, ['VitalsTime', 'Waktu', 'Time']);
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

    const gdsChecked = getRowValue(row, ['GDSChecked', 'isGdsChecked']).toLowerCase() === 'true';
    const gdsV = getRowValue(row, ['GDSValue', 'GDS']).replace(/[^0-9.]/g, '');

    const isOnIV = getRowValue(row, ['IsOnIVDrug', 'OnIVDrug', 'isOnIVDrug']).toLowerCase() === 'true';

    // Parse semicolon list for IV medications
    const rawIvNames = getRowValue(row, ['IVDrugNames', 'IV Drug Names', 'Nama Obat IV']);
    const rawIvRates = getRowValue(row, ['IVDrugRates', 'IV Drug Rates', 'Rate Obat IV']);

    const ivDrugNames = rawIvNames ? rawIvNames.split(/[;|/]+/).map((s) => s.trim()).filter(Boolean) : [];
    const ivDrugRates = rawIvRates ? rawIvRates.split(/[;|/]+/).map((s) => s.trim().replace(/,/g, '.')).filter(Boolean) : [];

    const keluhanVal = getRowValue(row, ['Keluhan', 'Complaint', 'Notes']);

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
      isOnIVDrug: isOnIV || ivDrugNames.length > 0,
      ivDrugNames,
      ivDrugRates,
      keluhan: keluhanVal,
      createdAt: Date.now()
    };

    return {
      room: roomVal,
      rm: rmVal,
      name: nameVal,
      gender: genderVal,
      age: ageVal,
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

  // Perform sheet rows import
  const executeSheetImport = () => {
    const selectedRows = sheetRows.filter((_, idx) => selectedIndices[idx]);
    if (selectedRows.length === 0) {
      showNotification('Pilih minimal satu baris vitals untuk diimpor!', 'error');
      return;
    }

    const mapped = selectedRows.map((r) => mapSheetRowToPatient(r));
    onImportCompleted(mapped);
    showNotification(`Berhasil mengimpor ${selectedRows.length} catatan vitals dari Google Sheets!`, 'success');
  };

  // Perform clipboard text analytical import
  const executeClipboardImport = () => {
    const textSnapshot = clipboardText.trim();
    if (!textSnapshot) {
      showNotification('Tempelkan teks format EZKOAS terlebih dahulu.', 'error');
      return;
    }

    try {
      const parsed = parseClipboardPatients(textSnapshot);
      if (parsed.length === 0) {
        showNotification('Tidak ada blok pasien EZKOAS yang valid ditemukan pada clipboard.', 'error');
        return;
      }

      onImportCompleted(parsed);
      showNotification(`Berhasil mengimpor ${parsed.length} pasien dari clipboard!`, 'success');
    } catch (e) {
      showNotification('Kesalahan format teks saat mengurai data klinis.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full mx-auto overflow-hidden font-sans flex flex-col max-h-[80vh] sm:max-h-[85vh]">
      {/* Header Info */}
      <div className="bg-white border-b border-slate-200 p-4 sm:p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Kanal Import Data Pasien</h2>
          <p className="text-slate-400 text-xs mt-1">Impor riwayat vitals pasien secara massal</p>
        </div>
        <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center">
          <Import className="w-5 h-5 text-teal-600" />
        </div>
      </div>

      {/* Modal tabs */}
      <div className="bg-slate-50 border-b border-slate-200/60 p-2 flex">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'sheet' ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Cloud className="w-4 h-4 shrink-0 text-teal-500" />
          <span className="hidden sm:inline">Google Spreadsheet Server</span>
          <span className="sm:hidden">Google Sheets</span>
        </button>
        <button
          onClick={() => setActiveTab('clipboard')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'clipboard' ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0 text-teal-500" />
          <span className="hidden sm:inline">Analisis Teks Clipboard</span>
          <span className="sm:hidden">Clipboard</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
        {activeTab === 'sheet' && (
          <div className="space-y-4">
            {/* Real-time search tools */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-slate-50/75 p-2.5 sm:p-3.5 rounded-xl border border-slate-200/40 text-[11px] sm:text-xs">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="font-bold text-slate-500">Nama Pasien</label>
                <div className="flex bg-white items-center rounded-xl border border-slate-200/70 overflow-hidden px-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-full py-1.5 focus:outline-none focus:bg-white text-xs text-slate-705"
                    placeholder="Ketik nama..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Nomor RM</label>
                <input
                  type="text"
                  value={filterRm}
                  onChange={(e) => setFilterRm(e.target.value)}
                  className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-1.5 focus:outline-none text-xs text-slate-705"
                  placeholder="Ketik rekam medis..."
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Ruangan</label>
                <input
                  type="text"
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-1.5 focus:outline-none text-xs text-slate-705"
                  placeholder="Nama ruangan..."
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Waktu</label>
                <input
                  type="text"
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-1.5 focus:outline-none text-xs text-slate-705"
                  placeholder="Jam, misal: 12:00"
                />
              </div>
            </div>

            {/* Tree grouping results view */}
            {isLoadingSheet ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <p className="text-xs text-slate-500 font-sans">Mengunduh row database dari cloud...</p>
              </div>
            ) : groupedPatients.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-bold text-slate-400 font-sans">Tidak ada data vitals yang sesuai filter.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] sm:max-h-[350px] overflow-y-auto pr-1">
                {groupedPatients.map((group) => {
                  const selectionStatus = getGroupSelectionStatus(group.key);
                  const isExpanded = !!expandedGroups[group.key];
                  const entryDate = getRowValue(group.headerRow, ['Tanggal', 'Date']);
                  const formattedDate = entryDate ? formatSheetDate(entryDate) : '';

                  return (
                    <div key={`group-${group.key}`} className="border border-slate-100 rounded-xl overflow-hidden font-sans">
                      {/* Parent header panel */}
                      <div className="bg-slate-50/50 p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checked toggle button */}
                          <button
                            type="button"
                            onClick={() => toggleGroupSelected(group.key, selectionStatus === 'all')}
                            className="text-slate-400 hover:text-teal-700 transition shrink-0"
                          >
                            {selectionStatus === 'all' ? (
                              <CheckSquare className="w-5 h-5 text-teal-600" />
                            ) : selectionStatus === 'some' ? (
                              <div className="w-5 h-5 bg-teal-50 rounded border border-teal-300 flex items-center justify-center text-teal-600 font-black text-[15px]">
                                -
                              </div>
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 cursor-pointer select-none" onClick={() => toggleGroupExpanded(group.key)}>
                            <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">{group.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5 flex items-center gap-1">
                              <span>Total vitals: {group.itemIndices.length} records</span>
                              {formattedDate && <span>• Tanggal masuk: {formattedDate}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleGroupExpanded(group.key)}
                          className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-400 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expandable nested child records */}
                      {isExpanded && (
                        <div className="bg-white divide-y divide-slate-50 pl-11 text-xs">
                          {group.itemIndices.map((originalIndex) => {
                            const r = sheetRows[originalIndex];
                            const childChecked = !!selectedIndices[originalIndex];

                            const rawTimeVal = getRowValue(r, ['VitalsTime', 'Waktu', 'Time']);
                            const tVal = rawTimeVal ? formatTime(rawTimeVal) : '(Tanpa jam)';

                            const bpVal = getRowValue(r, ['BP', 'TD', 'Tekanan Darah']);
                            const hrVal = getRowValue(r, ['HR', 'Heart Rate']);
                            const rrVal = getRowValue(r, ['RR', 'Respiratory Rate']);
                            const spo2Val = getRowValue(r, ['SpO2', 'SPO2', 'SpO2%']).replace(/%/g, '');

                            const pieces = [];
                            if (bpVal) pieces.push(`TD: ${bpVal}`);
                            if (hrVal) pieces.push(`HR: ${hrVal}`);
                            if (rrVal) pieces.push(`RR: ${rrVal}`);
                            if (spo2Val) pieces.push(`SpO₂: ${spo2Val}%`);
                            const lineSummary = pieces.join(' • ') || 'Riwayat TTV kosongan';

                            return (
                              <div
                                key={`row-entry-${originalIndex}`}
                                className="p-3 hover:bg-slate-50/50 flex items-center justify-between gap-3 text-xs select-none"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleRowSelected(originalIndex)}
                                    className="shrink-0 text-slate-300 hover:text-teal-700"
                                  >
                                    {childChecked ? (
                                      <CheckSquare className="w-4.5 h-4.5 text-teal-600" />
                                    ) : (
                                      <Square className="w-4.5 h-4.5 text-slate-300" />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-700">Jam log: {tVal}</p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{lineSummary}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clipboard' && (
          <div className="space-y-4 font-sans">
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex gap-3 text-xs text-sky-950">
              <ClipboardList className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <h4 className="font-bold">Format Penguraian Teks Clipboard</h4>
                <p className="leading-relaxed opacity-90 mt-0.5">
                  Salinkan teks over-shift klinis langsung dari aplikasi rujukan atau chat messenger.
                  Pengurai EZKOAS akan otomatis mendeteksi baris identitas pasien, alarms follow-up, serta catatan vitals (TTV) trend log.
                  Jika ingin mengimpor multi-pasien sekaligus, pisahkan setiap blok pasien menggunakan garis pemisah putus-putus minimal 3 karakter (misal: <code>---</code>).
                </p>
              </div>
            </div>

            <textarea
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="Tempelkan pesan EZKOAS format rujukan di sini..."
              rows={10}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-teal-500 rounded-2xl p-4 focus:bg-white focus:outline-none transition text-sm font-mono text-slate-750 resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Button handlers bar */}
      <div className="bg-slate-50 p-4 sm:px-6 sm:py-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
        {activeTab === 'sheet' && !isLoadingSheet && sheetRows.length > 0 && (
          <div className="text-xs font-semibold text-slate-500 font-sans text-center sm:text-left">
            {sheetRows.filter((_, idx) => selectedIndices[idx]).length} baris dipilih
          </div>
        )}
        <div className="flex gap-2.5 w-full sm:w-auto ml-auto justify-end">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-250 hover:bg-slate-100 text-slate-705 text-xs sm:text-sm font-semibold transition font-sans"
          >
            Batal
          </button>
          {activeTab === 'sheet' ? (
            <button
              onClick={executeSheetImport}
              disabled={isLoadingSheet || sheetRows.length === 0}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-sans text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 ${
                sheetRows.length > 0 ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow shadow-teal-600/15 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Import Terpilih</span>
            </button>
          ) : (
            <button
              onClick={executeClipboardImport}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-sans text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow shadow-teal-600/15 cursor-pointer`}
            >
              <Import className="w-4 h-4 shrink-0" />
              <span>Urai &amp; Import</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
