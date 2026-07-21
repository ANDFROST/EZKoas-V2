import React, { useState, useEffect } from 'react';
import { SpreadsheetRow, PatientRecord } from '../types';
import { GOOGLE_SHEETS_TTV_WEBAPP_URL, formatTime, normalizeGender, getRowValue, formatSheetDate, mapSheetRowToPatient } from '../utils';
import { Activity, X, Loader2, Clock, HeartPulse, User, Import } from 'lucide-react';

interface RealtimeDashboardModalProps {
  onClose: () => void;
  onImport?: (patients: PatientRecord[]) => void;
}

export const RealtimeDashboardModal: React.FC<RealtimeDashboardModalProps> = ({ onClose, onImport }) => {
  const [dataRows, setDataRows] = useState<SpreadsheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch(GOOGLE_SHEETS_TTV_WEBAPP_URL);
      if (response.ok) {
        const rawData = await response.json();
        const reversed = Array.isArray(rawData) ? rawData.reverse() : rawData;
        setDataRows(reversed);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Gagal menghubungi server.');
      }
    } catch (err) {
      setError('Kesalahan jaringan saat mengunduh data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // Auto-refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);


  const getO2Short = (method: string): string => {
    const m = method.toLowerCase();
    if (m.includes('nasal') || m.includes('nk')) return 'NK';
    if (m.includes('non') || m.includes('nrm')) return 'NRM';
    if (m.includes('room') || m.includes('ra')) return 'RA';
    if (m.includes('vent')) return 'Ventilator';
    if (m.includes('trake')) return 'Trakeostomi';
    return method;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col relative overflow-hidden font-sans">

        {/* Header */}
        <div className="bg-slate-900 p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center relative z-10">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="absolute inset-0 bg-emerald-500/40 rounded-xl blur animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Live Vitals Feed
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {lastUpdated ? `Pembaruan terakhir: ${lastUpdated.toLocaleTimeString()}` : 'Memuat data...'}
                {isRefreshing && ' (Menyegarkan...)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 min-h-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold animate-pulse">Menghubungkan ke server...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
              <p className="font-bold">{error}</p>
            </div>
          ) : dataRows.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold">Belum ada data TTV di server.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dataRows.map((row, idx) => {
                const nameVal = getRowValue(row, ['Nama', 'Name', 'Patient', 'Nama Pasien']);
                const rawGender = getRowValue(row, ['Jenis Kelamin', 'Gender', 'JK']);
                const gender = rawGender ? normalizeGender(rawGender) : null;
                const rmVal = getRowValue(row, ['No RM', 'No. RM', 'RM']);
                const roomVal = getRowValue(row, ['Ruang Rawat', 'Ruang', 'Room']);

                const rawTimeVal = getRowValue(row, ['VitalsTime', 'Waktu', 'Time', 'Waktu TTV']);
                const timeStr = rawTimeVal ? formatTime(rawTimeVal) : '(Tanpa jam)';

                const bp = getRowValue(row, ['BP', 'TD', 'Tekanan Darah']);
                const hr = getRowValue(row, ['HR', 'Heart Rate']);
                const rr = getRowValue(row, ['RR', 'Respiratory Rate']);
                const spo2 = getRowValue(row, ['SpO2', 'SPO2', 'SpO2%']).replace(/%/g, '');
                const temp = getRowValue(row, ['Temp', 'Temperature', 'Suhu']).replace(/[^0-9.]/g, '');

                const gds = getRowValue(row, ['GDSValue', 'GDS', 'Nilai GDS']).replace(/[^0-9.]/g, '');
                const uop = getRowValue(row, ['Nilai UOP', 'UOPValue', 'UOP']).replace(/[^0-9.]/g, '');
                const keluhan = getRowValue(row, ['Keluhan', 'Complaint', 'Notes']);
                const o2Method = getRowValue(row, ['O2Method', 'O2 Method', 'Metode O2']);
                const lpm = getRowValue(row, ['LPM', 'Lpm', 'flow']).replace(/[^0-9.]/g, '');
                const o2Short = o2Method ? getO2Short(o2Method) : '';

                // Date
                const entryDate = getRowValue(row, ['Tanggal', 'Date', 'Timestamp']);
                let lastUpdatedDate = '';
                let lastUpdatedTime = '';

                if (entryDate && entryDate.includes('T')) {
                  const d = new Date(entryDate);
                  if (!isNaN(d.getTime())) {
                    lastUpdatedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    lastUpdatedTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  } else {
                    lastUpdatedDate = entryDate.split('T')[0];
                    lastUpdatedTime = entryDate.split('T')[1].substring(0, 5);
                  }
                } else {
                  lastUpdatedDate = entryDate ? formatSheetDate(entryDate) : '';
                }

                const lastUpdatedStr = `Last Updated ${lastUpdatedDate}${lastUpdatedTime ? ` • ${lastUpdatedTime}` : ''}`;

                // Syringe Pump / IV Drugs
                const rawIvNames = getRowValue(row, ['IVDrugNames', 'IV Drug Names', 'Nama Obat IV', 'ivDrugNames', 'Obat IV']);
                const rawIvRates = getRowValue(row, ['IVDrugRates', 'IV Drug Rates', 'Rate Obat IV', 'ivDrugRates', 'Rate IV', 'Rate', 'Dosis', 'Dosis Obat IV', 'Dosis Obat', 'Rate Obat', 'Rate (cc/jam)', 'Dosis (cc/jam)', 'Kecepatan', 'Rate Obat IV (cc/jam)']);
                const ivDrugNames = rawIvNames ? rawIvNames.split(/[;|/]+/).map((s) => s.trim()).filter(Boolean) : [];
                const ivDrugRates = rawIvRates ? rawIvRates.split(/[;|/]+/).map((s) => s.trim().replace(/,/g, '.')).filter(Boolean) : [];
                const syringePumpList = ivDrugNames.map((name, i) => {
                  const rate = ivDrugRates[i] ? `${ivDrugRates[i]} cc/jam` : '';
                  return `${name} ${rate}`.trim();
                });
                const syringePumpText = syringePumpList.join(', ');
                const bcSyringePumpCc = Number(getRowValue(row, ['BC Syringe Pump Cc', 'bcSyringePumpCc'])) || 0;
                const hasSyringePump = syringePumpList.length > 0 || bcSyringePumpCc > 0;

                // Balance Cairan
                const bcMakan = Number(getRowValue(row, ['BC Makan Value (cc)', 'bcMakanValue'])) || 0;
                const bcMinum = Number(getRowValue(row, ['BC Minum Value (cc)', 'bcMinumValue'])) || 0;
                const bcIvfd = Number(getRowValue(row, ['BC IVFD Value (cc)', 'bcIvfdValue'])) || 0;
                const bcTransfusi = Number(getRowValue(row, ['BC Transfusi Value (cc)', 'bcTransfusiValue'])) || 0;
                const syringePumpValue = Number(getRowValue(row, ['BC Syringe Pump Value (cc)', 'bcSyringePumpValue'])) || 0;

                const bcBab = Number(getRowValue(row, ['BC BAB Value (cc)', 'bcBabValue'])) || 0;
                const bcUop = Number(getRowValue(row, ['BC UOP Value (cc)', 'bcUopValue'])) || 0;
                const bcMuntah = Number(getRowValue(row, ['BC Muntah Value (cc)', 'bcMuntahValue'])) || 0;
                const bcIwl = Number(getRowValue(row, ['BC IWL Value (cc)', 'bcIwlValue'])) || 0;

                const intake = bcMakan + bcMinum + bcIvfd + bcTransfusi + syringePumpValue;
                const output = bcBab + bcUop + bcMuntah + bcIwl;
                const balanceTotal = intake - output;
                const hasBalanceData = intake > 0 || output > 0;

                // Highlight the very first row to emphasize it's the newest
                const isLatest = idx === 0;

                return (
                  <div
                    key={`live-${idx}`}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border ${isLatest ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'} p-4 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{nameVal || 'Tanpa Nama'}</span>
                        {gender && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${gender.startsWith('Laki')
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-pink-500 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30'
                            }`}>
                            {gender.startsWith('Laki') ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        )}
                        {isLatest && (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Terbaru
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          {rmVal && <span>RM: <strong className="text-slate-700 dark:text-slate-300">{rmVal}</strong></span>}
                          {rmVal && roomVal && <span className="opacity-50">•</span>}
                          {roomVal && <span>Ruang: <strong className="text-slate-700 dark:text-slate-300">{roomVal}</strong></span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{lastUpdatedStr}</span>
                        </div>
                        {onImport && (
                          <button
                            onClick={() => onImport([mapSheetRowToPatient(row)])}
                            title="Import TTV ke Antrean"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
                          >
                            <Import className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Import</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {timeStr && timeStr !== '(Tanpa jam)' && (
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                          Waktu: {timeStr}
                        </div>
                      )}
                      {(bp || hr || rr || temp || spo2) && (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          {bp && <span className="flex items-center gap-1"><span className="text-slate-400 font-medium">TD:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{bp}</span></span>}
                          {hr && <span className="flex items-center gap-1"><span className="text-slate-400 font-medium">HR:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{hr}</span></span>}
                          {rr && <span className="flex items-center gap-1"><span className="text-slate-400 font-medium">RR:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{rr}</span></span>}
                          {temp && <span className="flex items-center gap-1"><span className="text-slate-400 font-medium">Suhu:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{temp}°C</span></span>}
                          {spo2 && (
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400 font-medium">SpO2:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {spo2}% {o2Short ? `${o2Short} ${lpm && o2Short !== 'RA' ? `${lpm} lpm` : ''}`.trim() : ''}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                      {(gds || uop || keluhan || hasBalanceData || hasSyringePump) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs pt-1 px-1 mt-1">
                          {gds && <span><span className="text-slate-400 font-medium">GDS:</span> <strong className="text-slate-700 dark:text-slate-200">{gds} mg/dL</strong></span>}
                          {uop && <span><span className="text-slate-400 font-medium">UOP:</span> <strong className="text-slate-700 dark:text-slate-200">{uop} cc</strong></span>}
                          {hasSyringePump && (
                            <span>
                              <span className="text-slate-400 font-medium">Syringe Pump:</span>{' '}
                              <strong className="text-rose-600 dark:text-rose-400">
                                {syringePumpText || `${bcSyringePumpCc} cc/jam`}
                              </strong>
                            </span>
                          )}
                          {hasBalanceData && (
                            <span>
                              <span className="text-slate-400 font-medium">Balance Cairan:</span>
                              <strong className={balanceTotal > 0 ? 'text-blue-600 dark:text-blue-400' : balanceTotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}>
                                {balanceTotal > 0 ? `+${balanceTotal}` : balanceTotal} cc
                              </strong>
                              <span className="text-[10px] text-slate-400 ml-1">(In: {intake}, Out: {output})</span>
                            </span>
                          )}
                          {keluhan && <span className="w-full mt-1"><span className="text-slate-400 font-medium">Keluhan:</span> <span className="text-slate-700 dark:text-slate-200 italic">{keluhan}</span></span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
