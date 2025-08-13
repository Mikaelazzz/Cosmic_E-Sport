import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <>
    {/* Halaman utama */}
    <section
      className="relative flex flex-col items-center justify-center w-full aspect-video min-h-screen overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(26,35,126,0.7) 100%), url('/ukm.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      >
      <div className="relative z-10 text-center text-white py-12">
        <h1 className="text-4xl font-bold mb-4">
          Join the <span className="text-[#FFD700]">Cosmic Family</span>
        </h1>
        <p className="mb-6">Bergabunglah dengan UKM E-Sport dan wujudkan impianmu esportmu</p>
        <button className="px-6 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-lg">
          Daftar Sekarang
        </button>
        <div className="flex gap-8 justify-center mt-8">
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
        </div>
      </div>
      {/* Optional: Overlay for extra gradient effect */}
      <div className="absolute inset-0 pointer-events-none" />
    </section>

    {/* Halaman kedua */}
    <section className="flex flex-col items-center justify-center w-full min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-4">Tentang <span className="text-[#FFD700]">Cosmic</span></h1>
        <p>COSMIC didirikan pada tahun 2023 sebagai wadah bagi para gamer kampus untuk mengembangkan bakat dan meraih prestasi di dunia e-sport. Kami percaya bahwa setiap pemain memiliki potensi untuk menjadi bintang.</p>
      <div className="flex flex-row">
        <div>
          <div>Visi</div>
          <div>Menjadi Pribadi yang unggul dalam mengembangkan potensi di bidang esport, dengan berkarakter, kreatif dan memiliki pengaruh positif dalam dunia Esport</div>
        </div>
        <div>
          <div>Misi</div>
          <div>Menjadi komunitas yang mendukung dan memfasilitasi para gamer untuk berprestasi di tingkat nasional dan internasional</div>
        </div>
      </div>
    </section>

    {/* Halaman Ketiga */}
    <section className="flex flex-col items-center justify-center w-full min-h-screen p-8">
       <h1 className="text-3xl font-bold mb-4">Pengurus <span className="text-[#FFD700]">Cosmic</span></h1>
    </section> 

    {/* Halaman Keempat */}
    <section className="flex flex-col items-center justify-center w-full min-h-screen p-8">
       <h1 className="text-3xl font-bold mb-4">Prestasi <span className="text-[#FFD700]">Cosmic</span></h1>
    </section> 
      </>
  );
}
