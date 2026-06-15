export interface BalanceCairan {
  makanType: 'Makan' | 'NGT';
  makanCount: number;
  makanValue: number;

  minumOption: 'None' | 'Aqua besar' | 'Aqua sedang' | 'Aqua kecil';
  minumValue: number;

  ivfdOption: 'None' | '20 gtt/i makro' | '10 gtt/i makro' | '20 gtt/i mikro' | '10 gtt/i mikro';
  ivfdValue: number;

  transfusiBags: number;
  transfusiValue: number;

  syringePumpCc: number;
  syringePumpValue: number;

  babType: 'Keras/biasa' | 'Mencret';
  babCount: number;
  babValue: number;

  uopOption: 'None' | 'Aqua besar' | 'Aqua sedang' | 'Aqua kecil';
  uopValue: number;

  muntahCount: number;
  muntahValue: number;

  iwl: boolean;
  iwlValue: number;
}

export interface VitalsEntry {
  time: string;
  bp: string;
  sens: string;
  gcs: string;
  hr: string;
  rr: string;
  spo2: string;
  o2Method: 'Room Air (RA)' | 'Nasal Cannula (NK)' | 'Non Rebreathing Mask (NRM)' | 'Trakeostomi' | 'Ventilator';
  lpm: string;
  temp: string;
  isGdsChecked: boolean;
  gdsValue: string;
  isOnIVDrug: boolean;
  ivDrugNames: string[];
  ivDrugRates: string[];
  keluhan: string;
  createdAt: number;
  isUopChecked?: boolean;
  uopValue?: string;
  balanceCairan?: BalanceCairan;
}

export interface PatientRecord {
  room: string;
  rm: string;
  name: string;
  gender: 'Laki-laki (L)' | 'Perempuan (P)';
  age: string;
  weight?: string;
  height?: string;
  isFollowTtv: boolean;
  followTtvInterval: string;
  isFollowGds: boolean;
  followGdsInterval: string;
  isFollowUop: boolean;
  followUopInterval: string;
  isFollowBalance: boolean;
  followBalanceInterval: string;
  vitals: VitalsEntry[];
}

export interface SpreadsheetRow {
  Nama?: string;
  'No RM'?: string;
  'No. RM'?: string;
  RM?: string;
  'Ruang Rawat'?: string;
  Ruang?: string;
  Room?: string;
  Umur?: string;
  Age?: string;
  Usia?: string;
  'Jenis Kelamin'?: string;
  Gender?: string;
  Sex?: string;
  FollowTtv?: string;
  isFollowTtv?: string;
  FollowTtvInterval?: string;
  FollowGds?: string;
  isFollowGds?: string;
  FollowGdsInterval?: string;
  FollowUop?: string;
  isFollowUop?: string;
  FollowUopInterval?: string;
  FollowBalance?: string;
  isFollowBalance?: string;
  FollowBalanceInterval?: string;
  VitalsTime?: string;
  Waktu?: string;
  Time?: string;
  BP?: string;
  TD?: string;
  'Tekanan Darah'?: string;
  Sens?: string;
  GCS?: string;
  HR?: string;
  RR?: string;
  SpO2?: string;
  SPO2?: string;
  'SpO2%'?: string;
  O2Method?: string;
  O2MethodValue?: string;
  LPM?: string;
  Temp?: string;
  GDSChecked?: string;
  GDSValue?: string;
  IsOnIVDrug?: string;
  IVDrugNames?: string;
  IVDrugRates?: string;
  Keluhan?: string;
}
