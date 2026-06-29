import React, { useState } from 'react';
import { Cloud, Search, X, UserCheck, Loader2 } from 'lucide-react';
import { GOOGLE_SHEETS_SCRIPT_URL, normalizeGender } from '../utils';

interface SpreadsheetRow {
  [key: string]: any;
}

export interface ImportOnlineResult {
  name: string;
  rm: string;
  room: string;
  gender: 'Laki-laki (L)' | 'Perempuan (P)';
  age: string;
}

interface ImportOnlineModalProps {
  onApply: (data: ImportOnlineResult) => void;
  onClose: () => void;
  showNotification: (msg: string, type: 'success' | 'dev' | 'error') => void;
}

export const ImportOnlineModal: React.FC<ImportOnlineModalProps> = ({
  onApply,
  onClose,
  showNotification
}) => {
  const [searchName, setSearchName] = useState('');
  const [searchRm, setSearchRm] = useState('');
  const [searchRoom, setSearchRoom] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Data cache
  const [loadedRows, setLoadedRows] = useState<SpreadsheetRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<SpreadsheetRow[]>([]);

  // Selected state
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!searchName.trim() && !searchRm.trim() && !searchRoom.trim()) {
      showNotification('Harap isi minimal satu kriteria pencarian!', 'error');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSelectedRowIndex(null);

    let rows = loadedRows;
    if (rows.length === 0) {
      try {
        const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
        if (response.ok) {
          rows = await response.json();
          setLoadedRows(rows);
        } else {
          showNotification('Gagal menghubungi server database.', 'error');
          setIsLoading(false);
          return;
        }
      } catch (e) {
        showNotification('Kesalahan jaringan saat mengunduh database.', 'error');
        setIsLoading(false);
        return;
      }
    }

    // Fungsi helper: Abaikan spasi, abaikan titik, kecilkan semua huruf
    const normalizeForSearch = (s: string) => {
      return String(s || '').replace(/[\s.]/g, '').toLowerCase();
    };

    const qName = normalizeForSearch(searchName);
    const qRm = normalizeForSearch(searchRm);
    const qRoom = normalizeForSearch(searchRoom);

    const matches = rows.filter((row) => {
      const dbName = normalizeForSearch(row.Nama || row.Name || row.Patient || '');
      const dbRm = normalizeForSearch(row['No RM'] || row['No. RM'] || row.RM || '');
      const dbRoom = normalizeForSearch(row.Ruangan || row['Ruang Rawat'] || row.Room || '');

      let isMatch = true;
      if (qName && !dbName.includes(qName)) isMatch = false;
      if (qRm && !dbRm.includes(qRm)) isMatch = false;
      if (qRoom && !dbRoom.includes(qRoom)) isMatch = false;

      return isMatch;
    });

    setFilteredRows(matches);
    setIsLoading(false);

    if (matches.length === 0) {
      showNotification('Tidak ada pasien yang cocok dengan kriteria tersebut.', 'error');
    }
  };

  const handleApply = () => {
    if (selectedRowIndex === null || !filteredRows[selectedRowIndex]) {
      showNotification('Pilih salah satu pasien terlebih dahulu.', 'error');
      return;
    }

    const row = filteredRows[selectedRowIndex];

    // Pemetaan data yang fleksibel berdasarkan format kolom Spreadsheet
    const finalData: ImportOnlineResult = {
      name: String(row.Nama || row.Name || row.Patient || '').trim(),
      rm: String(row['No RM'] || row['No. RM'] || row.RM || '').trim(),
      room: String(row.Ruangan || row['Ruang Rawat'] || row.Room || '').trim(),
      age: String(row.Umur || row.Usia || row.Age || '').trim(),
      gender: normalizeGender(String(row['Jenis Kelamin'] || row.Gender || row.Sex || 'Laki-laki (L)'))
    };

    onApply(finalData);
    showNotification('Identitas pasien berhasil diterapkan!', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full mx-auto overflow-hidden font-sans flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-colors">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-between shrink-0 transition-colors">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 transition-colors">
            Pencarian Identitas Database
            <span className="bg-amber-100 border border-amber-200 text-amber-700 font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full leading-none shrink-0">BETA</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 transition-colors">
            <strong className="text-amber-600">Proses pengembangan, sementara hanya pasien RA3 dan RA4</strong>
          </p>
        </div>
        <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center shrink-0">
          <Cloud className="w-5 h-5 text-teal-600" />
        </div>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Form Filter */}
        <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 transition-colors">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest transition-colors">Nama Pasien</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="Nama Pasien"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest transition-colors">No. RM</label>
            <input
              type="text"
              value={searchRm}
              onChange={(e) => setSearchRm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="Misal: 00998877"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest transition-colors">Ruangan</label>
            <input
              type="text"
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="Misal: RA3 2.1.1"
            />
          </div>
        </div>

        {/* Cari Button */}
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isLoading ? 'Mencari ke Server...' : 'Cari Pasien'}
        </button>

        {/* Hasil Pencarian */}
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-colors">
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 transition-colors">
            Hasil Pencarian {hasSearched && !isLoading ? `(${filteredRows.length} ditemukan)` : ''}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {!hasSearched && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <Cloud className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-semibold">Tentukan kriteria lalu klik Cari.</p>
              </div>
            )}

            {hasSearched && !isLoading && filteredRows.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-semibold">Data tidak ditemukan.</p>
                <p className="text-[10px] text-center max-w-xs mt-1">Coba kurangi kriteria yang spesifik atau periksa penulisan.</p>
              </div>
            )}

            {filteredRows.map((row, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRowIndex(idx)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${selectedRowIndex === idx
                  ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedRowIndex === idx ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                  }`}>
                  {selectedRowIndex === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate transition-colors">
                    {row.Nama || row.Name || row.Patient || '(Tanpa Nama)'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium transition-colors">
                    {row.Ruangan || row['Ruang Rawat'] || row.Room ? `🚪 ${row.Ruangan || row['Ruang Rawat'] || row.Room}` : ''}
                    <span className="mx-2">•</span>
                    RM: {row['No RM'] || row['No. RM'] || row.RM || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Button handlers bar */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0 transition-colors">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 text-xs sm:text-sm font-semibold transition"
        >
          Batal
        </button>
        <button
          onClick={handleApply}
          disabled={selectedRowIndex === null}
          className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center gap-2 ${selectedRowIndex !== null
            ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-md shadow-teal-600/20 cursor-pointer'
            : 'bg-slate-300 cursor-not-allowed'
            }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Terapkan Identitas</span>
        </button>
      </div>
    </div>
  );
};
