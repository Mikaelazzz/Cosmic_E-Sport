"use client"
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import Spinner from "@/components/Spinner";
import { getPrestasiImageUrl } from "@/lib/prestasi-image";

// Lazy load heavy components - Aurora and Preloader removed for performance
const ShineBorder = dynamic(() => import("@/components/shine-border").then(mod => ({ default: mod.ShineBorder })), { ssr: false, loading: () => null });
const ScrollFloat = dynamic(() => import("@/components/ScrollFloat"), { ssr: false, loading: () => null });
const CardScrollAnimation = dynamic(() => import("@/components/CardScrollAnimation"), { ssr: false, loading: () => null });

interface PrestasiItem {
  id: number;
  title: string;
  level: string;
  date: string;
  players: string;
  img: string;
  badge: string;
  description?: string;
  rawDate?: string;
}


export default function Home() {
  const [prestasiList, setPrestasiList] = useState<PrestasiItem[]>([]);
  const [showCount, setShowCount] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrestasi, setLoadingPrestasi] = useState(true);
  
  useEffect(() => {
    fetchPrestasiData();
  }, []);

  const fetchPrestasiData = async () => {
    try {
      setLoadingPrestasi(true);
      const response = await fetch('/api/prestasi');
      const result = await response.json();
      
      if (result.success) {
        setPrestasiList(result.data);
      } else {
        console.error('Failed to fetch prestasi:', result.error);
        // Fallback to dummy data if API fails
        setPrestasiList([
          {
            id: 1,
            title: "Tournament Sample",
            level: "Regional",
            date: "1 Januari 2025",
            players: "5 Players",
            img: "/logo.webp",
            badge: "1st"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching prestasi:', error);
      // Fallback to dummy data if fetch fails
      setPrestasiList([
        {
          id: 1,
          title: "Tournament Sample",
          level: "Regional", 
          date: "1 Januari 2025",
          players: "5 Players",
          img: "/logo.webp",
          badge: "1st"
        }
      ]);
    } finally {
      setLoadingPrestasi(false);
    }
  };

  // Logic: 2, 6, 10, 14, ...
  const handleShowMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setShowCount(prev => {
        if (prev === 2) return Math.min(6, prestasiList.length);
        return Math.min(prev + 4, prestasiList.length);
      });
      setLoadingMore(false);
    }, 1000);
  };

  return (
    <>
      {/* Preloader removed for better Lighthouse performance */}
      <div className="contents">
    {/* Halaman utama */}
    <section id="home"
      className="relative flex flex-col items-center justify-center w-full aspect-video"
    >
      {/* Aurora disabled for performance - replaced with CSS gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#FFD700]/20 via-[#FF8C00]/10 to-[#8B4513]/20">
        {/* Aurora component removed to improve Lighthouse CPU idle period */}
      </div>

      <div className="relative z-10 text-center text-white py-12">
        <h1 className="text-3xl md:text-8xl font-bold mb-4 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]">
          Join the <span className="text-[#FFD700]">Cosmic Family</span>
        </h1>
        <p className="mb-6 text-[10px] md:text-2xl">Bergabunglah dengan UKM E-Sport dan wujudkan impianmu esportmu</p>
        <Button
              className="w-[130px] md:text-lg md:w-[200px] bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-[12px] font-bold py-2 rounded-md hover:bg-[#FFC300] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              href="/auth/register"
              as={NextLink}
            >
              Daftar Sekarang
        </Button>
        {/* <div className="flex gap-8 justify-center mt-8">
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl text-[#FFD700]">15</div>
            <div>Member UKM</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl text-[#FFD700]">5</div>
            <div>Tournament Victories</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl text-[#FFD700]">2</div>
            <div>Tahun UKM</div>
          </div>
        </div> */}
      </div>
    </section>

  {/* Halaman kedua */}
  <section id="tentang" className="flex flex-col items-center justify-center w-full p-8 bg-white text-black">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 font-[orbitron]">
        Tentang <span className="text-[#FFD700]">Cosmic</span>
      </h1>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl w-full">
        {/* Visi Card */}
        <div className="bg-[#1a1a1a] rounded-lg border-l-4 border-[#ff003c] p-6">
          <h1 className="font-[orbitron] text-[#ff003c] text-xl mb-3 font-bold select-none">VISI</h1>
          <p className="text-[#ff003c] text-sm font-semibold leading-relaxed">
            Menjadi Pribadi yang unggul dalam mengembangkan potensi di bidang esport, dengan berkarakter, kreatif dan memiliki pengaruh positif dalam dunia Esport
          </p>
        </div>

        {/* Misi Card */}
        <div className="bg-[#1a1a1a] rounded-lg border-l-4 border-[#ffa500] p-6">
          <h1 className="font-[orbitron] text-[#ffa500] text-xl mb-3 font-bold select-none">MISI</h1>
          <p className="text-[#ffa500] text-sm font-semibold leading-relaxed">
            Menyalurkan aspirasi dan bakat maupun minat anggota untuk mengembangkan UKM Esport dalam civitas kampus maupun luar kampus. 
          </p>
          <br />
          <p className="text-[#ffa500] text-sm font-semibold leading-relaxed">
            Menciptakan hubungan yang kuat dan saling menguntungkan antar pemangku kepentingan di bidang Esports.
          </p>
        </div>
      </div>
    </section>

  {/* Halaman Ketiga */}
<section id="pengurus" className="flex flex-col items-center justify-center w-full min-h-screen p-8 bg-black text-white">
  <h1 className="text-3xl md:text-5xl font-bold mb-12 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]">
    Pendamping <span className="text-[#FFD700]">Cosmic</span>
  </h1>
    {/* Card 1 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Pendamping
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/No.webp" 
          alt="Bu Novi" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Bu Novi
      </h3>
    </div>
  <h1 className="text-3xl md:text-5xl font-bold mb-12 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)] mt-6">
    Pengurus <span className="text-[#FFD700]">Cosmic</span>
  </h1>
  
  
  <div 
    className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl w-full"
  >
    {/* Card 1 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Ketua
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Ce.webp" 
          alt="Vincent" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Vincent
      </h3>
    </div>

    {/* Card 2 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Wakil Ketua
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Qu.webp" 
          alt="Queena" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Queena
      </h3>
    </div>

    {/* Card 3 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Bendahara
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Re.webp" 
          alt="Regina" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Regina
      </h3>
    </div>

    {/* Card 4 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Sekretaris
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Pa.webp" 
          alt="Patrick" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Patrick
      </h3>
    </div>

    {/* Card 5 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Humas
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/St.webp" 
          alt="Steven" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Steven
      </h3>
    </div>

    {/* Card 6 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        Humas
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Ar.webp" 
          alt="Arfi" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Arfi
      </h3>
    </div>

    {/* Card 7 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        PDD
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Ni.webp" 
          alt="Nicho" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Nicho
      </h3>
    </div>

    {/* Card 8 */}
    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-72 rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        PDD
      </div>
      
      {/* Profile image */}
      <div className="mb-4 select-none pointer-events-none">
        <img 
          src="/pengurus/Ho.webp" 
          alt="Hosea" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Hosea
      </h3>
    </div>
  </div>
</section>


    {/* Halaman Keempat */}
  <section id="prestasi" className="flex flex-col items-center justify-center w-full min-h-screen p-8 bg-white text-black">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 font-[orbitron] ">Prestasi <span className="text-[#FFD700]">Cosmic</span></h1>
      
      {loadingPrestasi ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner size={48} />
          <p className="mt-4 text-black">Memuat prestasi...</p>
        </div>
      ) : prestasiList.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          {/* <h3 className="text-xl font-bold text-white mb-2">Belum Ada Prestasi</h3> */}
          <p className="text-black">Prestasi akan ditampilkan di sini ketika sudah tersedia</p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full mt-6"
          >
            {prestasiList.slice(0, showCount).map((item, idx) => (
              <div key={item.id || idx} className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-screen rounded-lg p-4 overflow-hidden group card-animate">
                <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                {/* Yellow badge */}
                <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
                  {item.badge}
                </div>
                {/* Profile image */}
                <div className="mb-4 select-none pointer-events-none">
                  <img
                    src={getPrestasiImageUrl(item.img) || '/logo.webp'}
                    alt={item.title}
                    className="aspect-video w-auto h-auto md:w-auto md:h-80 rounded-lg object-cover border-2 border-[#FFD700]/30"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.webp'; // fallback image
                    }}
                  />
                </div>
                {/* Name */}
                <div className="text-start text-white font-[orbitron]">
                  <h1 className="text-lg font-bold" >
                    {item.title}
                  </h1>
                  <h2 className="text-[13px]">{item.level}</h2>
                  <h2 className="text-[13px]">{item.date}</h2>
                  <br />
                  <small className="text-[10px] mt-4">{item.players}</small>
                  {item.description && (
                    <p className="text-xs text-white/80 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {showCount < prestasiList.length && (
            <Button
              className="mt-8 flex items-center gap-2"
              color="warning"
              variant="ghost"
              onClick={handleShowMore}
              disabled={loadingMore}
            >
              {loadingMore && <Spinner size={18} className="mr-2" />}
              {loadingMore ? "Memuat..." : "Tampilkan Lainnya"}
            </Button>
          )}
        </>
      )}
    </section>
      </div>
    </>
  );
}
