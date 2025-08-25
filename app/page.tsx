import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import Aurora from "@/components/Aurora";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { ShineBorder } from "@/components/shine-border";
import ScrollFloat from "@/components/ScrollFloat";
import CardScrollAnimation from "@/components/CardScrollAnimation";


export default function Home() {
  return (
    <>
    {/* Halaman utama */}
    <section
      className="relative flex flex-col items-center justify-center w-full aspect-video min-h-screen overflow-hidden"
      // style={{
      //   backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(26,35,126,0.7) 100%), url('/ukm.jpg')`,
      //   backgroundSize: 'cover',
      //   backgroundPosition: 'center',
      // }}
      >
      {/* Aurora sebagai background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#FFD700", "#FF8C00", "#8B4513"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
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
    <section className="flex flex-col items-center justify-center w-full min-h-screen p-8 bg-black text-white">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]">
        Tentang <span className="text-[#FFD700]">Cosmic</span>
      </h1>
      
      <p className="text-center max-w-4xl mb-12 text-sm md:text-base leading-relaxed text-gray-300">
        COSMIC didirikan pada tahun 2023 sebagai wadah bagi para gamer kampus untuk 
        mengembangkan bakat dan meraih prestasi di dunia e-sport. Kami percaya bahwa setiap pemain 
        memiliki potensi untuk menjadi bintang.
      </p>

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
<section className="flex flex-col items-center justify-center w-full min-h-screen p-8 bg-black text-white">
  <h1 className="text-3xl md:text-5xl font-bold mb-12 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]">
    Pengurus <span className="text-[#FFD700]">Cosmic</span>
  </h1>
  
  <CardScrollAnimation 
    className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl w-full"
    animationDuration={0.8}
    ease="back.out(1.7)"
    scrollStart="top bottom-=150px"
    scrollEnd="bottom top+=50px"
    stagger={0.15}
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Lwie Jaya" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Vincentius
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 2" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 3" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Lwie Jaya" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 2" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 3" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 2" 
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
      <div className="mb-4">
        <img 
          src="/pengurus/tes.jpg" 
          alt="Member 3" 
          className="aspect-square w-auto h-auto md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <h3 className="text-center text-white text-lg font-[orbitron] font-bold">
        Hosea
      </h3>
    </div>
  </CardScrollAnimation>
</section>

    {/* Halaman Keempat */}
    <section className="flex flex-col items-center justify-center w-full min-h-screen p-8">
       <h1 className="text-3xl md:text-8xl font-bold mb-4 font-[orbitron] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]">Prestasi <span className="text-[#FFD700]">Cosmic</span></h1>
        <CardScrollAnimation 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full mt-6"
        animationDuration={0.8}
        ease="back.out(1.7)"
        scrollStart="top bottom-=150px"
        scrollEnd="bottom top+=50px"
        stagger={0.15}
  >
   <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-screen rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        1st
      </div>
      
      {/* Profile image */}
      <div className="mb-4">
        <img 
          src="/pengurus/download.jpg" 
          alt="Member 2" 
          className="aspect-video w-auto h-auto md:w-auto md:h-80 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <div className="text-start text-white font-[orbitron]">
        <h1 className="text-lg font-bold" >
          Nama Tournament
        </h1>
        <h2 className="text-[13px]">Tingkat Acara</h2>
        <h2 className="text-[13px]">Tanggal</h2>
        <br />
        <small className="text-[10px] mt-4">5-7 Player</small>
      </div>
    </div>

    <div className="relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] max-w-screen md:max-w-screen rounded-lg p-4 overflow-hidden group card-animate">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      {/* Yellow badge */}
      <div className="absolute top-6 right-6 bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
        1st
      </div>
      
      {/* Profile image */}
      <div className="mb-4">
        <img 
          src="/pengurus/download.jpg" 
          alt="Member 2" 
          className="aspect-video w-auto h-auto md:w-auto md:h-80 rounded-lg object-cover border-2 border-[#FFD700]/30"
          />
      </div>
      
      {/* Name */}
      <div className="text-start text-white font-[orbitron]">
        <h1 className="text-lg font-bold" >
          Nama Tournament
        </h1>
        <h2 className="text-[13px]">Tingkat Acara</h2>
        <h2 className="text-[13px]">Tanggal</h2>
        <br />
        <small className="text-[10px] mt-4">5-7 Player</small>
      </div>
    </div>
  </CardScrollAnimation>
    </section> 

    
      
      
      </>
  );
}
