import React, { useState } from 'react';
import { SuaraPernapasan, SuaraTambahan, LungRegion, SpStatus } from '../types';
import { X, Save, CheckSquare, RotateCcw } from 'lucide-react';

interface LungRegionSelectorProps {
  initialSp?: SuaraPernapasan;
  initialSt?: SuaraTambahan;
  onClose: () => void;
  onSave: (sp: SuaraPernapasan, st: SuaraTambahan) => void;
}

const DEFAULT_SP: SuaraPernapasan = {
  type: '',
  regions: {
    apexRight: 'Normal', midRight: 'Normal', lowerRight: 'Normal',
    apexLeft: 'Normal', midLeft: 'Normal', lowerLeft: 'Normal'
  }
};

const DEFAULT_ST: SuaraTambahan = {
  rh: { right: false, left: false },
  wh: { right: false, left: false },
  pleuralFrictionRub: { right: false, left: false },
  stridor: { right: false, left: false },
  hippocratesSuccusion: { right: false, left: false },
};

type StField = 'rh' | 'wh' | 'pleuralFrictionRub' | 'stridor' | 'hippocratesSuccusion';

const ST_FIELDS: { key: StField; label: string; shortLabel: string; color: string; activeColor: string }[] = [
  { key: 'rh', label: 'Ronkhi', shortLabel: 'Rh', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', activeColor: 'bg-rose-500 text-white' },
  { key: 'wh', label: 'Wheezing', shortLabel: 'Wh', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', activeColor: 'bg-amber-500 text-white' },
  { key: 'pleuralFrictionRub', label: 'PFR', shortLabel: 'PFR', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', activeColor: 'bg-purple-500 text-white' },
  { key: 'stridor', label: 'Stridor', shortLabel: 'Str', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', activeColor: 'bg-blue-500 text-white' },
  { key: 'hippocratesSuccusion', label: 'Hippoc. Succ.', shortLabel: 'HS', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500', activeColor: 'bg-teal-600 text-white' },
];

export const LungRegionSelector: React.FC<LungRegionSelectorProps> = ({ initialSp, initialSt, onClose, onSave }) => {
  const [sp, setSp] = useState<SuaraPernapasan>(initialSp || DEFAULT_SP);
  const [st, setSt] = useState<SuaraTambahan>(initialSt || DEFAULT_ST);
  const [activeTab, setActiveTab] = useState<'SP' | 'ST'>('SP');

  const handleSpTypeChange = (type: SuaraPernapasan['type']) => setSp({ ...sp, type });

  const handleSpRegionToggle = (region: LungRegion) => {
    const current = sp.regions[region];
    let next: SpStatus = 'Normal';
    if (current === 'Normal') next = 'Melemah';
    else if (current === 'Melemah') next = 'Menguat';
    setSp({ ...sp, regions: { ...sp.regions, [region]: next } });
  };

  const toggleAllSide = (side: 'Right' | 'Left') => {
    const regions = ['apex', 'mid', 'lower'].map(p => `${p}${side}` as LungRegion);
    const allMelemah = regions.every(r => sp.regions[r] === 'Melemah');
    const target: SpStatus = allMelemah ? 'Normal' : 'Melemah';
    setSp(prev => {
      const newRegions = { ...prev.regions };
      regions.forEach(r => { newRegions[r] = target; });
      return { ...prev, regions: newRegions };
    });
  };

  const handleStSideToggle = (field: StField, side: 'right' | 'left') => {
    setSt(prev => ({
      ...prev,
      [field]: { ...prev[field], [side]: !(prev[field] as { right: boolean; left: boolean })[side] }
    }));
  };

  const resetSP = () => setSp(DEFAULT_SP);
  const resetST = () => setSt(DEFAULT_ST);

  // SP grid: rows ordered Left first, Right second (Sinistra di kiri layar, Dextra di kanan)
  const SP_GRID_ORDER: LungRegion[] = [
    'apexLeft', 'apexRight',
    'midLeft', 'midRight',
    'lowerLeft', 'lowerRight',
  ];

  const getRegionLabel = (region: LungRegion) => {
    if (region.startsWith('apex')) return 'Apex';
    if (region.startsWith('mid')) return 'Mid';
    return 'Basal';
  };

  // Formatted ST preview (sinistra/dextra)
  const stPreviewParts: string[] = [
    `Rh (${st.rh.left ? '+' : '-'}/${st.rh.right ? '+' : '-'})`,
    `Wh (${st.wh.left ? '+' : '-'}/${st.wh.right ? '+' : '-'})`,
  ];
  if (st.pleuralFrictionRub.left || st.pleuralFrictionRub.right) {
    stPreviewParts.push(`PFR (${st.pleuralFrictionRub.left ? '+' : '-'}/${st.pleuralFrictionRub.right ? '+' : '-'})`);
  }
  if (st.stridor.left || st.stridor.right) {
    stPreviewParts.push(`Stridor (${st.stridor.left ? '+' : '-'}/${st.stridor.right ? '+' : '-'})`);
  }
  if (st.hippocratesSuccusion.left || st.hippocratesSuccusion.right) {
    stPreviewParts.push(`HS (${st.hippocratesSuccusion.left ? '+' : '-'}/${st.hippocratesSuccusion.right ? '+' : '-'})`);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 p-4 text-white flex justify-between items-center shrink-0">
        <h3 className="font-bold text-lg tracking-wide">🫁 Pemeriksaan Paru</h3>
        <button onClick={onClose} className="hover:bg-teal-500/40 p-1.5 rounded-lg transition active:scale-90" aria-label="Tutup">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
        {(['SP', 'ST'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === tab
              ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400'
              : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab === 'SP' ? 'Suara Pernapasan (SP)' : 'Suara Tambahan (ST)'}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 font-sans text-sm">
        {/* ── SP TAB ── */}
        {activeTab === 'SP' && (
          <div>
            {/* Type selector */}
            <div className="px-5 pt-5 pb-3">
              <label className="font-bold text-slate-700 dark:text-slate-200 mb-2 block">Jenis Suara Pernapasan</label>
              <select
                value={sp.type}
                onChange={e => handleSpTypeChange(e.target.value as SuaraPernapasan['type'])}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:text-white transition"
              >
                <option value="">Pilih Suara Dasar...</option>
                <option>Vesikuler</option>
                <option>Trakeal</option>
                <option>Bronkial</option>
                <option>Bronkovesikuler</option>
              </select>
            </div>

            {/* Lung grid with background image */}
            <div className="relative px-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Klik area untuk ubah: Normal → Melemah → Menguat
                </p>
                <button onClick={resetSP} className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition" title="Reset semua regio">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* One-side toggle buttons — Sinistra di kiri, Dextra di kanan */}
              <div className="flex justify-between mb-3 z-10 relative">
                <button
                  onClick={() => toggleAllSide('Left')}
                  className="text-[11px] bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 transition active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" /> Sinistra
                </button>
                <button
                  onClick={() => toggleAllSide('Right')}
                  className="text-[11px] bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 transition active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" /> Dextra
                </button>
              </div>

              {/* Lung background + interactive grid */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* Lung image background (inverted to white lines in dark mode) */}
                <div
                  className="absolute inset-0 opacity-25 dark:opacity-40 dark:invert pointer-events-none transition-all duration-200"
                  style={{ backgroundImage: 'url(/lung-bg.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
                />

                {/* Column headers — Sinistra (left screen) | Dextra (right screen) */}
                <div className="grid grid-cols-2 gap-3 relative z-10 mb-1">
                  <div className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-1">Kiri (Sinistra)</div>
                  <div className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-1">Kanan (Dextra)</div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {SP_GRID_ORDER.map((region) => {
                    const status = sp.regions[region];
                    const label = getRegionLabel(region);
                    const bgClass =
                      status === 'Normal' ? 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' :
                      status === 'Melemah' ? 'bg-amber-400/80 backdrop-blur-sm text-amber-900 border-amber-500 shadow-amber-200/50 shadow-md' :
                      'bg-emerald-400/80 backdrop-blur-sm text-emerald-900 border-emerald-500 shadow-emerald-200/50 shadow-md';
                    return (
                      <button
                        key={region}
                        onClick={() => handleSpRegionToggle(region)}
                        className={`py-4 px-2 rounded-xl border-2 transition-all duration-150 active:scale-95 flex flex-col items-center justify-center gap-1 ${bgClass}`}
                        aria-label={`${label} ${region.endsWith('Left') ? 'Sinistra' : 'Dextra'}: ${status}`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{label}</span>
                        <span className="font-black text-sm">{status}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ST TAB ── */}
        {activeTab === 'ST' && (
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Format: (<span className="text-teal-600 font-bold">sinistra</span>/<span className="text-teal-600 font-bold">dextra</span>)
              </p>
              <button onClick={resetST} className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition" title="Reset semua ST">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Lung background card for ST — Sinistra di kiri, Dextra di kanan */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {/* Lung image background (inverted to white lines in dark mode) */}
              <div
                className="absolute inset-0 opacity-20 dark:opacity-35 dark:invert pointer-events-none transition-all duration-200"
                style={{ backgroundImage: 'url(/lung-bg.png)', backgroundSize: '70%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
              />

              {/* Sinistra & Dextra columns */}
              <div className="relative z-10 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
                {/* Left column = Sinistra */}
                {(['left', 'right'] as const).map((side) => (
                  <div key={side} className="p-4 flex flex-col gap-2">
                    <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700 mb-1">
                      {side === 'left' ? 'Kiri (Sinistra)' : 'Kanan (Dextra)'}
                    </div>
                    {ST_FIELDS.map(({ key, label, color, activeColor }) => {
                      const isActive = (st[key] as { right: boolean; left: boolean })[side];
                      return (
                        <button
                          key={key}
                          onClick={() => handleStSideToggle(key, side)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-between gap-2 border ${
                            isActive
                              ? `${activeColor} border-transparent shadow-md`
                              : `${color} border-slate-200 dark:border-slate-600 hover:border-slate-300`
                          }`}
                          aria-label={`${label} ${side === 'left' ? 'Sinistra' : 'Dextra'}: ${isActive ? 'positif' : 'negatif'}`}
                          aria-pressed={isActive}
                        >
                          <span>{label}</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${isActive ? 'bg-white/30 border-white/50' : 'border-slate-300 dark:border-slate-500 text-slate-400'}`}>
                            {isActive ? '+' : '−'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview format */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Preview Format Copy — (sinistra/dextra)</p>
              <p className="font-mono text-xs text-teal-700 dark:text-teal-400 break-all">
                ST: {stPreviewParts.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0">
        <button
          onClick={() => onSave(sp, st)}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-teal-600/20 active:scale-[0.98]"
        >
          <Save className="w-5 h-5" />
          Simpan Pemeriksaan Paru
        </button>
      </div>
    </div>
  );
};
