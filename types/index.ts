import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Meeting {
  id: number;
  nama_topik: string;
  tanggal: string;
  jam_mulai: string;
  jam_akhir: string;
  kelas: string;
  status: string;
  periode_id: number;
  jumlah_hadir?: number;
  jumlah_tidak_hadir?: number;
  total_peserta?: number;
  persentase_kehadiran?: number;
}

export interface Prestasi {
  id: number;
  nama_tournament: string;
  tingkat_acara: 'Kampus' | 'Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  tanggal_acara: string;
  juara: number;
  jumlah_anggota: number;
  gambar_pemenang?: string;
  deskripsi?: string;
  created_at: string;
  updated_at: string;
}
