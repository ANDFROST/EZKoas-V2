import React, { useState } from 'react';
import { ShieldAlert, BookOpen, Check, RefreshCw } from 'lucide-react';

interface GcsCalculatorProps {
  initialGcs?: string;
  onSave: (gcsString: string) => void;
  onClose: () => void;
}

const eyeOptions = [
  { label: 'Spontan (+4)', value: 4 },
  { label: 'Terhadap suara (+3)', value: 3 },
  { label: 'Terhadap nyeri (+2)', value: 2 },
  { label: 'Tidak ada (+1)', value: 1 },
  { label: 'NT (Not Testable) (0)', value: 0 },
];

const verbalOptions = [
  { label: 'Orientasi baik (+5)', value: 5 },
  { label: 'Bingung (+4)', value: 4 },
  { label: 'Kata tidak sesuai (+3)', value: 3 },
  { label: 'Suara tidak dimengerti (+2)', value: 2 },
  { label: 'Tidak ada (+1)', value: 1 },
  { label: 'NT (Not Testable) (0)', value: 0 },
];

const motorOptions = [
  { label: 'Mematuhi perintah (+6)', value: 6 },
  { label: 'Melokalisasi nyeri (+5)', value: 5 },
  { label: 'Menarik diri (+4)', value: 4 },
  { label: 'Fleksi abnormal (+3)', value: 3 },
  { label: 'Ekstensi abnormal (+2)', value: 2 },
  { label: 'Tidak ada (+1)', value: 1 },
  { label: 'NT (Not Testable) (0)', value: 0 },
];

export const GcsCalculator: React.FC<GcsCalculatorProps> = ({ initialGcs, onSave, onClose }) => {
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);

  // Parse GCS initial jika valid, misal (E4V5M6)
  React.useEffect(() => {
    if (initialGcs) {
      const match = initialGcs.match(/E(\d|NT)V(\d|NT)M(\d|NT)/i);
      if (match) {
        const eStr = match[1];
        const vStr = match[2];
        const mStr = match[3];

        setEye(eStr === 'NT' ? 0 : parseInt(eStr, 10));
        setVerbal(vStr === 'NT' ? 0 : parseInt(vStr, 10));
        setMotor(mStr === 'NT' ? 0 : parseInt(mStr, 10));
      }
    }
  }, [initialGcs]);

  const handleSave = () => {
    if (eye !== null && verbal !== null && motor !== null) {
      const eText = eye === 0 ? 'NT' : eye.toString();
      const vText = verbal === 0 ? 'NT' : verbal.toString();
      const mText = motor === 0 ? 'NT' : motor.toString();
      onSave(`(E${eText}V${vText}M${mText})`);
    }
  };

  const totalScore = (eye || 0) + (verbal || 0) + (motor || 0);
  const isAllSelected = eye !== null && verbal !== null && motor !== null;

  let classification = '';
  let classificationColor = 'text-gray-600 bg-gray-50 border-gray-200';

  if (isAllSelected) {
    if (eye === 0 || verbal === 0 || motor === 0) {
      classification = 'Skor parsial (Ada komponen NT)';
      classificationColor = 'text-amber-600 bg-amber-50 border-amber-200';
    } else if (totalScore >= 13 && totalScore <= 15) {
      classification = 'Cedera Kepala Ringan (CKR)';
      classificationColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    } else if (totalScore >= 9 && totalScore <= 12) {
      classification = 'Cedera Kepala Sedang (CKS)';
      classificationColor = 'text-amber-600 bg-amber-50 border-amber-200';
    } else if (totalScore >= 3 && totalScore <= 8) {
      classification = 'Cedera Kepala Berat (CKB) / Koma';
      classificationColor = 'text-rose-600 bg-rose-50 border-rose-200';
    }
  }

  const handleReset = () => {
    setEye(null);
    setVerbal(null);
    setMotor(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Kalkulator GCS</h2>
          <p className="text-emerald-100 text-sm mt-1">Glasgow Coma Scale - Dinilai berdasarkan tanggapan pasien</p>
        </div>
        <button
          onClick={handleReset}
          className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-emerald-50 transition flex items-center gap-1 text-xs"
          title="Reset"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Eye */}
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
              <span className="font-sans font-bold text-emerald-800 text-sm">Respon Mata (Eye - E)</span>
            </div>
            <div className="space-y-2">
              {eyeOptions.map((opt) => {
                const selected = eye === opt.value;
                return (
                  <button
                    key={`eye-${opt.value}`}
                    onClick={() => setEye(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-sans flex items-center justify-between transition-all ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-medium shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verbal */}
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
              <span className="font-sans font-bold text-emerald-800 text-sm">Respon Verbal (Verbal - V)</span>
            </div>
            <div className="space-y-2">
              {verbalOptions.map((opt) => {
                const selected = verbal === opt.value;
                return (
                  <button
                    key={`verbal-${opt.value}`}
                    onClick={() => setVerbal(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-sans flex items-center justify-between transition-all ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-medium shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motoric */}
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
              <span className="font-sans font-bold text-emerald-800 text-sm">Respon Motorik (Motoric - M)</span>
            </div>
            <div className="space-y-2">
              {motorOptions.map((opt) => {
                const selected = motor === opt.value;
                return (
                  <button
                    key={`motor-${opt.value}`}
                    onClick={() => setMotor(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-sans flex items-center justify-between transition-all ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-medium shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Score display area */}
        {isAllSelected && (
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${classificationColor}`}>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-75">Hasil Perhitungan</p>
              <h3 className="text-3xl font-extrabold font-mono mt-1">
                GCS {eye === 0 || verbal === 0 || motor === 0 ? 'NT' : totalScore}
                <span className="text-lg font-normal ml-3 text-slate-600">
                  (E{eye === 0 ? 'NT' : eye}V{verbal === 0 ? 'NT' : verbal}M{motor === 0 ? 'NT' : motor})
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-sans font-bold leading-tight">{classification}</span>
            </div>
          </div>
        )}

        {/* Clinical Info Box */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 text-sky-950 text-xs leading-relaxed space-y-2 font-sans">
          <div className="flex items-center gap-2 text-sky-800 font-bold mb-1">
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>Interpretasi Klinis GCS</span>
          </div>
          <p>
            Glasgow Coma Score dihitung dengan menjumlahkan poin dari komponen Eye (Mata), Verbal, dan Motoric (Motorik).
            Apabila salah satu komponen tidak dapat dinilai (karena cedera lokal, pembengkakan parah, intubasi, dsb),
            pilih <strong>NT (Not Testable) (0)</strong> untuk mendokumentasikannya dengan benar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
            <div className="bg-emerald-100/50 p-2 rounded-lg text-emerald-900 border border-emerald-200/50">
              🟢 Skor 13-15 : Cedera Kepala Ringan (CKR)
            </div>
            <div className="bg-amber-100/50 p-2 rounded-lg text-amber-900 border border-amber-200/50">
              🟡 Skor 9-12 : Cedera Kepala Sedang (CKS)
            </div>
            <div className="bg-rose-100/50 p-2 rounded-lg text-rose-900 border border-rose-200/50">
              🔴 Skor 3-8 : Cedera Kepala Berat (CKB) / Koma
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 font-sans text-sm font-medium text-slate-700 transition"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!isAllSelected}
          className={`px-6 py-2.5 rounded-xl font-sans text-sm font-semibold text-white transition flex items-center gap-2 ${
            isAllSelected
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10 active:scale-[0.98]'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Simpan / Hitung GCS
        </button>
      </div>
    </div>
  );
};
