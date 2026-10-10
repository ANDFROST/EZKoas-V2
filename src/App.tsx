import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, VitalsEntry, PatientFolder } from './types';
import { formatPatientRecord, formatPatientRecordFormat2, formatTime, GOOGLE_SHEETS_TTV_WEBAPP_URL } from './utils';
import { PatientForm } from './components/PatientForm';
import { PatientList } from './components/PatientList';
import { ImportModal } from './components/ImportModal';
import { RealtimeDashboardModal } from './components/RealtimeDashboardModal';
import { MedicalProtocolsRef } from './components/MedicalProtocolsRef';
import { FeedbackModal } from './components/FeedbackModal';
import {
  Activity,
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
  Sun,
  FolderPlus,
  FolderOpen,
  Folder,
  Trash2,
  Pencil,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronDown,
  MoreVertical
} from 'lucide-react';

const STORAGE_KEY = 'ezkoas_patients_data';

export default function App() {
  const [folders, setFolders] = useState<PatientFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const activeFolder = folders.find(f => f.id === activeFolderId) || null;
  const patients = activeFolder ? activeFolder.patients : [];

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
  const [showRealtimeDashboard, setShowRealtimeDashboard] = useState(false);

  // List filters
  const [filterFolketOnly, setFilterFolketOnly] = useState(false);

  // Copy format template (1 = Format 1 default, 2 = Format 2 nama dulu)
  const [copyFormat, setCopyFormat] = useState<1 | 2>(() => {
    try {
      const stored = localStorage.getItem('ezkoas_copy_format');
      return stored === '2' ? 2 : 1;
    } catch {
      return 1;
    }
  });



  const getFormatter = () => copyFormat === 2 ? formatPatientRecordFormat2 : formatPatientRecord;

  // null = hidden, 1 = show Format 1 example, 2 = show Format 2 example
  const [previewFormat, setPreviewFormat] = useState<null | 1 | 2>(null);
  const togglePreview = (f: 1 | 2) => setPreviewFormat(prev => prev === f ? null : f);

  // Custom Toast notification states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'dev' | 'error' } | null>(null);

  // Active Folder options dropdown menu state
  const [isFolderActionsOpen, setIsFolderActionsOpen] = useState(false);
  const folderActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderActionsRef.current && !folderActionsRef.current.contains(event.target as Node)) {
        setIsFolderActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load patient list on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && !('patients' in parsed[0])) {
            // Legacy migration: array of PatientRecord
            const legacyFolder: PatientFolder = {
              id: 'folder-' + Date.now(),
              name: 'Folder Utama',
              createdAt: Date.now(),
              patients: parsed as PatientRecord[]
            };
            setFolders([legacyFolder]);
            setActiveFolderId(legacyFolder.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyFolder]));
          } else {
            // Modern format: array of PatientFolder
            setFolders(parsed);
            if (parsed.length > 0) {
              setActiveFolderId(parsed[0].id);
            }
          }
        }
      } else {
        // Initial state
        const defaultFolder: PatientFolder = {
          id: 'folder-' + Date.now(),
          name: 'Folder Utama',
          createdAt: Date.now(),
          patients: []
        };
        setFolders([defaultFolder]);
        setActiveFolderId(defaultFolder.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultFolder]));
      }
    } catch (e) {
      console.error('Error loading localStorage data', e);
    }
  }, []);

  // Helper function to update state and synchronize changes with LocalStorage
  const saveFoldersAndPersist = (updatedFolders: PatientFolder[]) => {
    setFolders(updatedFolders);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFolders));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  };

  const savePatientsAndPersist = (updatedList: PatientRecord[]) => {
    if (!activeFolderId) return;
    const updatedFolders = folders.map(f =>
      f.id === activeFolderId ? { ...f, patients: updatedList } : f
    );
    saveFoldersAndPersist(updatedFolders);
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
    const fmt = getFormatter();
    const combined = patients.map((p) => fmt(p)).join('\n\n------------------\n\n');
    navigator.clipboard.writeText(combined);
    triggerNotification(`Berhasil meng-copy ${patients.length} data pasien! (Format ${copyFormat})`, 'success');
  };

  const copyWithIzin = () => {
    if (patients.length === 0) {
      triggerNotification('Tidak ada data pasien untuk disalin.', 'error');
      return;
    }
    const fmt = getFormatter();
    const combined = patients.map((p) => fmt(p)).join('\n\n------------------\n\n');
    const fullText = `Izin kak/bang, izin mengirimkan folket atas nama:\n\n${combined}`;
    navigator.clipboard.writeText(fullText);
    triggerNotification(`Berhasil meng-copy ${patients.length} data pasien + Format Izin! (Format ${copyFormat})`, 'success');
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

    const fmt = getFormatter();
    const combined = folketMatches.map((p) => fmt(p)).join('\n\n------------------\n\n');
    navigator.clipboard.writeText(combined);
    triggerNotification(`Berhasil meng-copy ${folketMatches.length} pasien berlabel Folket! (Format ${copyFormat})`, 'success');
  };

  const copyFolketOnlyWithIzin = () => {
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

    const fmt = getFormatter();
    const combined = folketMatches.map((p) => fmt(p)).join('\n\n------------------\n\n');
    const fullText = `Izin kak/bang, izin mengirimkan folket atas nama:\n\n${combined}`;
    navigator.clipboard.writeText(fullText);
    triggerNotification(`Berhasil meng-copy ${folketMatches.length} pasien Folket + Izin! (Format ${copyFormat})`, 'success');
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Masukkan nama folder baru (contoh: Folket Pagi, ICU, dll):');
    if (folderName && folderName.trim() !== '') {
      const newFolder: PatientFolder = {
        id: 'folder-' + Date.now(),
        name: folderName.trim(),
        createdAt: Date.now(),
        patients: []
      };
      const newFolders = [...folders, newFolder];
      saveFoldersAndPersist(newFolders);
      setActiveFolderId(newFolder.id);
      triggerNotification(`Folder "${newFolder.name}" berhasil dibuat.`, 'success');
    }
  };

  const handleDeleteFolder = () => {
    if (!activeFolder) return;
    if (folders.length <= 1) {
      triggerNotification('Tidak bisa menghapus satu-satunya folder tersisa.', 'error');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus folder "${activeFolder.name}" beserta semua isi data pasien di dalamnya?`)) {
      const newFolders = folders.filter(f => f.id !== activeFolderId);
      saveFoldersAndPersist(newFolders);
      setActiveFolderId(newFolders[0].id);
      triggerNotification(`Folder "${activeFolder.name}" telah dihapus.`, 'success');
    }
  };

  const handleRenameFolder = () => {
    if (!activeFolder) return;
    const newName = prompt('Masukkan nama baru untuk folder ini:', activeFolder.name);
    if (newName && newName.trim() !== '' && newName.trim() !== activeFolder.name) {
      const updatedFolders = folders.map(f =>
        f.id === activeFolderId ? { ...f, name: newName.trim() } : f
      );
      saveFoldersAndPersist(updatedFolders);
      triggerNotification(`Folder berhasil diubah menjadi "${newName.trim()}".`, 'success');
    }
  };

  const resetFolderTtv = () => {
    if (!activeFolder) return;
    if (confirm(`Peringatan: Seluruh data Vitals/TTV di dalam folder "${activeFolder.name}" akan dihapus, tetapi identitas pasien akan dipertahankan. Lanjutkan?`)) {
      const clearedPatients = activeFolder.patients.map(p => ({
        ...p,
        vitals: []
      }));
      savePatientsAndPersist(clearedPatients);
      triggerNotification(`TTV pada folder "${activeFolder.name}" berhasil direset.`, 'success');
    }
  };

  const resetAllData = () => {
    if (
      confirm(
        'SEMUA DATA (FOLDER & PASIEN) YANG TERSIMPAN AKAN DIHAPUS SECARA PERMANEN.\nApakah Anda yakin ingin menghapus seluruh database EZKOAS?'
      )
    ) {
      const defaultFolder: PatientFolder = {
        id: 'folder-' + Date.now(),
        name: 'Folder Utama',
        createdAt: Date.now(),
        patients: []
      };
      saveFoldersAndPersist([defaultFolder]);
      setActiveFolderId(defaultFolder.id);
      triggerNotification('Seluruh data pasien & folder telah dibersihkan secara permanen.', 'success');
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
        bcIwlValue: entry.balanceCairan?.iwlValue?.toString() || '',

        // Pemeriksaan Paru
        spType: entry.sp?.type || '',
        spRegions: entry.sp ? JSON.stringify(entry.sp.regions) : '',
        stRh: entry.st ? JSON.stringify(entry.st.rh) : '',
        stWh: entry.st ? JSON.stringify(entry.st.wh) : '',
        stCrackles: entry.st && entry.st.crackles ? JSON.stringify(entry.st.crackles) : '',
        stPfr: entry.st ? JSON.stringify(entry.st.pleuralFrictionRub) : '',
        stStridor: entry.st ? JSON.stringify(entry.st.stridor) : '',
        stHippocrates: entry.st ? JSON.stringify(entry.st.hippocratesSuccusion) : ''
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
          console.log('Synchronized patient record to database back-office macro successfully.');
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

  const allPatientsDirectory = React.useMemo(() => {
    const map = new Map<string, PatientRecord>();
    folders.forEach(f => {
      f.patients.forEach(p => {
        const key = p.rm ? p.rm : p.name;
        if (key && !map.has(key)) {
          map.set(key, { ...p, vitals: [] });
        }
      });
    });
    return Array.from(map.values());
  }, [folders]);

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
                  V3.3.2
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
              allPatientsDirectory={allPatientsDirectory}
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
                  <div>
                    <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Data Pasien yang Tersimpan</span>
                    {activeFolder && (
                      <span className="ml-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                        📁 {activeFolder.name}
                      </span>
                    )}
                  </div>
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
              {/* Folder Management Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800/50 flex items-center justify-center">
                      <Folder className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Folder</p>
                      <select
                        value={activeFolderId || ''}
                        onChange={(e) => setActiveFolderId(e.target.value)}
                        className="mt-1 bg-transparent text-slate-900 dark:text-white font-extrabold text-lg outline-none cursor-pointer border-b-2 border-transparent hover:border-teal-300 transition"
                      >
                        {folders.map(f => (
                          <option key={f.id} value={f.id} className="text-slate-900">
                            {f.name} ({f.patients.length} Pasien)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Folder Actions Dropdown */}
                  <div className="relative" ref={folderActionsRef}>
                    <button
                      onClick={() => setIsFolderActionsOpen(!isFolderActionsOpen)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition"
                      title="Opsi & Aksi Folder"
                    >
                      <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>

                    {isFolderActionsOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 space-y-0.5">
                        <button
                          onClick={() => { setIsFolderActionsOpen(false); handleCreateFolder(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <FolderPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          New Folder
                        </button>

                        <button
                          onClick={() => { setIsFolderActionsOpen(false); handleRenameFolder(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          Rename Folder
                        </button>

                        <button
                          onClick={() => { setIsFolderActionsOpen(false); resetFolderTtv(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <ListRestart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Reset Folder TTV
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />

                        <button
                          onClick={() => { setIsFolderActionsOpen(false); handleDeleteFolder(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          Hapus Folder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Launcher Cards stack and collided queue-metrics panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Patient registration shortcut standalone button */}
                <button
                  onClick={handleAddNewPatient}
                  className="w-full h-full min-h-[140px] bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-2xl font-extrabold font-sans text-base sm:text-lg tracking-tight transition-all flex flex-col items-center justify-center gap-3 shadow-xl shadow-teal-600/20 border border-teal-500/50 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span>Tambah TTV Pasien Baru</span>
                </button>

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
                    <span className="text-xs bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-800/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800/50 font-extrabold px-3 py-2 rounded-xl transition flex items-center gap-0.5">
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
                    {/* Format Copy Selector */}
                    <div className="px-4 pt-3 pb-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 space-y-2">
                      {/* Label row */}
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">Format Copy</span>
                      </div>
                      {/* Format choice buttons */}
                      <div className="flex gap-2">
                        {/* Format 1 button */}
                        <div className="flex items-stretch gap-1">
                          <button
                            onClick={() => { setCopyFormat(1); try { localStorage.setItem('ezkoas_copy_format', '1'); } catch { } }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg border-2 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${
                              copyFormat === 1
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400'
                            }`}
                          >
                            {copyFormat === 1 && <span className="text-xs">✓</span>}
                            Format 1
                          </button>
                          <button
                            onClick={() => togglePreview(1)}
                            className={`flex items-center px-2 rounded-r-lg border-2 border-l-0 transition-all cursor-pointer focus:outline-none ${
                              copyFormat === 1
                                ? 'bg-teal-600 border-teal-600 text-white/80 hover:text-white hover:bg-teal-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-teal-400 hover:text-teal-600'
                            } ${previewFormat === 1 ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-400 text-teal-600 dark:text-teal-400' : ''}`}
                            title="Lihat contoh Format 1"
                          >
                            {previewFormat === 1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {/* Format 2 button */}
                        <div className="flex items-stretch gap-1">
                          <button
                            onClick={() => { setCopyFormat(2); try { localStorage.setItem('ezkoas_copy_format', '2'); } catch { } }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg border-2 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${
                              copyFormat === 2
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400'
                            }`}
                          >
                            {copyFormat === 2 && <span className="text-xs">✓</span>}
                            Format 2
                          </button>
                          <button
                            onClick={() => togglePreview(2)}
                            className={`flex items-center px-2 rounded-r-lg border-2 border-l-0 transition-all cursor-pointer focus:outline-none ${
                              copyFormat === 2
                                ? 'bg-teal-600 border-teal-600 text-white/80 hover:text-white hover:bg-teal-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-teal-400 hover:text-teal-600'
                            } ${previewFormat === 2 ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-400 text-teal-600 dark:text-teal-400' : ''}`}
                            title="Lihat contoh Format 2"
                          >
                            {previewFormat === 2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {/* Format preview panel */}
                      {previewFormat !== null && (
                        <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Contoh Format {previewFormat}</span>
                          </div>
                          <pre className="font-mono text-[9.5px] leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-wrap px-3 py-2.5">{
                            previewFormat === 1
                              ? `RA4 1.3.2 / 00995599 / SOFYAN / L / 52 thn / 70 kg

TTV
(13:43)
Keluhan: Sesak napas
Sens: CM
TD: 120/80 mmHg
HR: 88 x/i
RR: 20 x/i
SpO2: 99% RA
Temp: 36.5 C`
                              : `SOFYAN / RA4 1.3.2 / L / 00995599 / 52 thn / 70 kg

(13:43)
Sens: CM
TD: 120/80 mmHg
HR: 88 x/i
RR: 20 x/i
Temp: 36.5 C
SpO2: 99% RA
Keluhan: Sesak napas`
                          }</pre>
                        </div>
                      )}
                    </div>

                    {/* Copy Buttons Row */}
                    <div className="p-4 flex flex-wrap gap-2.5 items-center select-none font-sans text-xs">
                      <span className="font-bold text-slate-500 select-none mr-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Salin Masal ke Clipboard:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={copyStandard}
                          className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                        <button
                          onClick={copyFolketOnlyWithIzin}
                          className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                          <span>Copy Folket + Izin</span>
                        </button>
                      </div>

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={resetAllData}
                          className="px-3.5 py-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-750 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-xs cursor-pointer"
                        >
                          Hapus Semua Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Realtime Vitals Dashboard Button */}
                <button
                  onClick={() => setShowRealtimeDashboard(true)}
                  className="w-full bg-slate-900 dark:bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white py-4 px-5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] opacity-20 pointer-events-none" />
                  <Activity className="w-5 h-5 text-emerald-400 group-hover:animate-pulse relative z-10" />
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>Lihat TTV secara Realtime</span>
                    <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none shrink-0">
                      BETA
                    </span>
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute right-6 top-1/2 -translate-y-1/2" />
                </button>

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
                  Dashboard Utama
                </button>
                <button
                  onClick={() => { setActivePane('list'); setIsLeftNavOpen(false); }}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 cursor-pointer ${activePane === 'list' ? 'bg-teal-600 text-white shadow shadow-teal-950/40' : 'text-teal-400 hover:bg-teal-900 hover:text-teal-200'
                    }`}
                >
                  Data Pasien yang Tersimpan ({patients.length})
                </button>
                <button
                  onClick={() => { handleAddNewPatient(); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  Tambah TTV Pasien Baru
                </button>
                <button
                  onClick={() => { setShowImportModal(true); setIsLeftNavOpen(false); }}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-left transition flex items-center gap-2 text-teal-400 hover:bg-teal-900 hover:text-teal-200 cursor-pointer"
                >
                  <span className="flex-1">Import dari Database / Clipboard</span>
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
                  Tentang EZKOAS
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
        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in select-none">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-md w-full border border-slate-150 dark:border-slate-800 shadow-2xl font-sans transition-colors">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex justify-center mb-2">
                <img src={isDarkMode ? "/logo-2.png" : "/logo-1.png"} alt="EZKOAS Logo" className="h-16 w-auto object-contain drop-shadow-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-sans font-medium transition-colors">Versi Web 2.1.0</p>
              </div>
              <p className="text-slate-500 dark:text-slate-300 text-xs leading-relaxed font-medium mt-1 transition-colors">
                EZKOAS merupakan aplikasi yang dibuat oleh seorang mahasiswa kedokteran yang bertujuan untuk membantu teman sejawat dokter muda (Koas) dalam mencatat, mengolah, dan menyerahkan hasil pencatatan berupa tanda vital pasien lengkap dengan panduan dan protokol klinis.
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans transition-colors">
                <p>Copyright © 2026 Andy Sitanggang.</p>
                <p className="mt-0.5">Semua Hak Cipta Dilindungi Undang-Undang.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700 rounded-xl text-slate-705 dark:text-slate-300 font-sans font-bold text-xs transition cursor-pointer"
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

      {showRealtimeDashboard && (
        <RealtimeDashboardModal
          onClose={() => setShowRealtimeDashboard(false)}
          onImport={(importedList) => {
            handleImportCompleted(importedList);
            triggerNotification('Berhasil mengimpor TTV dari Live Feed!', 'success');
          }}
        />
      )}
    </div>
  );
}
