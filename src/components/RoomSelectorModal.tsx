import React, { useState } from 'react';
import { X, Building2, MapPin, BedDouble } from 'lucide-react';

interface RoomSelectorModalProps {
  onClose: () => void;
  onSelect: (roomString: string) => void;
}

const RS_USU_ROOMS = [
  "Meranti", "Mahoni", "Cendana", "Isolasi", "Isolasi TB Zaitun", 
  "CVCU", "Super VIP", "Kamar Bersalin", "RIM", "RIE", "Talasemia", 
  "PICU", "NICU", "Maternitas", "Kenari", "ICU", "Gaharu", "Cemara", 
  "Anjungan Bayi", "IGD"
];

const RS_HAM_ROOMS = [
  "RA1", "RA1 Psikiatri", "HCU RA1", "RA2", "RA3", "HCU RA3", 
  "RA4", "RA5", "RA6", "RB1", "RB2", "RB3", "RB4", "RB5", "RB6", 
  "PAVI 5", "PAVI 6", "PAVI 7", "PAVI 8", "PJT Lt.3", "PJT Lt.4", 
  "ICU Dewasa", "ICU P. BEDAH", "ICU Luka Bakar", "CVCU", 
  "ICU Bedah Saraf", "ICU Post Bedah Saraf", "PICU", "NICU", 
  "IGD", "IGD Peralihan"
];

export const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({ onClose, onSelect }) => {
  const [hospital, setHospital] = useState<'USU' | 'HAM' | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');

  const rooms = hospital === 'USU' ? RS_USU_ROOMS : hospital === 'HAM' ? RS_HAM_ROOMS : [];

  const handleSave = () => {
    let result = '';
    if (selectedRoom) result += selectedRoom;
    if (roomNumber) result += (result ? ' ' : '') + roomNumber;
    if (bedNumber) result += (result ? ' Bed ' : 'Bed ') + bedNumber;
    
    onSelect(result.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 p-4 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Pilih Ruangan
          </h3>
          <button onClick={onClose} className="hover:bg-teal-500/40 p-1.5 rounded-lg transition active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Hospital Selection */}
          <div className="space-y-3">
            <label className="font-bold text-slate-700 dark:text-slate-200 text-sm">Pilih Rumah Sakit</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setHospital('USU'); setSelectedRoom(''); }}
                className={`py-3 px-4 rounded-xl font-bold border-2 transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  hospital === 'USU'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-sm">RS USU</span>
              </button>
              <button
                onClick={() => { setHospital('HAM'); setSelectedRoom(''); }}
                className={`py-3 px-4 rounded-xl font-bold border-2 transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  hospital === 'HAM'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-sm">RS H. Adam Malik</span>
              </button>
            </div>
          </div>

          {/* Forms if hospital selected */}
          {hospital && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Form 1: Ruangan */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">1</span>
                  Ruangan
                </label>
                <div className="flex flex-wrap gap-2">
                  {rooms.map(room => (
                    <button
                      key={room}
                      onClick={() => setSelectedRoom(room)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedRoom === room
                          ? 'bg-teal-500 text-white border-teal-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form 2 & 3: Nomor Ruangan & Bed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">2</span>
                    Nomor Ruangan
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Misal: 803"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">3</span>
                    Bed
                  </label>
                  <div className="relative">
                    <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Misal: 2"
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Format */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Preview Format</p>
                <p className="text-sm font-mono text-teal-700 dark:text-teal-400 font-bold min-h-[1.25rem]">
                  {(selectedRoom || roomNumber || bedNumber) ? (
                    `${selectedRoom} ${roomNumber} ${bedNumber ? 'Bed ' + bedNumber : ''}`.trim()
                  ) : (
                    <span className="text-slate-400 font-normal italic">Pilih data untuk melihat preview...</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <button
            onClick={handleSave}
            disabled={!hospital || !selectedRoom}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
          >
            Terapkan Ruangan
          </button>
        </div>
      </div>
    </div>
  );
};
