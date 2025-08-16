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
}
