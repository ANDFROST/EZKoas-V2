import React, { useState } from 'react';
import { BalanceCairan } from '../types';

interface BalanceCairanModalProps {
  initialData?: BalanceCairan;
  onSave: (data: BalanceCairan) => void;
  onClose: () => void;
}

export const BalanceCairanModal: React.FC<BalanceCairanModalProps> = ({ initialData, onSave, onClose }) => {
  // Setup data state initialized with default values or existing values
  const [b, setB] = useState<BalanceCairan>(() => {
    if (initialData) return { ...initialData };
    return {
      makanType: 'Makan',
      makanCount: 0,
      makanValue: 0,
      minumOption: 'None',
      minumValue: 0,
      ivfdOption: 'None',
      ivfdValue: 0,
      transfusiBags: 0,
      transfusiValue: 0,
      syringePumpCc: 0,
      syringePumpValue: 0,
      babType: 'Keras/biasa',
      babCount: 0,
      babValue: 0,
      uopOption: 'None',
      uopValue: 0,
      muntahCount: 0,
      muntahValue: 0,
      iwl: false,
      iwlValue: 0,
    };
  });

  // Re-calculate makan value
  const handleMakanCountChange = (count: number) => {
    const multiplier = b.makanType === 'NGT' ? 250 : 100;
    setB((prev) => ({
      ...prev,
      makanCount: count,
      makanValue: count * multiplier,
    }));
  };

  const handleMakanTypeChange = (type: BalanceCairan['makanType']) => {
    const multiplier = type === 'NGT' ? 250 : 100;
    setB((prev) => ({
      ...prev,
      makanType: type,
      makanValue: prev.makanCount * multiplier,
    }));
  };

  // Re-calculate minum value
  const handleMinumOptionChange = (option: BalanceCairan['minumOption']) => {
    let value = 0;
    if (option === 'Aqua besar') value = 1500;
    else if (option === 'Aqua sedang') value = 600;
    else if (option === 'Aqua kecil') value = 240;

    setB((prev) => ({
      ...prev,
      minumOption: option,
      minumValue: value,
    }));
  };

  // Re-calculate IVFD value
  const handleIvfdOptionChange = (option: BalanceCairan['ivfdOption']) => {
    let value = 0;
    if (option === '20 gtt/i makro') value = 1440;
    else if (option === '10 gtt/i makro') value = 720;
    else if (option === '20 gtt/i mikro') value = 480;
    else if (option === '10 gtt/i mikro') value = 240;

    setB((prev) => ({
      ...prev,
      ivfdOption: option,
      ivfdValue: value,
    }));
  };

  // Re-calculate transfusi value
  const handleTransfusiBagsChange = (bags: number) => {
    setB((prev) => ({
      ...prev,
      transfusiBags: bags,
      transfusiValue: bags * 175,
    }));
  };

  // Re-calculate syringe pump value
  const handleSyringePumpChange = (cc: number) => {
    setB((prev) => ({
      ...prev,
      syringePumpCc: cc,
      syringePumpValue: cc,
    }));
  };

  // Re-calculate BAB value
  const handleBabCountChange = (count: number) => {
    const multiplier = b.babType === 'Mencret' ? 100 : 50;
    setB((prev) => ({
      ...prev,
      babCount: count,
      babValue: count * multiplier,
    }));
  };

  const handleBabTypeChange = (type: BalanceCairan['babType']) => {
    const multiplier = type === 'Mencret' ? 100 : 50;
    setB((prev) => ({
      ...prev,
      babType: type,
      babValue: prev.babCount * multiplier,
    }));
  };

  // Re-calculate uop value
  const handleUopOptionChange = (option: BalanceCairan['uopOption']) => {
    let value = 0;
    if (option === 'Aqua besar') value = 1500;
    else if (option === 'Aqua sedang') value = 600;
    else if (option === 'Aqua kecil') value = 240;

    setB((prev) => ({
      ...prev,
      uopOption: option,
      uopValue: value,
    }));
  };

  // Re-calculate muntah value
  const handleMuntahChange = (count: number) => {
    setB((prev) => ({
      ...prev,
      muntahCount: count,
      muntahValue: count * 50,
    }));
  };

  // Re-calculate IWL
  const handleIwlChange = (checked: boolean) => {
    setB((prev) => ({
      ...prev,
      iwl: checked,
      iwlValue: checked ? 500 : 0,
    }));
  };

  // Calculate totals
  const totalIntake = b.makanValue + b.minumValue + b.ivfdValue + b.transfusiValue + b.syringePumpValue;
  const totalOutput = b.babValue + b.uopValue + b.muntahValue + b.iwlValue;
  const fluidBalance = totalIntake - totalOutput;

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl max-w-lg w-full mx-auto overflow-hidden font-sans p-6 sm:p-8">
      {/* Title */}
      <div className="mb-6 border-b border-slate-100 pb-3">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Balance Cairan</h2>
      </div>

      <div className="space-y-6 max-h-[64vh] overflow-y-auto pr-1 text-slate-800">
        {/* INTAKE SECTION */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-teal-800 uppercase tracking-wider">Intake</h3>

          {/* Makan / NGT */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Makan / NGT</label>
              <select
                value={b.makanType}
                onChange={(e) => handleMakanTypeChange(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-slate-300 hover:border-slate-400 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 h-[46px] truncate"
              >
                <option value="Makan">Makan</option>
                <option value="NGT">NGT</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Kali makan hari ini?</label>
              <input
                type="number"
                value={b.makanCount || ''}
                onChange={(e) => handleMakanCountChange(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#f8fafc] border border-slate-300 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none h-[46px]"
              />
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">Hasil</label>
              <input
                type="number"
                value={b.makanValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, makanValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* Minum */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Minum</label>
              <select
                value={b.minumOption}
                onChange={(e) => handleMinumOptionChange(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-slate-300 hover:border-slate-400 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 h-[46px] truncate"
              >
                <option value="None">Minum</option>
                <option value="Aqua besar">Aqua Besar (1500 cc)</option>
                <option value="Aqua sedang">Aqua Sedang (600 cc)</option>
                <option value="Aqua kecil">Aqua Kecil (240 cc)</option>
              </select>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.minumValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, minumValue: Number(e.target.value), minumOption: 'None' }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* IVFD */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">IVFD</label>
              <select
                value={b.ivfdOption}
                onChange={(e) => handleIvfdOptionChange(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-slate-300 hover:border-slate-400 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 h-[46px] truncate"
              >
                <option value="None">IVFD</option>
                <option value="20 gtt/i makro">20 gtt/i makro (1440 cc)</option>
                <option value="10 gtt/i makro">10 gtt/i makro (720 cc)</option>
                <option value="20 gtt/i mikro">20 gtt/i mikro (480 cc)</option>
                <option value="10 gtt/i mikro">10 gtt/i mikro (240 cc)</option>
              </select>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.ivfdValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, ivfdValue: Number(e.target.value), ivfdOption: 'None' }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* Transfusi */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Kantong darah hari ini?</label>
              <input
                type="number"
                value={b.transfusiBags || ''}
                onChange={(e) => handleTransfusiBagsChange(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#f8fafc] border border-slate-300 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none h-[46px]"
              />
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.transfusiValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, transfusiValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* Syringe Pump CC */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">CC masuk syringe pump?</label>
              <input
                type="number"
                value={b.syringePumpCc || ''}
                onChange={(e) => handleSyringePumpChange(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#f8fafc] border border-slate-300 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none h-[46px]"
              />
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.syringePumpValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, syringePumpValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>
        </div>

        {/* Separator block divider lines */}
        <hr className="border-slate-200 my-4" />

        {/* OUTPUT SECTION */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">Output</h3>

          {/* BAB */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">BAB</label>
              <select
                value={b.babType}
                onChange={(e) => handleBabTypeChange(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-slate-300 hover:border-slate-400 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 h-[46px] truncate"
              >
                <option value="Keras/biasa">Keras/biasa</option>
                <option value="Mencret">Mencret</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Berapa kali BAB?</label>
              <input
                type="number"
                value={b.babCount || ''}
                onChange={(e) => handleBabCountChange(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#f8fafc] border border-slate-300 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none h-[46px]"
              />
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.babValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, babValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* UOP */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">UOP</label>
              <select
                value={b.uopOption}
                onChange={(e) => handleUopOptionChange(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-slate-300 hover:border-slate-400 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 h-[46px] truncate"
              >
                <option value="None">UOP</option>
                <option value="Aqua besar">Aqua Besar (1500 cc)</option>
                <option value="Aqua sedang">Aqua Sedang (600 cc)</option>
                <option value="Aqua kecil">Aqua Kecil (240 cc)</option>
              </select>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.uopValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, uopValue: Number(e.target.value), uopOption: 'None' }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* Muntah */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider block truncate">Muntah berapa kali?</label>
              <input
                type="number"
                value={b.muntahCount || ''}
                onChange={(e) => handleMuntahChange(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-[#f8fafc] border border-slate-300 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none h-[46px]"
              />
            </div>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.muntahValue || 0}
                onChange={(e) => setB((prev) => ({ ...prev, muntahValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px]"
              />
            </div>
          </div>

          {/* IWL / Insensible Water Loss */}
          <div className="flex gap-2 items-end">
            <label className="flex items-center gap-3 bg-[#f8fafc] hover:bg-slate-100/60 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm cursor-pointer font-bold text-slate-700 flex-1 h-[46px] select-none">
              <input
                type="checkbox"
                checked={b.iwl}
                onChange={(e) => handleIwlChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-cyan-600 focus:ring-transparent"
              />
              <span className="truncate">Insensible Water Loss (IWL)</span>
            </label>
            <div className="flex items-center justify-center text-slate-600 font-black text-sm h-[46px] w-4 self-end pb-3 select-none">
              =
            </div>
            <div className="flex flex-col gap-1 w-20 sm:w-24">
              <label className="text-[10px] font-extrabold text-slate-605 uppercase tracking-wider text-center block truncate">cc</label>
              <input
                type="number"
                value={b.iwlValue || 0}
                disabled={!b.iwl}
                onChange={(e) => setB((prev) => ({ ...prev, iwlValue: Number(e.target.value) }))}
                className="w-full bg-[#f8fafc] border border-slate-300 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold text-slate-900 text-center focus:outline-none h-[46px] disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary totals text aligned precisely to right side */}
      <div className="mt-6 flex flex-col items-end gap-1.5 text-right font-sans select-none pr-1 border-t border-slate-100 pt-4">
        <p className="text-xs sm:text-sm font-bold text-slate-700 leading-none">
          Total Intake: {totalIntake >= 0 ? '+' : ''}{totalIntake} cc
        </p>
        <p className="text-xs sm:text-sm font-bold text-slate-700 leading-none">
          Total Output: -{totalOutput} cc
        </p>
        <p className="text-sm sm:text-base font-black text-teal-850 leading-none mt-1">
          Balance Cairan: <span className={fluidBalance >= 0 ? "text-emerald-700 font-extrabold" : "text-rose-700 font-extrabold"}>{fluidBalance >= 0 ? '+' : ''}{fluidBalance} cc</span>
        </p>
      </div>

      {/* Bottom control buttons */}
      <div className="mt-8 flex items-center justify-end gap-4 font-sans border-t border-slate-100 pt-5">
        <button
          onClick={onClose}
          type="button"
          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-5 py-3 rounded-full text-sm font-black transition cursor-pointer select-none active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(b)}
          type="button"
          className="bg-[#009baf] hover:bg-[#008ba0] active:scale-[0.97] text-white px-8 py-3 rounded-full text-sm font-bold transition shadow-md shadow-cyan-600/10 cursor-pointer select-none"
        >
          Simpan
        </button>
      </div>
    </div>
  );
};
