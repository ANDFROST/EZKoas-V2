import React, { useState, useEffect, useMemo } from 'react';
import { PatientRecord, VitalsEntry, BalanceCairan, SpreadsheetRow, SuaraPernapasan, SuaraTambahan } from '../types';
import { formatTime, normalizeGender, GOOGLE_SHEETS_SCRIPT_URL } from '../utils';
import { GcsCalculator } from './GcsCalculator';
import { BalanceCairanModal } from './BalanceCairanModal';
import { MedicalProtocolsRef } from './MedicalProtocolsRef';
import { ImportOnlineModal, ImportOnlineResult } from './ImportOnlineModal';
import { LungRegionSelector } from './LungRegionSelector';
import { RoomSelectorModal } from './RoomSelectorModal';
import {
  FileText,
  User,
  Heart,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Bookmark,
  ChevronDown,
  Activity,
  Droplet,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  X,
  Search,
  Database,
  Calculator,
  Loader2,
  Syringe,
  Info,
  RotateCcw
} from 'lucide-react';

interface PatientFormProps {
  patientIndex: number | null;
  vitalsIndex: number | null;
  savedPatients: PatientRecord[];
  allPatientsDirectory?: PatientRecord[];
  onSave: (patient: PatientRecord, updatedVitals: VitalsEntry) => void;
  onCancel: () => void;
  showNotification: (msg: string, type: 'success' | 'dev' | 'error') => void;
}

const CONSTANT_IV_DRUG_OPTIONS = [
  'Novorapid',
  'Norepinephrine',
  'Furosemide',
  'Nicardipine',
  'Dopamine',
  'Midazolam',
  'Dobutamine',
  'Fentanyl',
  'Atrakurium',
  'Morphine',
  'Lainnya'
];

export const PatientForm: React.FC<PatientFormProps> = ({
  patientIndex,
  vitalsIndex,
  savedPatients,
  allPatientsDirectory = [],
  onSave,
  onCancel,
  showNotification
}) => {
  // Identity states
  const [room, setRoom] = useState('');
  const [rm, setRm] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Laki-laki (L)' | 'Perempuan (P)'>('Laki-laki (L)');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Follow monitoring states
  const [isFollowTtv, setIsFollowTtv] = useState(false);
  const [followTtvInterval, setFollowTtvInterval] = useState('3 Jam');
  const [isFollowGds, setIsFollowGds] = useState(false);
  const [followGdsInterval, setFollowGdsInterval] = useState('3 Jam');
  const [isFollowUop, setIsFollowUop] = useState(false);
  const [followUopInterval, setFollowUopInterval] = useState('3 Jam');
  const [isFollowBalance, setIsFollowBalance] = useState(false);
  const [followBalanceInterval, setFollowBalanceInterval] = useState('3 Jam');

  // Vitals states
  const [time, setTime] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [bp, setBp] = useState('');
  const [sens, setSens] = useState('');
  const [gcsValue, setGcsValue] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [o2Method, setO2Method] = useState<VitalsEntry['o2Method']>('Room Air (RA)');
  const [lpm, setLpm] = useState('');
  const [temp, setTemp] = useState('');

  // Other Exams states
  const [showOtherExams, setShowOtherExams] = useState(false);
  const [isGdsChecked, setIsGdsChecked] = useState(false);
  const [gdsValue, setGdsValue] = useState('');
  const [isOnIVDrug, setIsOnIVDrug] = useState(false);
  const [isUopChecked, setIsUopChecked] = useState(false);
  const [uopValue, setUopValue] = useState('');

  // Array states for multi IV drugs
  const [ivDrugs, setIvDrugs] = useState<{ name: string; rate: string; isCustom?: boolean; customName?: string }[]>([
    { name: 'Novorapid', rate: '' }
  ]);

  // Balance Cairan
  const [balanceCairan, setBalanceCairan] = useState<BalanceCairan | undefined>(undefined);

  const [showGcsCalculator, setShowGcsCalculator] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showProtocolsRef, setShowProtocolsRef] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showImportOnlineModal, setShowImportOnlineModal] = useState(false);
  const [showLungModal, setShowLungModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const [spData, setSpData] = useState<SuaraPernapasan | undefined>(undefined);
  const [stData, setStData] = useState<SuaraTambahan | undefined>(undefined);

  // Focus state for previous values bubble
  const [focusedField, setFocusedField] = useState<keyof VitalsEntry | 'lung' | 'ivDrugs' | null>(null);

  // Compute previous vitals
  const previousVitals = useMemo(() => {
    if (patientIndex !== null && savedPatients[patientIndex]) {
      const patient = savedPatients[patientIndex];
      if (vitalsIndex !== null) {
        if (vitalsIndex > 0) return patient.vitals[vitalsIndex - 1];
      } else {
        if (patient.vitals.length > 0) return patient.vitals[patient.vitals.length - 1];
      }
    }
    return null;
  }, [patientIndex, vitalsIndex, savedPatients]);

  const renderPreviousValueBubble = (field: keyof VitalsEntry | 'lung' | 'ivDrugs', unit: string = '') => {
    if (focusedField !== field || !previousVitals) return null;

    let displayValue = '';

    if (field === 'lung') {
      const sp = previousVitals.sp ? 'SP terisi' : '';
      const st = previousVitals.st ? 'ST terisi' : '';
      const both = [sp, st].filter(Boolean).join(', ');
      if (!both) return null;
      displayValue = both;
    } else if (field === 'spo2') {
      if (!previousVitals.spo2) return null;
      const methodMap: Record<string, string> = {
        'Room Air (RA)': 'RA',
        'Nasal Cannula (NK)': 'NK',
        'Non Rebreathing Mask (NRM)': 'NRM',
        'Trakeostomi': 'Trakeostomi',
        'Ventilator': 'Ventilator'
      };
      const methodShort = methodMap[previousVitals.o2Method] || previousVitals.o2Method;
      const lpmStr = previousVitals.lpm && !['Room Air (RA)', 'Ventilator'].includes(previousVitals.o2Method) ? ` ${previousVitals.lpm} lpm` : '';
      displayValue = `${previousVitals.spo2}% on ${methodShort}${lpmStr}`;
    } else if (field === 'ivDrugs') {
      if (!previousVitals.isOnIVDrug || !previousVitals.ivDrugNames || previousVitals.ivDrugNames.length === 0) return null;
      const drugs = previousVitals.ivDrugNames.map((name, idx) => `${name} ${previousVitals.ivDrugRates?.[idx] || '?'} cc/j`).join(', ');
      displayValue = `⚠️ Drip sblm: ${drugs}`;
    } else {
      if (!previousVitals[field as keyof VitalsEntry]) return null;
      displayValue = `${String(previousVitals[field as keyof VitalsEntry])} ${unit}`.trim();
    }

    const timeStr = previousVitals.time ? `(${previousVitals.time})` : '';

    return (
      <div className="absolute bottom-full left-0 mb-1 z-10 whitespace-nowrap bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg animate-in fade-in zoom-in duration-200 pointer-events-none flex items-center gap-1.5 border border-indigo-500/30">
        <span className="font-bold tracking-wide">{displayValue}</span>
        {timeStr && <span className="opacity-80 tracking-wide font-mono">{timeStr}</span>}
        <div className="absolute top-full left-4 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-indigo-600/90 drop-shadow-sm"></div>
      </div>
    );
  };

  // Sliding-scale recommendations
  const [gdsRecommendation, setGdsRecommendation] = useState<{ message: string; suggestedRate?: string } | null>(null);

  // Initialize form
  useEffect(() => {
    // Current time default or computed
    setTime(formatTime(''));

    if (patientIndex !== null) {
      // Edit existing patient mode or adding new entry to existing patient
      const patient = savedPatients[patientIndex];
      setRoom(patient.room);
      setRm(patient.rm);
      setName(patient.name);
      setGender(patient.gender);
      setAge(patient.age);
      setWeight(patient.weight || '');
      setHeight(patient.height || '');
      setIsFollowTtv(patient.isFollowTtv);
      setFollowTtvInterval(patient.followTtvInterval);
      setIsFollowGds(patient.isFollowGds);
      setFollowGdsInterval(patient.followGdsInterval);
      setIsFollowUop(patient.isFollowUop);
      setFollowUopInterval(patient.followUopInterval);
      setIsFollowBalance(patient.isFollowBalance);
      setFollowBalanceInterval(patient.followBalanceInterval);

      if (vitalsIndex !== null && patient.vitals[vitalsIndex]) {
        // Edit exact vitals mode
        const entry = patient.vitals[vitalsIndex];
        setTime(entry.time);
        setKeluhan(entry.keluhan);
        setBp(entry.bp);
        setSens(entry.sens);
        setGcsValue(entry.gcs);
        setHr(entry.hr);
        setRr(entry.rr);
        setSpo2(entry.spo2);
        setO2Method(entry.o2Method);
        setLpm(entry.lpm);
        setTemp(entry.temp);

        setIsGdsChecked(entry.isGdsChecked);
        setGdsValue(entry.gdsValue);
        setIsOnIVDrug(entry.isOnIVDrug);
        setIsUopChecked(!!entry.isUopChecked);
        setUopValue(entry.uopValue || '');

        // Map drugs
        if (entry.ivDrugNames && entry.ivDrugNames.length > 0) {
          const mapped = entry.ivDrugNames.map((n, idx) => {
            const isStandard = CONSTANT_IV_DRUG_OPTIONS.includes(n);
            return {
              name: isStandard ? n : 'Lainnya',
              rate: entry.ivDrugRates?.[idx] || '',
              isCustom: !isStandard,
              customName: isStandard ? undefined : n
            };
          });
          setIvDrugs(mapped);
        }

        if (entry.isGdsChecked || entry.isOnIVDrug) {
          setShowOtherExams(true);
        }

        if (entry.balanceCairan) {
          setBalanceCairan(entry.balanceCairan);
        }

        if (entry.sp) {
          setSpData(entry.sp);
        }
        if (entry.st) {
          setStData(entry.st);
        }
      }
    }
  }, [patientIndex, vitalsIndex, savedPatients]);

  // Handle hypoglycemia/hyperglycemia dynamic calculations on GDS input
  useEffect(() => {
    const val = parseFloat(gdsValue.replace(/,/g, '.'));
    if (isNaN(val)) {
      setGdsRecommendation(null);
      return;
    }

    let msg = '';
    let rate: string | undefined;

    if (val < 70) {
      msg = '🔴 KRITIS HIPOGLIKEMIA: GDS < 70 mg/dL.\nBerikan bolus D40% sebanyak 2 flacon (IV), cek ulang KGDs dalam 30 menit!';
    } else if (val >= 70 && val < 100) {
      msg = '🟡 GDS < 100 mg/dL: STOP DRIP INSULIN.\nSegera laporkan kondisi ke Residen/DPJP, laksanakan rumatan D10% jika perlu.';
      rate = '0.5';
    } else if (val >= 100 && val <= 150) {
      msg = '🟢 Rentang Sasaran Baik (100 - 150 mg/dL).\nDosis rumatan jika terpasang Drip: 0.5 unit/jam atau 0.5 cc/jam.';
      rate = '0.5';
    } else if (val > 150 && val <= 200) {
      msg = '🔵 GDS 151-200 mg/dL: Protokol Hiperglikemia.\nDosis drip Novorapid: 1.0 unit/jam (1.0 cc/jam).';
      rate = '1';
    } else if (val > 200 && val <= 250) {
      msg = '🟠 GDS 201-250 mg/dL: Protokol Hiperglikemia.\nDosis drip Novorapid: 2.0 unit/jam (2.0 cc/jam). Evaluasi KGD per 3 jam.';
      rate = '2';
    } else if (val > 250 && val <= 300) {
      msg = '🟠 GDS 251-300 mg/dL: Protokol Hiperglikemia.\nDosis drip Novorapid: 2.5 unit/jam (2.5 cc/jam). Evaluasi KGD per 3 jam.';
      rate = '2.5';
    } else if (val > 300 && val <= 350) {
      msg = '🟠 GDS 301-350 mg/dL: Protokol Hiperglikemia.\nDosis drip Novorapid: 3.0 unit/jam (3.0 cc/jam). Evaluasi KGD per 3 jam.';
      rate = '3';
    } else if (val > 350 && val <= 400) {
      msg = '🔴 GDS 351-400 mg/dL: Hiperglikemia Tinggi.\nDosis drip Novorapid: 3.5 unit/jam (3.5 cc/jam). Evaluasi KGD per 3 jam.';
      rate = '3.5';
    } else if (val > 400 && val <= 450) {
      msg = '🔴 GDS 401-450 mg/dL: Hiperglikemia Tinggi.\nDosis drip Novorapid: 6.0 unit/jam (6.0 cc/jam). Evaluasi KGD per 3 jam.';
      rate = '6';
    } else if (val > 450) {
      msg = '⚠️ KRITIS EKSTREM: GDS > 450 mg/dL.\nTambahkan dosis drip 1 cc/jam segera. WAJIB periksa ulang GDS/KGDs SETIAP 1 JAM sampai < 400 mg/dL!';
    }

    setGdsRecommendation({
      message: msg,
      suggestedRate: rate
    });
  }, [gdsValue]);

  // Apply recommendations automatically to drug array
  const applyNovorapidDose = () => {
    if (!gdsRecommendation || !gdsRecommendation.suggestedRate) return;
    setIsOnIVDrug(true);
    setShowOtherExams(true);

    const existIdx = ivDrugs.findIndex((d) => d.name === 'Novorapid');
    if (existIdx !== -1) {
      const copy = [...ivDrugs];
      copy[existIdx].rate = gdsRecommendation.suggestedRate;
      setIvDrugs(copy);
    } else {
      setIvDrugs((prev) => [
        { name: 'Novorapid', rate: gdsRecommendation.suggestedRate! },
        ...prev.filter((d) => d.name !== 'Novorapid')
      ]);
    }
    showNotification('Berhasil menerapkan dosis sliding scale Novorapid!', 'success');
  };

  const handleApplyOnlineData = (data: ImportOnlineResult) => {
    setName(data.name);
    setRm(data.rm);
    setRoom(data.room);
    setAge(data.age);
    setGender(data.gender);
    setShowImportOnlineModal(false);
  };

  const handleApplyFromDirectory = (p: PatientRecord) => {
    setName(p.name);
    setRm(p.rm);
    setRoom(p.room);
    setAge(p.age);
    setGender(p.gender);
    if (p.weight) setWeight(p.weight);
    if (p.height) setHeight(p.height);
    setIsFollowTtv(p.isFollowTtv);
    setFollowTtvInterval(p.followTtvInterval || '3 Jam');
    setIsFollowGds(p.isFollowGds);
    setFollowGdsInterval(p.followGdsInterval || '3 Jam');
    setIsFollowUop(p.isFollowUop);
    setFollowUopInterval(p.followUopInterval || '3 Jam');
    setIsFollowBalance(p.isFollowBalance);
    setFollowBalanceInterval(p.followBalanceInterval || '3 Jam');
    setShowDirectoryModal(false);
    showNotification(`Identitas "${p.name}" berhasil diterapkan.`, 'success');
  };

  // Manage custom drugs row array
  const handleAddIvDrug = () => {
    setIvDrugs((prev) => [...prev, { name: 'Novorapid', rate: '' }]);
  };

  const handleRemoveIvDrug = (idx: number) => {
    setIvDrugs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleIvDrugSelectChange = (idx: number, name: string) => {
    const copy = [...ivDrugs];
    copy[idx].name = name;
    if (name !== 'Lainnya') {
      copy[idx].isCustom = false;
      copy[idx].customName = undefined;
    } else {
      copy[idx].isCustom = true;
      copy[idx].customName = '';
    }
    setIvDrugs(copy);
  };

  const handleIvDrugRateChange = (idx: number, rate: string) => {
    const copy = [...ivDrugs];
    copy[idx].rate = rate;
    setIvDrugs(copy);
  };

  const handleIvDrugCustomNameChange = (idx: number, customName: string) => {
    const copy = [...ivDrugs];
    copy[idx].customName = customName;
    setIvDrugs(copy);
  };

  // Compute Balance Cairan summary if present
  const balanceTotalResult = useMemo(() => {
    if (!balanceCairan) return null;
    const intake = balanceCairan.makanValue + balanceCairan.minumValue + balanceCairan.ivfdValue + balanceCairan.transfusiValue + balanceCairan.syringePumpValue;
    const output = balanceCairan.babValue + balanceCairan.uopValue + balanceCairan.muntahValue + (balanceCairan.iwl ? balanceCairan.iwlValue : 0);
    return intake - output;
  }, [balanceCairan]);

  // Form saving process
  const triggerSave = () => {
    const patientName = name.trim();
    const patientRm = rm.trim();

    if (!patientName && !patientRm) {
      showNotification('Nama pasien dan No. RM tidak boleh kosong sekaligus.', 'error');
      return;
    }

    // Build Entry
    const mappedIvNames = ivDrugs.map((d) => (d.name === 'Lainnya' ? d.customName || 'Obat IV' : d.name));
    const mappedIvRates = ivDrugs.map((d) => d.rate);

    const updatedVitals: VitalsEntry = {
      time: formatTime(time),
      bp,
      sens,
      gcs: gcsValue,
      hr,
      rr,
      spo2,
      o2Method,
      lpm: ['Room Air (RA)', 'Ventilator'].includes(o2Method) ? '' : lpm,
      temp,
      isGdsChecked,
      gdsValue: isGdsChecked ? gdsValue : '',
      isOnIVDrug: isOnIVDrug,
      ivDrugNames: isOnIVDrug ? mappedIvNames : [],
      ivDrugRates: isOnIVDrug ? mappedIvRates : [],
      isUopChecked,
      uopValue: isUopChecked ? uopValue : '',
      keluhan,
      createdAt: patientIndex !== null && vitalsIndex !== null && savedPatients[patientIndex].vitals[vitalsIndex]
        ? savedPatients[patientIndex].vitals[vitalsIndex].createdAt
        : Date.now(),
      balanceCairan,
      sp: spData,
      st: stData
    };

    let pRecord: PatientRecord;
    if (patientIndex !== null) {
      const target = { ...savedPatients[patientIndex] };
      target.room = room;
      target.rm = rm;
      target.name = name;
      target.gender = gender;
      target.age = age;
      target.weight = weight;
      target.height = height;
      target.isFollowTtv = isFollowTtv;
      target.followTtvInterval = followTtvInterval;
      target.isFollowGds = isFollowGds;
      target.followGdsInterval = followGdsInterval;
      target.isFollowUop = isFollowUop;
      target.followUopInterval = followUopInterval;
      target.isFollowBalance = isFollowBalance;
      target.followBalanceInterval = followBalanceInterval;

      const vitalsCopy = [...target.vitals];
      if (vitalsIndex !== null) {
        vitalsCopy[vitalsIndex] = updatedVitals;
      } else {
        vitalsCopy.push(updatedVitals);
      }
      target.vitals = vitalsCopy;
      pRecord = target;
    } else {
      // Check for same RM
      const existingIdx = savedPatients.findIndex((p) => p.rm === rm && rm !== '');
      if (existingIdx !== -1) {
        const target = { ...savedPatients[existingIdx] };
        target.room = room;
        target.name = name;
        target.gender = gender;
        target.age = age;
        target.weight = weight;
        target.height = height;
        target.vitals = [...target.vitals, updatedVitals];
        pRecord = target;
      } else {
        pRecord = {
          room,
          rm,
          name,
          gender,
          age,
          weight,
          height,
          isFollowTtv,
          followTtvInterval,
          isFollowGds,
          followGdsInterval,
          isFollowUop,
          followUopInterval,
          isFollowBalance,
          followBalanceInterval,
          vitals: [updatedVitals]
        };
      }
    }

    onSave(pRecord, updatedVitals);
  };

  return (
    <div className="space-y-6">
      {/* Title ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 active:scale-95 rounded-xl transition text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              {patientIndex !== null ? (vitalsIndex !== null ? 'Edit Tanda-Tanda Vital' : 'Tambah Catatan Baru') : 'Tambah Pasien Baru'}
            </h1>
            <p className="text-slate-500 text-xs font-sans mt-0.5">Isilah form di bawah ini!</p>
          </div>
        </div>

        {/* Lookup database trigger (Compact mode) */}
        {patientIndex === null && (
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {allPatientsDirectory.length > 0 && (
              <button
                onClick={() => { setDirectorySearch(''); setShowDirectoryModal(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors active:scale-95"
                title="Pilih identitas dari pasien yang pernah tersimpan di folder lain"
              >
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold">Isi dari yang pernah Tersimpan</span>
              </button>
            )}
            <button
              onClick={() => setShowImportOnlineModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 rounded-xl transition-colors active:scale-95"
              title="Cari Identitas Pasien dari File Koyan"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-bold">Cari Pasien dari Ruangan</span>
              <span className="bg-amber-100 border border-amber-200 text-amber-700 font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none">BETA</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Two Column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Patient Identity & Alerts */}
        <div className="space-y-6">
          {/* Section: Identitas Pasien */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4.5 h-4.5 text-teal-600" />
              <span>Identitas Pasien</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Ruangan / Kamar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Misal: RA4 1.2.3"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(true)}
                    className="shrink-0 px-3 py-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                  >
                    Pilih Ruangan
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">No. Rekam Medis (RM)</label>
                <input
                  type="text"
                  placeholder="Misal: 00994499"
                  value={rm}
                  onChange={(e) => setRm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  placeholder="Nama Pasien"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Jenis Kelamin (Gender)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(normalizeGender(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="Laki-laki (L)">Laki-laki (L)</option>
                    <option value="Perempuan (P)">Perempuan (P)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Umur / Usia</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Misal: 54"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Berat Badan (BB)</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-teal-500 overflow-hidden transition-colors">
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Misal: 70"
                      className="w-full px-3.5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                    <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 select-none font-semibold transition-colors">kg</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Tinggi Badan (TB)</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-teal-500 overflow-hidden transition-colors">
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Misal: 170"
                      className="w-full px-3.5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                    <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 select-none font-semibold transition-colors">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In-app modal Follow check quick setting */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFollowModal(true)}
                className="w-full text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/70 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Tetapkan Sebagai Pasien Follow Ketat (FOLKET)</span>
              </button>

              {/* Display follow totals summary immediately */}
              {(isFollowTtv || isFollowGds || isFollowUop || isFollowBalance) && (
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                  <span className="text-slate-400 select-none shrink-0">Cek Aktif:</span>
                  {isFollowTtv && <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">🛎️ TTV ({followTtvInterval})</span>}
                  {isFollowGds && <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">🩸 GDS ({followGdsInterval})</span>}
                  {isFollowUop && <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">🧪 UOP ({followUopInterval})</span>}
                  {isFollowBalance && <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">💧 Balance ({followBalanceInterval})</span>}
                </div>
              )}
            </div>
          </div>

          {/* Section: Tanda-Tanda Vitals */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Heart className="w-4.5 h-4.5 text-emerald-500" />
                <span>Tanda-Tanda Vital (TTV)</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Waktu:</span>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-1 px-2.5 rounded-lg text-xs font-bold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 text-center font-mono"
                />
              </div>
            </div>

            {/* Consciousness & GCS Calculator Trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 relative">
                {renderPreviousValueBubble('sens')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Tingkat Kesadaran (Sens)</label>
                <select
                  value={sens}
                  onFocus={() => setFocusedField('sens')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setSens(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Pilih Tingkat Kesadaran</option>
                  <option value="Compos mentis">Compos mentis (Normal)</option>
                  <option value="Apatis">Apatis</option>
                  <option value="Somnolen">Somnolen</option>
                  <option value="Delirium">Delirium</option>
                  <option value="Sopor">Sopor</option>
                  <option value="Coma">Koma</option>
                  <option value="Dalam Penggunaan Obat (DPO)">DPO</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Hasil GCS</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: (E4V5M6) atau 15"
                    value={gcsValue}
                    onChange={(e) => setGcsValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-yellow-500 font-mono font-medium transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGcsCalculator(true)}
                    className="bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-700/50 p-2.5 rounded-xl shrink-0 transition"
                    title="Kalkulator GCS"
                  >
                    <Calculator className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Keluhan Pasien */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Keluhan Aktif Pasien</label>
              <textarea
                placeholder="Tulis keluhan, diagnosis atau catatan singkat..."
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                rows={2}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-none font-sans transition-colors"
              />
            </div>

            {/* TD, HR, RR each on a separate row */}
            <div className="grid grid-cols-1 gap-4 text-xs font-sans">
              <div className="space-y-1 relative">
                {renderPreviousValueBubble('bp', 'mmHg')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Tanda Darah (TD) / Tensi</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="120/80"
                    value={bp}
                    onFocus={() => setFocusedField('bp')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setBp(e.target.value.replace(/[^0-9/]/g, ''))}
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                  <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 uppercase font-semibold transition-colors">mmHg</span>
                </div>
              </div>

              <div className="space-y-1 relative">
                {renderPreviousValueBubble('hr', 'x/m')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Heart Rate (HR) / Nadi</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="80"
                    value={hr}
                    onFocus={() => setFocusedField('hr')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setHr(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                  <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 uppercase font-semibold transition-colors">kali / menit</span>
                </div>
              </div>

              <div className="space-y-1 relative">
                {renderPreviousValueBubble('rr', 'x/m')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Respiratory Rate (RR) / Napas</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="20"
                    value={rr}
                    onFocus={() => setFocusedField('rr')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setRr(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                  <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 uppercase font-semibold transition-colors">kali / menit</span>
                </div>
              </div>
            </div>

            {/* SpO2, Oxygen Method, LPM */}
            <div className="grid grid-cols-12 gap-2 text-xs">
              <div className="col-span-3 space-y-1 relative">
                {renderPreviousValueBubble('spo2', '%')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block truncate">SpO2 %</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="98"
                    value={spo2}
                    onFocus={() => setFocusedField('spo2')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val === '' || parseInt(val, 10) <= 100) {
                        setSpo2(val);
                      }
                    }}
                    className="w-full px-2 py-2.5 text-sm focus:outline-none font-mono"
                  />
                  <span className="text-xs bg-slate-50 dark:bg-slate-800 px-1 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 select-none transition-colors">%</span>
                </div>
              </div>

              <div className="col-span-6 space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block truncate">Metode Oksigen</label>
                <select
                  value={o2Method}
                  onChange={(e) => setO2Method(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 h-[42px] truncate transition-colors"
                >
                  <option value="Room Air (RA)">Room Air (RA)</option>
                  <option value="Nasal Cannula (NK)">Nasal Cannula (NK)</option>
                  <option value="Non Rebreathing Mask (NRM)">Non Rebreathing Mask</option>
                  <option value="Trakeostomi">Trakeostomi</option>
                  <option value="Ventilator">Ventilator</option>
                </select>
              </div>

              <div className="col-span-3 space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block truncate">Laju LPM</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="3"
                    disabled={['Room Air (RA)', 'Ventilator'].includes(o2Method)}
                    value={lpm}
                    onChange={(e) => setLpm(e.target.value.replace(/[^0-9.,]/g, '').replace(/,/g, '.'))}
                    className="w-full px-2 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 focus:outline-none font-mono transition-colors"
                  />
                  <span className="text-[9px] bg-slate-50 dark:bg-slate-800 px-1 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 uppercase select-none transition-colors">lpm</span>
                </div>
              </div>
            </div>

            {/* Temperature & Lung sounds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1 relative">
                {renderPreviousValueBubble('temp', '°C')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Suhu (Temperature)</label>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-emerald-500 overflow-hidden transition-colors">
                  <input
                    type="text"
                    placeholder="36.5"
                    value={temp}
                    onFocus={() => setFocusedField('temp')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setTemp(e.target.value.replace(/[^0-9.,]/g, '').replace(/,/g, '.'))}
                    className="w-full px-3.5 py-2.5 text-sm focus:outline-none font-mono"
                  />
                  <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 font-semibold transition-colors">°C</span>
                </div>
              </div>

              <div className="space-y-1 relative">
                {renderPreviousValueBubble('lung')}
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Pemeriksaan Paru (SP & ST)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onMouseEnter={() => setFocusedField('lung')}
                    onMouseLeave={() => setFocusedField(null)}
                    onFocus={() => setFocusedField('lung')}
                    onBlur={() => setFocusedField(null)}
                    onClick={() => setShowLungModal(true)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-sans transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{spData || stData ? 'Telah Diperiksa' : 'Belum Diperiksa'}</span>
                    <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors">Check</span>
                  </button>
                  {(spData || stData) && (
                    <button
                      type="button"
                      onClick={() => { setSpData(undefined); setStData(undefined); }}
                      className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-500 rounded-xl px-3 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                      title="Reset Pemeriksaan Paru"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Other Exams consolidated block */}
          <div className="space-y-6">
            {/* Section: Pemeriksaan Lainnya */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Activity className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                <span>Pemeriksaan Lainnya</span>
              </h3>

              {/* Selection Toggles to activate each of the 4 diagnostics */}
              <div className="grid grid-cols-2 gap-2 p-1 select-none font-sans text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !isGdsChecked;
                    setIsGdsChecked(newValue);
                    if (!newValue) setGdsRecommendation(null);
                  }}
                  className={`flex items-center justify-center gap-2 px-2.5 py-3 rounded-xl border font-bold text-xs font-sans transition-all active:scale-[0.98] cursor-pointer ${isGdsChecked
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <span>🧪 Cek GDS</span>
                </button>

                <div className="relative">
                  {renderPreviousValueBubble('ivDrugs')}
                  <button
                    type="button"
                    onMouseEnter={() => setFocusedField('ivDrugs')}
                    onMouseLeave={() => setFocusedField(null)}
                    onFocus={() => setFocusedField('ivDrugs')}
                    onBlur={() => setFocusedField(null)}
                    onClick={() => {
                      setIsOnIVDrug(!isOnIVDrug);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-2.5 py-3 rounded-xl border font-bold text-xs font-sans transition-all active:scale-[0.98] cursor-pointer ${isOnIVDrug
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    <span>💉 Terpasang Drip &amp; Pump?</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUopChecked(!isUopChecked);
                  }}
                  className={`flex items-center justify-center gap-2 px-2.5 py-3 rounded-xl border font-bold text-xs font-sans transition-all active:scale-[0.98] cursor-pointer ${isUopChecked
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <span>💦 Urine Output (UOP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBalanceModal(true)}
                  className={`flex items-center justify-center gap-2 px-2.5 py-3 rounded-xl border font-bold text-xs font-sans transition-all active:scale-[0.98] cursor-pointer ${balanceCairan
                    ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <span>⚖️ Cek Balance Cairan</span>
                </button>
              </div>

              {/* 1. GDS Block */}
              {isGdsChecked && (
                <div className="space-y-3 bg-red-50/10 p-4 rounded-2xl border border-red-100/50 text-xs text-slate-700 font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] transition-colors">Hasil Gula Darah Sewaktu (GDS)</label>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-rose-500 overflow-hidden transition-colors">
                      <input
                        type="text"
                        placeholder="Hasil GDS, misal: 250"
                        value={gdsValue}
                        onChange={(e) => setGdsValue(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3.5 py-2.5 text-sm focus:outline-none font-mono"
                      />
                      <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 font-semibold font-mono transition-colors">mg/dL</span>
                    </div>
                  </div>

                  {gdsRecommendation && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-amber-950 space-y-2 mt-2">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="leading-relaxed">
                          <h5 className="font-bold text-amber-900">Rekomendasi Protokol Terapi GDS</h5>
                          <p className="text-[11px] font-sans opacity-95 whitespace-pre-wrap mt-0.5">{gdsRecommendation.message}</p>
                        </div>
                      </div>

                      {gdsRecommendation.suggestedRate && (
                        <div className="pt-1 select-none flex items-center justify-end">
                          <button
                            type="button"
                            onClick={applyNovorapidDose}
                            className="text-[10px] font-black tracking-tight uppercase bg-amber-600 hover:bg-amber-700 text-white font-sans px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] shadow-sm shadow-amber-600/15"
                          >
                            Terapkan {gdsRecommendation.suggestedRate} cc/jam Novorapid
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Drugs (Drip / Syringe Pump) Block */}
              {isOnIVDrug && (
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-3 font-sans transition-colors">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] transition-colors">Daftar Infus / Syringe Pump:</label>
                  <div className="space-y-3">
                    {ivDrugs.map((item, idx) => (
                      <div key={`drug-row-${idx}`} className="space-y-2 border-b border-dashed border-slate-200/60 pb-3 last:border-0 last:pb-0">
                        <div className="flex gap-2">
                          <select
                            value={item.name}
                            onChange={(e) => handleIvDrugSelectChange(idx, e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-sans focus:outline-none focus:border-teal-500 flex-1 transition-colors"
                          >
                            {CONSTANT_IV_DRUG_OPTIONS.map((opt) => (
                              <option key={`opt-${opt}`} value={opt}>{opt}</option>
                            ))}
                          </select>

                          <div className="w-[120px] flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-teal-500 shrink-0 transition-colors">
                            <input
                              type="text"
                              placeholder="Rate"
                              value={item.rate}
                              onChange={(e) => handleIvDrugRateChange(idx, e.target.value.replace(/[^0-9.,]/g, '').replace(/,/g, '.'))}
                              className="w-full bg-transparent text-slate-800 dark:text-white px-2.5 py-2 text-xs font-sans text-center font-mono placeholder:text-slate-350 dark:placeholder:text-slate-500 focus:outline-none"
                            />
                            <span className="text-[9px] bg-slate-50 dark:bg-slate-800 px-1.5 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 uppercase transition-colors">cc/j</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveIvDrug(idx)}
                            className="p-2 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-650 dark:text-rose-400 shrink-0 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.name === 'Lainnya' && (
                          <input
                            type="text"
                            placeholder="Nama obat IV lainnya..."
                            value={item.customName || ''}
                            onChange={(e) => handleIvDrugCustomNameChange(idx, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-sans transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIvDrug}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100/70 dark:hover:bg-teal-800/50 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Drip atau Pump lain</span>
                  </button>
                </div>
              )}

              {/* 3. Urine Output (UOP) Block */}
              {isUopChecked && (
                <div className="bg-teal-50/40 dark:bg-teal-900/10 p-4 rounded-2xl border border-teal-100/60 dark:border-teal-900/30 text-xs space-y-3 font-sans transition-colors">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] transition-colors">Urine Output (UOP)</label>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-teal-500 overflow-hidden transition-colors">
                      <input
                        type="text"
                        placeholder="Masukkan volume urine, misal: 800"
                        value={uopValue}
                        onChange={(e) => setUopValue(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 py-2.5 text-sm focus:outline-none font-mono"
                      />
                      <span className="text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0 font-semibold font-mono transition-colors">cc/24j</span>
                    </div>
                  </div>

                  {/* Indonesian guide warning tip box as requested */}
                  <div className="bg-white dark:bg-slate-900 border border-teal-100/70 dark:border-teal-800/50 rounded-xl p-3 text-slate-755 dark:text-slate-300 flex gap-2 transition-colors">
                    <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <div className="leading-normal font-sans">
                      <p className="text-[11px] font-semibold text-teal-950 dark:text-teal-300 transition-colors">
                        💡 Tips Penilaian Cepat:
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5 transition-colors">
                        Apabila sulit menghitung cc presisi: <strong className="text-teal-800 dark:text-teal-400 transition-colors">Apakah pasien dalam sehari BAK sampai 1 Aqua sedang (600 cc)?</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Fluid Balance (Balance Cairan) */}
              {balanceCairan && (
                <div className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-900/50 space-y-3 text-xs leading-relaxed font-sans mt-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-400 font-bold transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Balance Cairan Terhitung</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono shrink-0 transition-colors ${(balanceTotalResult || 0) >= 0 ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-300' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-300'
                      }`}>
                      {balanceTotalResult && balanceTotalResult >= 0 ? '+' : ''}{balanceTotalResult} cc
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-teal-100/40 dark:border-teal-800/40 text-slate-600 dark:text-slate-400 transition-colors">
                    <p>Makan: {balanceCairan.makanValue} cc</p>
                    <p>Minum: {balanceCairan.minumValue} cc</p>
                    <p>Infus IVFD: {balanceCairan.ivfdValue} cc</p>
                    <p>Urine (UOP): {balanceCairan.uopValue} cc</p>
                    {balanceCairan.transfusiValue > 0 && <p>Transfusi: {balanceCairan.transfusiValue} cc</p>}
                    {balanceCairan.syringePumpValue > 0 && <p>Syringe Pump: {balanceCairan.syringePumpValue} cc</p>}
                    {balanceCairan.babValue > 0 && <p>BAB: {balanceCairan.babValue} cc</p>}
                    {balanceCairan.muntahValue > 0 && <p>Muntah: {balanceCairan.muntahValue} cc</p>}
                    {balanceCairan.iwl && balanceCairan.iwlValue > 0 && <p>IWL: {balanceCairan.iwlValue} cc</p>}
                  </div>
                  <div className="flex gap-2 pt-2 items-center justify-end select-none">
                    <button
                      type="button"
                      onClick={() => setBalanceCairan(undefined)}
                      className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg text-[10px] uppercase font-black tracking-tight cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBalanceModal(true)}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer transition shadow-sm shadow-teal-600/10"
                    >
                      Sunting CC Cairan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Save / Update panel bottom bar */}
      <div id="patient-form-save-panel" className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-end gap-3.5 select-none pt-4 mt-6 transition-colors">
        <button
          onClick={onCancel}
          type="button"
          className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 text-sm font-semibold transition active:scale-95"
        >
          Kembali ke Menu
        </button>
        <button
          onClick={triggerSave}
          type="button"
          className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 border border-teal-700 text-white text-sm font-extrabold shadow-lg shadow-teal-600/15 flex items-center justify-center gap-2 tracking-tight transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            {patientIndex !== null ? (vitalsIndex !== null ? 'Update TTV' : 'Tambahkan TTV Baru') : 'Simpan Pasien Baru'}
          </span>
        </button>
      </div>

      {/* MODALS INTEGRATION */}
      {showGcsCalculator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <GcsCalculator
            initialGcs={gcsValue}
            onClose={() => setShowGcsCalculator(false)}
            onSave={(val) => {
              setGcsValue(val);
              // Auto fill Compos Mentis if GCS is (E4V5M6)
              if (val === '(E4V5M6)') {
                setSens('Compos mentis');
              }
              setShowGcsCalculator(false);
            }}
          />
        </div>
      )}

      {showBalanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <BalanceCairanModal
            initialData={balanceCairan}
            onClose={() => setShowBalanceModal(false)}
            onSave={(data) => {
              setBalanceCairan(data);
              setShowBalanceModal(false);
            }}
          />
        </div>
      )}

      {showProtocolsRef && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <div className="flex justify-end p-2 mb-1.5">
              <button
                onClick={() => setShowProtocolsRef(false)}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MedicalProtocolsRef />
          </div>
        </div>
      )}

      {showImportOnlineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4">
          <ImportOnlineModal
            onApply={handleApplyOnlineData}
            onClose={() => setShowImportOnlineModal(false)}
            showNotification={showNotification}
          />
        </div>
      )}

      {showRoomModal && (
        <RoomSelectorModal
          onClose={() => setShowRoomModal(false)}
          onSelect={(roomStr) => {
            setRoom(roomStr);
            setShowRoomModal(false);
          }}
        />
      )}

      {showLungModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <LungRegionSelector
            initialSp={spData}
            initialSt={stData}
            onClose={() => setShowLungModal(false)}
            onSave={(sp, st) => {
              setSpData(sp);
              setStData(st);
              setShowLungModal(false);
            }}
          />
        </div>
      )}

      {/* Checklist Alerts Monitoring setting overlays */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-xl font-sans transition-colors">
            <div className="bg-teal-700 p-5 text-white flex items-center justify-between">
              <h4 className="font-extrabold tracking-tight">Atur Parameter Follow Ketat</h4>
              <button onClick={() => setShowFollowModal(false)} className="text-white/60 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-sans max-h-[60vh] overflow-y-auto">
              {/* Checkbox TTV */}
              <div className="space-y-2 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-sm transition-colors">
                  <input
                    type="checkbox"
                    checked={isFollowTtv}
                    onChange={(e) => setIsFollowTtv(e.target.checked)}
                    className="w-4.5 h-4.5 accent-teal-600 rounded"
                  />
                  <span>Tanda Vital (TTV)</span>
                </label>
                {isFollowTtv && (
                  <div className="flex items-center justify-between pt-1 font-medium pl-6 text-slate-705 dark:text-slate-300 transition-colors">
                    <span>Cek per:</span>
                    <select
                      value={followTtvInterval}
                      onChange={(e) => setFollowTtvInterval(e.target.value)}
                      className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                    >
                      {['30 Menit', '1 Jam', '2 Jam', '3 Jam', '4 Jam', '6 Jam', '8 Jam', '12 Jam', '24 Jam'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Checkbox GDS */}
              <div className="space-y-2 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-sm transition-colors">
                  <input
                    type="checkbox"
                    checked={isFollowGds}
                    onChange={(e) => setIsFollowGds(e.target.checked)}
                    className="w-4.5 h-4.5 accent-teal-600 rounded"
                  />
                  <span>Gula Darah Sewaktu (GDS)</span>
                </label>
                {isFollowGds && (
                  <div className="flex items-center justify-between pt-1 font-medium pl-6 text-slate-705 dark:text-slate-300 transition-colors">
                    <span>Cek per:</span>
                    <select
                      value={followGdsInterval}
                      onChange={(e) => setFollowGdsInterval(e.target.value)}
                      className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                    >
                      {['30 Menit', '1 Jam', '2 Jam', '3 Jam', '4 Jam', '6 Jam', '8 Jam', '12 Jam', '24 Jam'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Checkbox UOP */}
              <div className="space-y-2 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-sm transition-colors">
                  <input
                    type="checkbox"
                    checked={isFollowUop}
                    onChange={(e) => setIsFollowUop(e.target.checked)}
                    className="w-4.5 h-4.5 accent-teal-600 rounded"
                  />
                  <span>Urine Output (UOP)</span>
                </label>
                {isFollowUop && (
                  <div className="flex items-center justify-between pt-1 font-medium pl-6 text-slate-750">
                    <span>Cek per:</span>
                    <select
                      value={followUopInterval}
                      onChange={(e) => setFollowUopInterval(e.target.value)}
                      className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                    >
                      {['30 Menit', '1 Jam', '2 Jam', '3 Jam', '4 Jam', '6 Jam', '8 Jam', '12 Jam', '24 Jam'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Checkbox Balance Cairan */}
              <div className="space-y-2 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-sm transition-colors">
                  <input
                    type="checkbox"
                    checked={isFollowBalance}
                    onChange={(e) => setIsFollowBalance(e.target.checked)}
                    className="w-4.5 h-4.5 accent-teal-600 rounded"
                  />
                  <span>Balance Cairan Harian</span>
                </label>
                {isFollowBalance && (
                  <div className="flex items-center justify-between pt-1 font-medium pl-6 text-slate-750">
                    <span>Cek per:</span>
                    <select
                      value={followBalanceInterval}
                      onChange={(e) => setFollowBalanceInterval(e.target.value)}
                      className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none transition-colors"
                    >
                      {['30 Menit', '1 Jam', '2 Jam', '3 Jam', '4 Jam', '6 Jam', '8 Jam', '12 Jam', '24 Jam'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
              <button
                onClick={() => setShowFollowModal(false)}
                className="bg-teal-600 hover:bg-teal-700 active:scale-95 transition text-white text-xs font-bold px-6 py-2 rounded-xl shadow-md shadow-teal-600/10 cursor-pointer"
              >
                Selesai Atur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Directory Patient Picker Modal */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center">
                  <Database className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Pilih Pasien dari Direktori</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pasien dari semua folder yang pernah tersimpan</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama atau No. RM..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {allPatientsDirectory
                .filter(p => {
                  const q = directorySearch.toLowerCase();
                  return !q || p.name.toLowerCase().includes(q) || p.rm.toLowerCase().includes(q) || p.room.toLowerCase().includes(q);
                })
                .map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyFromDirectory(p)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition group"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 text-teal-700 dark:text-teal-300 font-bold text-xs group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition">
                      {(p.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{p.name || '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {p.rm && <span className="text-[11px] text-slate-400 font-mono">RM: {p.rm}</span>}
                        {p.room && <span className="text-[11px] text-slate-400">• {p.room}</span>}
                        <span className="text-[11px] text-slate-400">• {p.gender === 'Laki-laki (L)' ? 'L' : 'P'}, {p.age} th</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition shrink-0">Pilih →</span>
                  </button>
                ))}
              {allPatientsDirectory.filter(p => {
                const q = directorySearch.toLowerCase();
                return !q || p.name.toLowerCase().includes(q) || p.rm.toLowerCase().includes(q) || p.room.toLowerCase().includes(q);
              }).length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Tidak ada pasien ditemukan</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
