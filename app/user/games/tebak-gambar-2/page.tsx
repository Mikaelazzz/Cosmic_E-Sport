"use client"
import { useEffect, useState } from "react";
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Alert } from '@heroui/react';
import UserLayout from "@/components/UserLayout";

// Data type for hero
interface Hero {
  id: number;
  hero: string;
  image_hero: string;
}

export default function KuisGambarPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [current, setCurrent] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [countdown, setCountdown] = useState(0);

  // Fetch heroes data (same as tebak-gambar)
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

  // Generate random zoom style untuk gambar
  const generateRandomZoom = () => {
    // Scale yang moderat untuk tetap dalam batas
    const scale = 2.2 + Math.random() * 1.3; // Scale 2.2x - 3.5x
    
    // Definisikan area yang aman untuk avoid kepala (hindari Y < 35%)
    // Fokus ke area body, senjata, costume yang ada di bagian tengah-bawah
    const safeRegions = [
      // Area dada dan armor (middle body)
      { x: 35, y: 45, name: 'chest-left' },
      { x: 65, y: 45, name: 'chest-right' },
      { x: 50, y: 50, name: 'chest-center' },
      
      // Area lengan dan senjata (arms & weapons)
      { x: 20, y: 55, name: 'left-arm' },
      { x: 80, y: 55, name: 'right-arm' },
      { x: 15, y: 65, name: 'left-weapon' },
      { x: 85, y: 65, name: 'right-weapon' },
      
      // Area pinggang dan belt (waist details)
      { x: 30, y: 65, name: 'waist-left' },
      { x: 70, y: 65, name: 'waist-right' },
      { x: 50, y: 70, name: 'waist-center' },
      
      // Area kaki dan sepatu (legs & boots)
      { x: 35, y: 80, name: 'legs-left' },
      { x: 65, y: 80, name: 'legs-right' },
      { x: 40, y: 90, name: 'feet-left' },
      { x: 60, y: 90, name: 'feet-right' },
      
      // Area background dan ornamen
      { x: 10, y: 50, name: 'bg-left' },
      { x: 90, y: 50, name: 'bg-right' },
      
      // Area detail costume khusus
      { x: 25, y: 75, name: 'costume-detail-left' },
      { x: 75, y: 75, name: 'costume-detail-right' }
    ];
    
    // Pilih region secara random
    const selectedRegion = safeRegions[Math.floor(Math.random() * safeRegions.length)];
    
    // Tambah variasi kecil (±8%) tapi pastikan tidak naik ke area kepala
    const variationX = (Math.random() - 0.5) * 16; // ±8%
    const variationY = Math.max(0, (Math.random() - 0.5) * 16); // ±8% tapi tidak naik
    
    // Pastikan X dalam range aman dan Y tidak naik ke area kepala
    const finalX = Math.max(15, Math.min(85, selectedRegion.x + variationX));
    const finalY = Math.max(40, Math.min(95, selectedRegion.y + variationY)); // Y minimal 40% (hindari kepala)
    
    return {
      transform: `scale(${scale})`,
      transformOrigin: `${finalX}% ${finalY}%`,
      objectPosition: `${finalX}% ${finalY}%`
    };
  };

  // Pick random hero dan generate zoom style
  const nextHero = () => {
    if (heroes.length === 0) return;
    setShowAnswer(false);
    setShowSuccess(false);
    setShowError(false);
    setUserAnswer('');
    setCountdown(0);
    const idx = Math.floor(Math.random() * heroes.length);
    setCurrent(heroes[idx]);
    setZoomStyle(generateRandomZoom());
  };

  // Check jawaban user
  const checkAnswer = () => {
    if (!current || !userAnswer.trim()) return;
    
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    const normalizedHero = current.hero.toLowerCase().trim();
    
    if (normalizedAnswer === normalizedHero) {
      setShowSuccess(true);
      setShowAnswer(true);
      setCountdown(5); // Start 10 second countdown
      setTimeout(() => setShowSuccess(false), 3000); // Hide alert after 3 seconds
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000); // Hide error alert after 3 seconds
    }
  };

  // Countdown effect untuk auto next hero
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && showAnswer) {
      // Auto next hero setelah countdown selesai
      setTimeout(() => {
        nextHero();
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [countdown, showAnswer]);

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
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
      title="Kuis Gambar Hero"
      description="">
      <section className="p-4 sm:p-6 md:p-8 border-2 border-[#ffd700] rounded-lg max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white my-8 sm:mb-10">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-yellow-400">Kuis Gambar Hero</h1>
          <p className="text-center text-gray-300 mb-4">Tebak nama hero dari gambar yang diperbesar!</p>
          <div className="flex justify-center mb-6">
            <Button onClick={nextHero} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg px-6 py-2">
              Hero Selanjutnya
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6">
            <Alert
              color="success"
              title="Jawaban Benar!"
              description={`Selamat! Anda berhasil menebak "${current?.hero}" dengan benar.`}
              isVisible={showSuccess}
              variant="faded"
              onClose={() => setShowSuccess(false)}
            />
          </div>
        )}

        {/* Error Alert */}
        {showError && (
          <div className="mb-6">
            <Alert
              color="danger"
              title="Jawaban Salah!"
              description={`"${userAnswer}" bukan jawaban yang benar. Coba lagi!`}
              isVisible={showError}
              variant="faded"
              onClose={() => setShowError(false)}
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          {loading && <div className="text-gray-400">Loading gambar hero...</div>}
          
          {!loading && current && (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Gambar Hero */}
              {showAnswer ? (
                // Tampilkan gambar asli setelah jawaban benar dengan ratio 9:16
                <div className="w-64 h-[28rem] border-2 border-yellow-500 rounded-xl select-none pointer-events-none overflow-hidden bg-gray-800 relative" style={{ aspectRatio: '9/16' }}>
                  <img
                    src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${current.image_hero}`}
                    alt={current.hero}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (!e.currentTarget.src.includes('/images/')) {
                        e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/images/${current.image_hero}`;
                      } else {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                </div>
              ) : (
                // Tampilkan gambar yang diperbesar untuk menebak dengan ratio 1:1
                <div className="w-64 h-64 border-2 border-yellow-500 rounded-xl overflow-hidden select-none pointer-events-none bg-gray-800 relative">
                  <div className="w-full h-full overflow-hidden">
                    <img
                      src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${current.image_hero}`}
                      alt="Hero"
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={zoomStyle}
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('/images/')) {
                          e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/images/${current.image_hero}`;
                        } else {
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Input Jawaban */}
              {!showAnswer && (
                <div className="w-full max-w-sm space-y-4">
                  <Input
                    label="Tebak Nama Hero"
                    placeholder="Masukkan nama hero..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                    variant="bordered"
                  />
                  <Button
                    onClick={checkAnswer}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg py-2"
                    disabled={!userAnswer.trim()}
                  >
                    Cek Jawaban
                  </Button>
                </div>
              )}

              {/* Tampilkan jawaban setelah benar */}
              {showAnswer && (
                <div className="text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-yellow-400">{current.hero}</h3>
                  <p className="text-gray-300">Jawaban Anda: <span className="text-green-400 font-bold">{userAnswer}</span></p>
                  {countdown > 0 && (
                    <p className="text-gray-400">Hero selanjutnya dalam {countdown} detik...</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {!loading && !current && <div className="text-gray-400">Hero tidak ditemukan.</div>}
        </div>
      </section>
    </UserLayout>
  );
}
