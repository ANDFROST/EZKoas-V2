import React, { useState } from 'react';
import { Lightbulb, Layers, Droplet, ShieldAlert, Heart, Activity } from 'lucide-react';

export const MedicalProtocolsRef: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hyper' | 'hypo' | 'gcs'>('hyper');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden font-sans">
      {/* Tab bar header */}
      <div className="bg-slate-50 border-b border-slate-100 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('hyper')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 ${activeTab === 'hyper'
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
            : 'hover:bg-slate-100 text-slate-600'
            }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Protokol Hiperglikemia</span>
        </button>
        <button
          onClick={() => setActiveTab('hypo')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 ${activeTab === 'hypo'
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
            : 'hover:bg-slate-100 text-slate-600'
            }`}
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>Protokol Hipoglikemia</span>
        </button>
        <button
          onClick={() => setActiveTab('gcs')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 ${activeTab === 'gcs'
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
            : 'hover:bg-slate-100 text-slate-600'
            }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Skala Trauma GCS</span>
        </button>
      </div>

      {/* Protocol Contents */}
      <div className="p-6">
        {activeTab === 'hyper' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
                ⚠️
              </span>
              <div>
                <h4 className="text-sm font-black text-rose-950 font-sans">Protokol Novorapid (Mulai Drip jika KGD &gt; 200)</h4>
                <p className="text-xs text-rose-800 mt-1">
                  Encerkan 50 unit Novorapid dalam 50cc NaCl 0.9% dalam syringe pump (Konsentrasi: 1 Unit / 1 cc).
                </p>
              </div>
            </div>

            {/* Sliding Scale Grid */}
            <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 border-b border-slate-100 grid grid-cols-2 p-3 font-bold text-slate-705">
                <span>Kadar Gula Darah (KGDs)</span>
                <span>Dosis Drip Novorapid</span>
              </div>
              <div className="divide-y divide-slate-50">
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span className="font-semibold text-rose-600">&gt; 450 mg/dL</span>
                  <span>Naikkan 1 cc/jam &amp; follow-up KGDs <strong>PER 1 JAM</strong> sampai &lt; 400</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>&gt; 400 mg/dL</span>
                  <span className="font-mono font-bold">6.0 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>351 - 400 mg/dL</span>
                  <span className="font-mono font-bold text-slate-700">3.5 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>301 - 350 mg/dL</span>
                  <span className="font-mono font-bold text-slate-700">3.0 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>251 - 300 mg/dL</span>
                  <span className="font-mono font-bold text-slate-705">2.5 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>201 - 250 mg/dL</span>
                  <span className="font-mono font-bold text-slate-705">2.0 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50">
                  <span>151 - 200 mg/dL</span>
                  <span className="font-mono font-bold text-slate-705">1.0 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50 text-teal-900 bg-teal-50/20">
                  <span>100 - 150 mg/dL</span>
                  <span className="font-mono font-bold">0.5 cc/jam</span>
                </div>
                <div className="grid grid-cols-2 p-3 hover:bg-slate-50 text-amber-900 bg-amber-50">
                  <span className="font-bold">&lt; 100 mg/dL</span>
                  <span className="font-bold text-amber-700 uppercase">STOP DRIP &amp; LAPOR DPJP!</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Catatan Tindakan:</p>
              <p>• Periksa KGDs secara berkala per <strong>3 Jam</strong>, naik-turunkan dosis drip sesuai instruksi di atas.</p>
              <p>• Ambil darah dari vena jika terjadi fluktuasi nilai drastis.</p>
            </div>
          </div>
        )}

        {activeTab === 'hypo' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-sky-50 p-4 rounded-xl border border-sky-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 shrink-0">
                💧
              </span>
              <div>
                <h4 className="text-sm font-black text-sky-950">Protokol Hipoglikemia (Ketika KGDs &lt; 70)</h4>
                <p className="text-xs text-sky-800 mt-1">
                  Koreksi cepat diperlukan demi mencegah kerusakan sel neuron otak permanen akibat neuropenia.
                </p>
              </div>
            </div>

            {/* Hypoglycemia Flow Steps */}
            <div className="space-y-3 font-sans text-xs">
              <div className="relative border-l-2 border-sky-200 pl-4 py-1">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-sky-500" />
                <p className="font-bold text-slate-800">Fase Koreksi Cepat (KGD &lt; 70 mg/dL)</p>
                <p className="text-slate-600 mt-1">
                  Berikan bolus <strong>Dextrose 40% sebanyak 2 flacon (flc)</strong> secara intravena langsung, periksa ulang kadar gula darah setelah <strong>30 menit</strong>.
                </p>
              </div>

              <div className="relative border-l-2 border-sky-200 pl-4 py-1">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-sky-500" />
                <p className="font-bold text-slate-800">Kondisi KGD Masih Rendah</p>
                <p className="text-slate-600 mt-1">
                  Jika kadar gula darah masin di bawah 70 mg/dL, ulangi pemberian <strong>D40% 1 flacon per 30 menit</strong> hingga target gula darah &gt; 70 mg/dL terpenuhi. Setelah tercapai, cek ulang kadar gula per 1 jam.
                </p>
              </div>

              <div className="relative border-l-2 border-sky-100 pl-4 py-1">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-300" />
                <p className="font-bold text-slate-800">Drip Pemeliharaan (KGD 70 - 100 mg/dL)</p>
                <p className="text-slate-600 mt-1">
                  Berikan infus <strong>Dextrose 10% (D10) sebesar 20 drop/menit (gtt/i)</strong> untuk menyuplai glukosa berkelanjutan.
                </p>
              </div>

              <div className="relative pl-4 py-1">
                <div className="absolute -left-[3px] top-2 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="font-bold text-emerald-805">Evaluasi Lanjutan (Jika KGD &gt; 100 mg/dL)</p>
                <p className="text-slate-600 mt-1">
                  Apabila gula darah stabil &gt; 100 mg/dL pada evaluasi per jam, pertahankan drip cairan D10% 20 gtt/i tersebut dan beralih ke pemantauan berkala <strong>setiap 4 jam</strong>.
                  Bila KGD melonjak hingga &gt; 200 mg/dL dalam 4 jam, hentikan (aff) cairan D10% ganti dengan NaCl 0.9% untuk cairan rumatan standar.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gcs' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                🧠
              </span>
              <div>
                <h4 className="text-sm font-black text-emerald-950">Panduan Glasglow Coma Scale (GCS)</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Skor GCS digunakan untuk mengklasifikasikan keparahan cedera otak traumatis secara seragam.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
              <p>• <strong>GCS &le; 8 (Koma)</strong>: Menunjukkan kegagalan refleks protektif jalan napas. Pertimbangkan tindakan <strong>intubasi endotrakeal (ET)</strong> segera untuk mengamankan jalan napas pasien.</p>
              <p>• <strong>Penurunan GCS</strong>: Penurunan skor GCS sebanyak 2 poin atau lebih secara akut merupakan indikator alarm kritis adanya peningkatan tekanan intrakranial (TIK) atau perdarahan intrakranial progresif (misal herniasi tentorial). Segera lapor supervisor penanggung jawab!</p>
              <p>• <strong>Skor GCS 15</strong>: Penilaian skor GCS penuh tetap membutuhkan korelasi klinis yang ketat. Pasien trauma dengan skor 15 bisa saja memiliki cedera intrakranial laten (seperti perdarahan epidural kronis/lucic interval).</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex gap-2 items-center">
              <span className="text-sm">💡</span>
              <p>
                GCS tidak boleh digunakan secara kaku tanpa memandang kondisi pasien yang tersedasi kuat obat penenang (DPO) atau lumpuh otot.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
