"use client"
import { useEffect, useState } from "react";
import { ScratchToReveal } from "@/components/scratch-to-reveal";
import { Button } from '@heroui/button';
import UserLayout from "@/components/UserLayout";

// Data type for hero
interface Hero {
  id: number;
  hero: string;
  image_hero: string;
}

export default function TebakGambarPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [current, setCurrent] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [key, setKey] = useState(0); // Key untuk reset ScratchToReveal

  // Fetch heroes data (same as shuffle, but only hero & image_hero)
  useEffect(() => {
    const fetchHeroes = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/draft.json');
        const data = await response.json();
        setHeroes(data.map((h: any) => ({ id: h.id, hero: h.hero, image_hero: h.image_hero })));
      } catch (error) {
        setHeroes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroes();
  }, []);

  // Pick random hero
  const nextHero = () => {
    if (heroes.length === 0) return;
    setShowAnswer(false);
    setKey(prev => prev + 1); // Reset ScratchToReveal dengan key baru
    const idx = Math.floor(Math.random() * heroes.length);
    setCurrent(heroes[idx]);
  };

  // Handler ketika scratch selesai - langsung tampilkan jawaban
  const handleScratchComplete = () => {
    setShowAnswer(true);
  };

  // On mount, pick first hero
  useEffect(() => {
    if (heroes.length > 0 && !current) {
      nextHero();
    }
    // eslint-disable-next-line
  }, [heroes]);

  return (
    <UserLayout 
      title="Tebak Gambar Hero"
      description="">
      <section className="p-4 sm:p-6 md:p-8 border-2 border-[#ffd700] rounded-lg max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white my-8 sm:mb-10">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-yellow-400">Tebak Gambar Hero</h1>
          <p className="text-center text-gray-300 mb-4">Geser untuk membuka gambar, lalu tebak nama hero-nya!</p>
          <div className="flex justify-center mb-6">
            <Button onClick={nextHero} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg px-6 py-2">Mulai ulang</Button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          {loading && <div className="text-gray-400">Loading gambar hero...</div>}
          {!loading && current && (
            <div className="flex flex-col items-center gap-4">
              <ScratchToReveal
                key={key} // Key untuk reset komponen
                width={250}
                height={250}
                minScratchPercentage={70}
                className="flex items-center justify-center overflow-hidden rounded-2xl border-2 bg-gray-100"
                gradientColors={["#A97CF8", "#F38CB8", "#FDCC92"]}
                onComplete={handleScratchComplete}
              >
                <img
                  src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${current.image_hero}`}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('/images/')) {
                      e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/images/${current.image_hero}`;
                    } else {
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                />
              </ScratchToReveal>
              <div className="text-center mt-2">
                {showAnswer ? (
                  <span className="text-xl sm:text-2xl font-bold text-yellow-400">{current.hero}</span>
                ) : (
                  <span className="text-gray-400"></span>
                )}
              </div>
            </div>
          )}
          {!loading && !current && <div className="text-gray-400">Hero tidak ditemukan.</div>}
        </div>
      </section>
    </UserLayout>
  );
}
