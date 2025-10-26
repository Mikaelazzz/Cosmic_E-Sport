"use client";
import { usePathname } from "next/navigation";

const hideFooterPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

export function FooterWrapper() {
  const pathname = usePathname();
  if (hideFooterPaths.includes(pathname)) return null;
  
  return (
    <footer className="w-full border-t border-blue-900 pt-8 pb-2 px-4 mt-4">
      {/* Tentang */}
      <div className="max-w-6xl mx-auto mb-4">
        <p className="text-sm leading-relaxed text-gray-200 text-center">
          COSMIC didirikan pada tahun 2023 sebagai wadah bagi para gamer kampus untuk mengembangkan bakat dan meraih prestasi di dunia e-sport. Kami percaya bahwa setiap pemain memiliki potensi untuk menjadi bintang.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-white pb-4">
        {/* Quick Links */}
        <div>
          <h3 className="text-[#FFD700] font-bold text-sm mb-2">Quick Links</h3>
          <ul className="space-y-1">
            <li><a href="/#tentang" className="hover:text-[#FFD700] transition-colors">Tentang Kami</a></li>
            <li><a href="/#pengurus" className="hover:text-[#FFD700] transition-colors">Pengurus</a></li>
            <li><a href="/#prestasi" className="hover:text-[#FFD700] transition-colors">Prestasi</a></li>
          </ul>
        </div>
        {/* Alamat */}
        <div>
          <h3 className="text-[#FFD700] font-bold text-sm mb-2">Alamat</h3>
          <p className="text-sm leading-relaxed text-gray-200 text-justify">
            Jl. Dr. Ir. H. Soekarno No.201, Klampis Ngasem, Kec. Sukolilo, Kota SBY, Jawa Timur 60117
          </p>
        </div>
        {/* Follow Us */}
        <div>
          <h3 className="text-[#FFD700] font-bold text-sm mb-2">Follow Us</h3>
          <div className="flex flex-col space-x-4 mt-2">
            <ul className="space-y-1">
              <li><a href="https://discord.gg/Ec3ZjPMa" target="blank" className="hover:text-[#FFD700] transition-colors">Discord Cosmic</a></li>
              <li><a href="https://www.instagram.com/cosmic.ukdc/" target="blank" className="hover:text-[#FFD700] transition-colors">Instagram Cosmic</a></li>
              <li><a href="https://chat.whatsapp.com/HbaqYjlwuPqAfybZ31C4Mv?mode=wwt" target="blank" className="hover:text-[#FFD700] transition-colors">Whatsapp Cosmic</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-blue-900 my-2"></div>
      <div className="text-center text-gray-400 text-sm pb-2">
        © 2025 Cosmic E-Sports. All rights reserved
      </div>
    </footer>
  );
}
