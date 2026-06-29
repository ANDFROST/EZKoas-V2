import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, VitalsEntry } from './types';
import { formatPatientRecord, formatTime, GOOGLE_SHEETS_TTV_WEBAPP_URL } from './utils';
import { PatientForm } from './components/PatientForm';
import { PatientList } from './components/PatientList';
import { ImportModal } from './components/ImportModal';
import { MedicalProtocolsRef } from './components/MedicalProtocolsRef';
import { FeedbackModal } from './components/FeedbackModal';
import {
  Stethoscope,
  Plus,
  Import,
  Copy,
  FolderSync,
  Heart,
  UserCheck,
  Calendar,
  Layers,
  Database,
  Info,
  Gift,
  X,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ListRestart,
  Contact,
  FileText,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  Notebook,
  FileSpreadsheet,
  MessageSquareText,
  Moon,
  Sun
} from 'lucide-react';

const STORAGE_KEY = 'ezkoas_patients_data';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('ezkoas_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('ezkoas_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ezkoas_theme', 'light');
    }
  }, [isDarkMode]);

  // Page tracking: 'dashboard' (home shortcuts menu) | 'list' (queue log timeline) | 'form' (patient form)
  const [activePane, setActivePane] = useState<'dashboard' | 'list' | 'form'>('dashboard');

  // Selected item indexes for editing / sub-entry additions
  const [selectedPatientIdx, setSelectedPatientIdx] = useState<number | null>(null);
  const [selectedVitalsIdx, setSelectedVitalsIdx] = useState<number | null>(null);

  // Left Drawer Menu state for mobile anim block
  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);

  // Overlay states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showProtocolsModal, setShowProtocolsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // List filters
  const [filterFolketOnly, setFilterFolketOnly] = useState(false);

  // Custom Toast notification states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'dev' | 'error' } | null>(null);

  // Load patient list on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPatients(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading localStorage data', e);
    }
  }, []);

  // Helper function to update state and synchronize changes with LocalStorage
  const savePatientsAndPersist = (updatedList: PatientRecord[]) => {
    setPatients(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  };

  // Toast notifier
  const triggerNotification = (message: string, type: 'success' | 'dev' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const floatingMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const workspace = workspaceRef.current;
      const floatingButton = floatingMenuRef.current;

      if (!workspace || !floatingButton) {
        setIsMenuVisible(true);
        return;
      }

      if (activePane === 'form') {
        const savePanel = document.getElementById('patient-form-save-panel');
        if (savePanel) {
          const rect = savePanel.getBoundingClientRect();
          const isNear = rect.top < window.innerHeight - 130;
          setIsMenuVisible(!isNear);
          return;
        }
      } else if (activePane === 'dashboard') {
        const bottomSection = document.getElementById('main-menu-bottom-section');
        if (bottomSection && floatingButton) {
          const btnRect = floatingButton.getBoundingClientRect();
          const secRect = bottomSection.getBoundingClientRect();

          // Check for exact physical overlap (bounding box collision)
          const isOverlapping =
            btnRect.bottom > secRect.top &&
            btnRect.top < secRect.bottom &&
            btnRect.right > secRect.left &&
            btnRect.left < secRect.right;
          setIsMenuVisible(!isOverlapping);
          return;
        }
      }

      setIsMenuVisible(true);
    };

    const workspace = workspaceRef.current;
    if (workspace) {
      workspace.addEventListener('scroll', handleScroll, { passive: true });
      // Run it initially to set correct state
      setTimeout(handleScroll, 100);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      if (workspace) {
        workspace.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
    };
  }, [activePane]);

  // Copy operations
  const copyStandard = () => {
    if (patients.length === 0) {
      triggerNotification('Tidak ada data pasien untuk disalin.', 'error');
      return;
    }
    const combined = patients.map((p) => formatPatientRecord(p)).join('\n\n------------------\n\n');
    navigator.clipboard.writeText(combined);
    triggerNotification(`Berhasil meng-copy ${patients.length} data pasien!`, 'success');
  };

  const copyWithIzin = () => {
    if (patients.length === 0) {
      triggerNotification('Tidak ada data pasien untuk disalin.', 'error');
      return;
    }
    const combined = patients.map((p) => formatPatientRecord(p)).join('\n\n------------------\n\n');
    const fullText = `Izin kak/bang, izin mengirimkan folket atas nama:\n\n${combined}`;
    navigator.clipboard.writeText(fullText);
    triggerNotification(`Berhasil meng-copy ${patients.length} data pasien + Format Izin!`, 'success');
  };

  const copyFolketOnly = () => {
    const folketMatches = patients.filter(
      (p) =>
        (p.name || '').toLowerCase().includes('folket') ||
        (p.room || '').toLowerCase().includes('folket') ||
        p.isFollowTtv || p.isFollowGds || p.isFollowUop || p.isFollowBalance ||
        p.vitals.some((v) => (v.keluhan || '').toLowerCase().includes('folket'))
    );

    if (folketMatches.length === 0) {
      triggerNotification('Tidak ada pasien berlabel "Folket" ditemukan.', 'error');
      return;
    }

    const combined = folketMatches.map((p) => formatPatientRecord(p)).join('\n\n------------------\n\n');
    navigator.clipboard.writeText(combined);
    triggerNotification(`Berhasil meng-copy ${folketMatches.length} pasien berlabel Folket!`, 'success');
  };

  const resetAllData = () => {
    if (
      confirm(
        'SEMUA DATA PASIEN YANG TERSIMPAN AKAN DIHAPUS SECARA PERMANEN.\nApakah Anda yakin ingin menghapus seluruh database EZKOAS?'
      )
    ) {
      savePatientsAndPersist([]);
      triggerNotification('Seluruh data pasien telah dibersihkan secara permanen.', 'success');
    }
  };

  // Add / Edit handlers
  const handleAddNewPatient = () => {
    setSelectedPatientIdx(null);
    setSelectedVitalsIdx(null);
    setActivePane('form');
  };

  const handleAddVitalsLogToPatient = (pIdx: number) => {
    setSelectedPatientIdx(pIdx);
    setSelectedVitalsIdx(null);
    setActivePane('form');
  };

  const handleEditVitalsLogOfPatient = (pIdx: number, vIdx: number) => {
    setSelectedPatientIdx(pIdx);
    setSelectedVitalsIdx(vIdx);
    setActivePane('form');
  };

  const handleDeletePatientRecord = (pIdx: number) => {
    const copy = [...patients];
    copy.splice(pIdx, 1);
    savePatientsAndPersist(copy);
    triggerNotification('Pasien berhasil dihapus.', 'success');
  };

  const handleDeleteVitalsLogOfPatient = (pIdx: number, vIdx: number) => {
    const target = { ...patients[pIdx] };
    const vitalsCopy = [...target.vitals];
    vitalsCopy.splice(vIdx, 1);
    target.vitals = vitalsCopy;

    const copy = [...patients];
    copy[pIdx] = target;
    savePatientsAndPersist(copy);
    triggerNotification('Catatan vitals log berhasil dihapus.', 'success');
  };

  // Synchronise spreadsheet server record in background
  const syncPatientToGSheetsOffline = async (patient: PatientRecord, entry: VitalsEntry) => {
    try {
      const params: Record<string, string> = {
        action: 'save',
        timestamp: new Date().toISOString(),
        room: patient.room || '',
        rm: patient.rm || '',
        name: patient.name || '',
        gender: patient.gender || '',
        age: patient.age || '',
        weight: patient.weight || '',
        height: patient.height || '',
        followTtv: patient.isFollowTtv ? 'true' : 'false',
        followTtvInterval: patient.followTtvInterval || '',
        followGds: patient.isFollowGds ? 'true' : 'false',
        followGdsInterval: patient.followGdsInterval || '',
        followUop: patient.isFollowUop ? 'true' : 'false',
        followUopInterval: patient.followUopInterval || '',
        followBalance: patient.isFollowBalance ? 'true' : 'false',
        followBalanceInterval: patient.followBalanceInterval || '',
        vitalsTime: entry.time || '',
        bp: entry.bp || '',
        sens: entry.sens || '',
        gcs: entry.gcs || '',
        hr: entry.hr || '',
        rr: entry.rr || '',
        spo2: entry.spo2 || '',
        o2Method: entry.o2Method || '',
        lpm: entry.lpm || '',
        temp: entry.temp || '',
        gdsChecked: entry.isGdsChecked ? 'true' : 'false',
        gdsValue: entry.gdsValue || '',
        uopChecked: entry.isUopChecked ? 'true' : 'false',
        uopValue: entry.uopValue || '',
        isOnIVDrug: entry.isOnIVDrug ? 'true' : 'false',
        ivDrugNames: entry.ivDrugNames ? entry.ivDrugNames.join('; ') : '',
        ivDrugRates: entry.ivDrugRates ? entry.ivDrugRates.join('; ') : '',
        keluhan: entry.keluhan || '',
        
        // Balance Cairan
        bcMakanType: entry.balanceCairan?.makanType || '',
        bcMakanCount: entry.balanceCairan?.makanCount?.toString() || '',
        bcMakanValue: entry.balanceCairan?.makanValue?.toString() || '',
        bcMinumOption: entry.balanceCairan?.minumOption || '',
        bcMinumValue: entry.balanceCairan?.minumValue?.toString() || '',
        bcIvfdOption: entry.balanceCairan?.ivfdOption || '',
        bcIvfdValue: entry.balanceCairan?.ivfdValue?.toString() || '',
        bcTransfusiBags: entry.balanceCairan?.transfusiBags?.toString() || '',
        bcTransfusiValue: entry.balanceCairan?.transfusiValue?.toString() || '',
        bcSyringePumpCc: entry.balanceCairan?.syringePumpCc?.toString() || '',
        bcSyringePumpValue: entry.balanceCairan?.syringePumpValue?.toString() || '',
        bcBabType: entry.balanceCairan?.babType || '',
        bcBabCount: entry.balanceCairan?.babCount?.toString() || '',
        bcBabValue: entry.balanceCairan?.babValue?.toString() || '',
        bcUopOption: entry.balanceCairan?.uopOption || '',
        bcUopValue: entry.balanceCairan?.uopValue?.toString() || '',
        bcMuntahCount: entry.balanceCairan?.muntahCount?.toString() || '',
        bcMuntahValue: entry.balanceCairan?.muntahValue?.toString() || '',
        bcIwl: entry.balanceCairan?.iwl ? 'true' : 'false',
        bcIwlValue: entry.balanceCairan?.iwlValue?.toString() || ''
      };

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        formData.append(key, val);
      });

      // Background POST webhook syncing
      fetch(GOOGLE_SHEETS_TTV_WEBAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
        .then(() => {
          console.log('Synchronized patient record to google sheet back-office macro successfully.');
        })
        .catch((e) => {
          console.warn('Sync sheets macro error (benign in client environment):', e);
        });
    } catch (e) {
      // Catch exceptions silently or print developer logging warnings
    }
  };

  // Handle saved form records
  const handleSaveForm = (updatedPatient: PatientRecord, updatedVitals: VitalsEntry) => {
    let copy = [...patients];

    if (selectedPatientIdx !== null) {
      // Editing existing or adding trend vitals to same index
      copy[selectedPatientIdx] = updatedPatient;
    } else {
      // Creating brand new or merging into same RM
      const existingIdx = copy.findIndex((p) => p.rm === updatedPatient.rm && p.rm !== '');
      if (existingIdx !== -1) {
        copy[existingIdx] = updatedPatient;
      } else {
        copy.push(updatedPatient);
      }
    }

    savePatientsAndPersist(copy);
    setActivePane('list');
    triggerNotification('Log klinis pasien berhasil disimpan!', 'success');

    // Trigger asynchronous spreadsheet logger in background after brief delay
    setTimeout(() => {
      syncPatientToGSheetsOffline(updatedPatient, updatedVitals);
    }, 1500);
  };

  // Integration channel imports complete
  const handleImportCompleted = (importedList: PatientRecord[]) => {
    const copy = [...patients];

    importedList.forEach((imported) => {
      if (imported.rm) {
        const existIdx = copy.findIndex((p) => p.rm === imported.rm);
        if (existIdx !== -1) {
          // Merge unique entries to existing patient
          const existing = copy[existIdx];
          existing.room = imported.room || existing.room;
          existing.name = imported.name || existing.name;
          existing.gender = imported.gender || existing.gender;
          existing.age = imported.age || existing.age;
          existing.isFollowTtv = imported.isFollowTtv || existing.isFollowTtv;
          existing.followTtvInterval = imported.followTtvInterval || existing.followTtvInterval;
          existing.isFollowGds = imported.isFollowGds || existing.isFollowGds;
          existing.followGdsInterval = imported.followGdsInterval || existing.followGdsInterval;
          existing.isFollowUop = imported.isFollowUop || existing.isFollowUop;
          existing.followUopInterval = imported.followUopInterval || existing.followUopInterval;
          existing.isFollowBalance = imported.isFollowBalance || existing.isFollowBalance;
          existing.followBalanceInterval = imported.followBalanceInterval || existing.followBalanceInterval;

          // Merge trends securely with no duplicate timestamps
          imported.vitals.forEach((newV) => {
            const isDup = existing.vitals.some((existV) => existV.time === newV.time && existV.bp === newV.bp);
            if (!isDup) existing.vitals.push(newV);
          });
          return;
        }
      }
      copy.push(imported);
    });

    savePatientsAndPersist(copy);
    setShowImportModal(false);
  };

  // Compute stats metrics totals
  const stats = React.useMemo(() => {
    let ttvAlerts = 0;
    let gdsAlerts = 0;
    let uopAlerts = 0;
    let balanceAlerts = 0;

    patients.forEach((p) => {
      if (p.isFollowTtv) ttvAlerts++;
      if (p.isFollowGds) gdsAlerts++;
      if (p.isFollowUop) uopAlerts++;
      if (p.isFollowBalance) balanceAlerts++;
    });

    return {
      total: patients.length,
      ttvAlerts,
      gdsAlerts,
      uopAlerts,
      balanceAlerts,
      totalAlerts: ttvAlerts + gdsAlerts + uopAlerts + balanceAlerts
    };
  }, [patients]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex font-sans selection:bg-teal-100 dark:selection:bg-teal-900 selection:text-teal-900 dark:selection:text-teal-100 overflow-x-hidden transition-colors duration-200">
      {/* Sidebar Navigation Rail (Desktop Only) */}
      <aside className="hidden md:flex w-20 bg-teal-950 flex-col items-center py-8 gap-8 border-r border-teal-900 shrink-0">
        <div
          onClick={() => setActivePane('dashboard')}
          className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/15 text-white cursor-pointer hover:bg-teal-500 transition-all active:scale-95"
          title="Ke Dashboard"
        >
          <img src="/logo-1.png" alt="EZKOAS Logo" className="w-6 h-6 object-contain" />
        </div>
        <nav className="flex flex-col gap-6">
          {/* Dashboard Icon Button */}
          <button
            onClick={() => setActivePane('dashboard')}
            className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${activePane === 'dashboard'
              ? 'bg-teal-900 text-teal-300 shadow-md border border-teal-800/80'
              : 'text-teal-500 hover:text-teal-200 hover:bg-teal-900/30'
              }`}
            title="Dashboard Utama"
          >
            <Compass className="w-5 h-5" />
          </button>

          {/* List / Queue Icon Button */}
          <button
            onClick={() => setActivePane('list')}
            className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${activePane === 'list'
              ? 'bg-teal-900 text-teal-300 shadow-md border border-teal-800/80'
              : 'text-teal-500 hover:text-teal-200 hover:bg-teal-900/30'
              }`}
            title="Daftar Pasien (Ward Rounds Queue)"
          >
            <Contact className="w-5 h-5" />
          </button>

          {/* Add Patient Icon Button */}
          <button
            onClick={handleAddNewPatient}
            className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${activePane === 'form' && selectedPatientIdx === null
              ? 'bg-teal-900 text-teal-300 shadow-md border border-teal-800/80'
              : 'text-teal-500 hover:text-teal-200 hover:bg-teal-900/30'
              }`}
            title="Tambah Pasien Baru"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Sidebar Drawer trigger to reveal Protocols instantly */}
          <button
            onClick={() => setShowProtocolsModal(true)}
            className="p-3 text-teal-500 hover:text-teal-200 hover:bg-teal-900/30 rounded-xl transition-all duration-200 cursor-pointer"
            title="Lihat Kompilasi Cairan / Protokol"
          >
            <Notebook className="w-5 h-5" />
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-5 items-center">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-teal-500 hover:text-teal-200 transition-colors cursor-pointer"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setShowAboutModal(true)}
            className="p-2 text-teal-500 hover:text-teal-200 transition-colors cursor-pointer"
            title="Tentang EZKOAS"
          >
            <Info className="w-4.5 h-4.5" />
          </button>
          <div
            onClick={() => setShowAboutModal(true)}
            className="w-9 h-9 rounded-full bg-teal-900/50 hover:bg-teal-900 flex items-center justify-center text-[10px] font-bold text-teal-300 cursor-pointer border border-teal-800 transition"
          >
            KO
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div ref={workspaceRef} className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {/* Dynamic Top App Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Unified Drawer hamburger trigger button */}
            <button
              onClick={() => setIsLeftNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-950 text-white font-extrabold text-base shadow-xs cursor-pointer hover:bg-teal-900 transition active:scale-95"
              title="Buka Menu Navigasi"
            >
              ☰
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white font-sans tracking-tight leading-none cursor-pointer" onClick={() => setActivePane('dashboard')}>
                  EZKOAS
                </h1>
                <span className="bg-teal-50 border border-teal-100 text-teal-700 font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none">
                  V2.1.0
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-450 font-sans leading-relaxed mt-0.5">
                Aplikasi TTV untuk Koas. Buat TTV  jadi gampang!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Support CTA Button */}
            <button
              onClick={() => setShowSupportModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg shadow-sm font-sans transition-all cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Dukung Saya</span>
            </button>
          </div>
        </header>

        {/* Content viewport area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activePane === 'form' ? (
            /* Pre-designed patient addition and vitals entries form */
            <PatientForm
              patientIndex={selectedPatientIdx}
              vitalsIndex={selectedVitalsIdx}
              savedPatients={patients}
              onCancel={() => setActivePane(selectedPatientIdx !== null ? 'list' : 'dashboard')}
              onSave={handleSaveForm}
              showNotification={triggerNotification}
            />
          ) : activePane === 'list' ? (
            /* Patients rounds queue */
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs select-none flex-wrap gap-3 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                  <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Data Pasien yang Tersimpan</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterFolketOnly(!filterFolketOnly)}
                    className={`px-3 py-2 border text-xs font-bold font-sans rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterFolketOnly ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Tampilkan Pasien Folket
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePane('dashboard')}
                    className="px-4.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ← Kembali ke Dashboard
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <PatientList
                  patients={patients}
                  filterFolketOnly={filterFolketOnly}
                  onAddVitals={handleAddVitalsLogToPatient}
                  onEditVitals={handleEditVitalsLogOfPatient}
                  onDeletePatient={handleDeletePatientRecord}
                  onDeleteVitals={handleDeleteVitalsLogOfPatient}
                  onReorder={savePatientsAndPersist}
                  showNotification={triggerNotification}
                />
              </div>
            </div>
          ) : (
            /* activePane === 'dashboard' - Main Dashboard Menu */
            <div className="space-y-6">
              {/* Launcher Cards stack and collided queue-metrics panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Patient registration shortcut block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex items-center justify-center transition-colors">
                  <button
                    onClick={handleAddNewPatient}
                    className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white py-4 px-6 rounded-xl font-bold font-sans text-sm tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm shadow-teal-600/10 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5 shrink-0" />
                    <span>Tambah TTV Pasien Baru</span>
                  </button>
                </div>

                {/* Collided "Edit / Tambah TTV Pasien" button stack + Total Pasien metric card widget */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 flex flex-col justify-between transition-colors">
                  <button
                    onClick={() => setActivePane('list')}
                    className="w-full text-slate-850 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-6 py-5 text-sm flex items-center justify-between transition cursor-pointer text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">Edit / Tambah TTV Pasien</p>
                        <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">Ubah kembali TTV pasien yang tersimpan</p>
                      </div>
                    </div>
                    <span className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 font-extrabold px-3 py-2 rounded-xl transition flex items-center gap-0.5">
                      Buka Data Pasien yang Tersimpan →
                    </span>
                  </button>

                  <div className="bg-[#f8fafc] dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between gap-4 select-none transition-colors">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Total Pasien Terdaftar</p>
                        <p className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">Jumlah pasien yang terdaftar</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                        {stats.total}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pasien</span>
                    </div>
                  </div>
                </div>

              </div>

              <div id="main-menu-bottom-section" className="space-y-6">

                {/* Fast Copy Toolbar Bar */}
                {patients.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap gap-2.5 items-center select-none font-sans text-xs shadow-xs transition-colors">
                    <span className="font-bold text-slate-500 select-none mr-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Salin Masal ke WhatsApp:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={copyStandard}
                        className="px-3.5 py-2 hover:bg-slate-50 text-slate-700 border border-slate-200 bg-white font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-teal-600" />
                        <span>Copy TTV</span>
                      </button>
                      <button
                        onClick={copyWithIzin}
                        className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copy TTV + Izin</span>
                      </button>
                      <button
                        onClick={copyFolketOnly}
                        className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>Copy Hanya Folket</span>
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={resetAllData}
                        className="px-3.5 py-2 border border-red-200 bg-red-50 text-red-750 font-bold rounded-lg hover:bg-red-100 transition-all text-xs cursor-pointer"
                      >
                        Hapus Semua Data
                      </button>
                    </div>
                  </div>
                )}

                {/* Utility Tools launcher row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] text-slate-700 dark:text-slate-200 py-4 px-5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Import className="w-5 h-5 text-teal-600" />
                    <span>Import dari Database / Clipboard</span>
                    <span className="bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none shrink-0 ml-1">
                      BETA
                    </span>
                  </button>

                  <button
                    onClick={() => setShowProtocolsModal(true)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] text-slate-700 dark:text-slate-200 py-4 px-5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>Panduan dan Protokol</span>
                  </button>
                </div>

                {/* Support CTA Banner */}
                <div className="bg-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden font-sans border border-teal-900 select-none">
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="max-w-2xl">
                    <h4 className="text-base sm:text-lg font-black flex items-center gap-2 text-white">
                      <Heart className="w-5 h-5 text-rose-400 animate-pulse" /> Apakah Anda Terbantu?
                    </h4>
                    <p className="text-xs text-teal-200 leading-relaxed mt-2.5 font-medium">
                      EZKOAS dibangun secara mandiri dan sukarela oleh Andy Sitanggang untuk membantu dan memudahkan teman sejawat koas agar dapat mencatat, mengolah, dan menyampaikan hasil pencatatan TTV dengan efisien dan mudah. Apabila Anda merasa terbantu dan ingin mendukung pengembangan aplikasi ini ataupun aplikasi baru kedepannya dapat menyampaikan dukungannya melalui tombol donasi dibawah ini!
                    </p>
                    <button
                      onClick={() => setShowSupportModal(true)}
                      className="bg-[#009baf] hover:bg-[#008ba0] active:scale-95 text-white font-black font-sans text-xs tracking-tight py-3 px-6 rounded-xl mt-5 transition shadow-lg shadow-cyan-950/10 cursor-pointer uppercase"
                    >
                      BANTU SAYA TERUS BERKARYA →
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </main>

        {/* Floating Menu Drawer Trigger button */}
        <button
          ref={floatingMenuRef}
          onClick={() => setIsLeftNavOpen(true)}
          className={`fixed left-4 hover:left-5 bottom-8 z-40 bg-teal-950 hover:bg-teal-900 border border-teal-800 text-white rounded-full py-3 px-4.5 font-sans font-extrabold text-xs shadow-xl active:scale-95 flex items-center gap-1.5 cursor-pointer transition-all duration-300 ${isMenuVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
        >
          <span>☰</span>
          <span>Menu &amp; Protokol</span>
        </button>

        {/* SLIDING LEFT NAVIGATION SIDE DRAWER PANEL */}
        {isLeftNavOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Dark outside backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 transition-opacity backdrop-blur-xs cursor-pointer"
              onClick={() => setIsLeftNavOpen(false)}
            />

            {/* Slide drawer body */}
            <div className="relative w-80 max-w-[90%] bg-teal-950 border-r border-teal-900 text-teal-100 flex flex-col p-6 shadow-2xl h-full z-10 overflow-y-auto font-sans">
              <div className="flex items-center justify-between border-b border-teal-850 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <img src="/logo-2.png" alt="EZKOAS Logo" className="h-6 w-auto object-contain" />
                  <span className="font-extrabold text-base tracking-tight text-white font-sans">Menu Utama</span>
                </div>
                <button
                  onClick={() => setIsLeftNavOpen(false)}
                  className="p-1 px-2.5 bg-teal-900 hover:bg-teal-850 rounded-lg text-teal-300 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="flex flex-col gap-2 mb-8 select-none">
                <button
                  onClick={() => { setActivePane('dashboard'); setIsLeftNavOpen(false); }}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 cursor-pointer ${activePane === 'dashboard' ? 'bg-teal-600 text-white shadow shadow-teal-950/40' : 'text-teal-400 hover:bg-teal-900 hover:text-teal-200'
                    }`}
                >
                  • Dashboard Utama
                </button>
                <button
                  onClick={() => { setActivePane('list'); setIsLeftNavOpen(false); }}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 cursor-pointer ${activePane === 'list' ? 'bg-teal-600 text-white shadow shadow-teal-950/40' : 'text-teal-400 hover:bg-teal-900 hover:text-teal-200'
                    }`}
                >
                  • Data Pasien yang Tersimpan ({patients.length})
                </button>
                <button
                  onClick={() => { handleAddNewPatient(); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  • Tambah TTV Pasien Baru
                </button>
                <button
                  onClick={() => { setShowImportModal(true); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  <span className="flex-1">• Import dari Database / Clipboard</span>
                  <span className="bg-amber-400/10 border border-amber-500/20 text-amber-400 font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none shrink-0">
                    BETA
                  </span>
                </button>
                <button
                  onClick={() => { setIsDarkMode(!isDarkMode); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />} 
                  {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                </button>
                <button
                  onClick={() => { setShowAboutModal(true); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  • Tentang EZKOAS
                </button>
                <button
                  onClick={() => { setShowFeedbackModal(true); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer mt-2 border border-teal-800/50 bg-teal-900/30"
                >
                  <MessageSquareText className="w-3.5 h-3.5 shrink-0" /> Masukan dan Saran
                </button>
              </nav>

              {/* COMPILATION TEORI PROTOKOL modal trigger inside Left Navigation sidebar panel! */}
              <div className="mt-auto pt-4 border-t border-teal-900">
                <button
                  onClick={() => { setShowProtocolsModal(true); setIsLeftNavOpen(false); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/30"
                >
                  📚 Teori &amp; Protokol
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global custom Toast notifier absolute alert box */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-white text-xs max-w-sm flex items-center gap-3 shadow-xl">
            <span className="text-base">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="font-sans leading-tight">
              <p className="font-extrabold text-slate-100">Alert</p>
              <p className="text-slate-300 font-medium text-[11px] mt-0.5">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition ml-auto shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS OVERLAYS */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="max-w-2xl w-full flex flex-col max-h-[96vh] sm:max-h-full">
            <div className="flex justify-end mb-1 shrink-0">
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ImportModal
                onImportCompleted={handleImportCompleted}
                onClose={() => setShowImportModal(false)}
                showNotification={triggerNotification}
              />
            </div>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full border border-slate-100 shadow-2xl font-sans">
            <div className="bg-teal-950 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <Heart className="w-10 h-10 text-rose-400 mx-auto animate-pulse mb-3" />
              <h3 className="text-lg font-black tracking-tight font-sans">Apakah Anda merasa terbantu?</h3>
              <p className="text-teal-300 text-xs mt-1 font-sans">Dukung saya untuk terus berkarya!</p>
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium">
                EZKOAS dibangun secara mandiri dan sukarela oleh Andy Sitanggang untuk membantu dan memudahkan teman sejawat koas agar dapat mencatat, mengolah, dan menyampaikan hasil pencatatan TTV dengan efisien dan mudah. Apabila Anda merasa terbantu dan ingin mendukung pengembangan aplikasi ini ataupun aplikasi baru kedepannya dapat menyampaikan dukungannya melalui tombol donasi dibawah ini!
              </p>
              <div className="bg-teal-50 border border-teal-100 p-4.5 rounded-2xl font-extrabold text-[15px] font-mono text-teal-800">
                saweria.co/andfrost
              </div>
              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="w-full py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 font-sans text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
                <a
                  href="https://saweria.co/andfrost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold font-sans text-xs transition rounded-xl flex items-center justify-center gap-1 shadow-md shadow-teal-650/10 uppercase"
                >
                  DONASI
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex flex-col items-center justify-center p-2 sm:p-4 select-none">
          <FeedbackModal
            onClose={() => setShowFeedbackModal(false)}
            showNotification={triggerNotification}
          />
        </div>
      )}

      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full border border-slate-150 shadow-2xl font-sans">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex justify-center mb-2">
                <img src="/logo-1.png" alt="EZKOAS Logo Gelap" className="h-16 w-auto object-contain drop-shadow-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mt-1 font-sans font-medium">Versi Web 2.1.0</p>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-medium mt-1">
                EZKOAS merupakan aplikasi yang dibuat oleh seorang mahasiswa kedokteran yang bertujuan untuk membantu teman sejawat dokter muda (Koas) dalam mencatat, mengolah, dan menyerahkan hasil pencatatan berupa tanda vital pasien lengkap dengan panduan dan protokol klinis.
              </p>
              <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-medium font-sans">
                <p>Copyright © 2026 Andy Sitanggang.</p>
                <p className="mt-0.5">Semua Hak Cipta Dilindungi Undang-Undang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-205 rounded-xl text-slate-705 font-sans font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showProtocolsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <div className="flex justify-end p-2 mb-1.5">
              <button
                onClick={() => setShowProtocolsModal(false)}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
              <MedicalProtocolsRef />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
