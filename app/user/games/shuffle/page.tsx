"use client"
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select'
import React, { useState, useEffect } from 'react'
import UserLayout from "@/components/UserLayout"

const Page = () => {
  // State untuk form
  const [mode, setMode] = useState('fun')
  const [playerCount, setPlayerCount] = useState('5')
  
  // State untuk hasil shuffle
  type Hero = { id: number; hero: string; role: string; image_hero: string }
  const [results, setResults] = useState<Hero[]>([])
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(false)
  const [shuffling, setShuffling] = useState(false)
  const [shufflePreview, setShufflePreview] = useState<Hero[]>([])
  const [shuffleCycle, setShuffleCycle] = useState(0)
  
  // Fetch heroes data dari GitHub
  useEffect(() => {
    const fetchHeroes = async () => {
      setLoading(true)
      try {
        const response = await fetch('https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/draft.json')
        const data = await response.json()
        setHeroes(data)
      } catch (error) {
        console.error('Error fetching heroes:', error)
        // Fallback ke data dummy jika fetch gagal
        // setHeroes([
        //   { id: 1, hero: 'Layla', role: 'gold.svg', image_hero: 'https://via.placeholder.com/150' },
        //   { id: 2, hero: 'Tigreal', role: 'tank.svg', image_hero: 'https://via.placeholder.com/150' },
        // ])
      } finally {
        setLoading(false)
      }
    }
    
    fetchHeroes()
  }, [])

  // Fungsi untuk shuffle hero dengan animasi seperti Android
  const shuffleHeroes = async () => {
    if (heroes.length === 0) return;
    
    setShuffling(true);
    setResults([]);
    setShufflePreview([]);
    setShuffleCycle(0);
    
    const playerNum = parseInt(playerCount);
    const totalCycles = 20; // 20 siklus seperti pada kode Android
    let finalResult: Hero[] = [];
    
    // Animasi shuffling cycles
    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      setShuffleCycle(cycle);
      
      let tempPreview: Hero[] = [];
      
      if (mode === 'fun') {
        // Fun mode: Acak hero dan role secara terpisah
        const shuffledHeroes = [...heroes].sort(() => Math.random() - 0.5);
        const allRoles = Array.from(new Set(heroes.map(hero => hero.role)));
        const shuffledRoles = [...allRoles].sort(() => Math.random() - 0.5);
        
        const maxPlayers = Math.min(playerNum, shuffledRoles.length);
        
        tempPreview = shuffledHeroes.slice(0, maxPlayers).map((hero, index) => ({
          ...hero,
          id: hero.id + cycle * 1000, // Unique ID for animation
          role: shuffledRoles[index]
        }));
        
      } else if (mode === 'role') {
        // Role mode: Shuffle dengan role asli, pastikan role unik
        const availableHeroes = [...heroes];
        const selectedHeroes: Hero[] = [];
        const usedRoles: string[] = [];
        
        while (selectedHeroes.length < playerNum && availableHeroes.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableHeroes.length);
          const selectedHero = availableHeroes[randomIndex];
          
          if (!usedRoles.includes(selectedHero.role)) {
            selectedHeroes.push({
              ...selectedHero,
              id: selectedHero.id + cycle * 1000
            });
            usedRoles.push(selectedHero.role);
          }
          
          availableHeroes.splice(randomIndex, 1);
        }
        
        tempPreview = selectedHeroes;
      }
      
      setShufflePreview(tempPreview);
      
      // Simpan hasil terakhir sebagai final result
      if (cycle === totalCycles) {
        finalResult = tempPreview.map(hero => ({
          ...hero,
          id: hero.id - totalCycles * 1000 // Reset ID ke original
        }));
      }
      
      // Delay antara cycles (50ms seperti pada kode Android)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Setelah animasi selesai, gunakan hasil dari cycle terakhir
    await new Promise(resolve => setTimeout(resolve, 300)); // Pause sebentar
    
    // Validasi untuk Fun mode - pastikan tidak ada role duplicate
    if (mode === 'fun') {
      const roles = finalResult.map(hero => hero.role);
      const uniqueRoles = Array.from(new Set(roles));
      
      if (roles.length !== uniqueRoles.length) {
        // Jika ada duplicate, perbaiki
        const allRoles = Array.from(new Set(heroes.map(hero => hero.role)));
        const shuffledRoles = [...allRoles].sort(() => Math.random() - 0.5);
        
        finalResult = finalResult.map((hero, index) => ({
          ...hero,
          role: shuffledRoles[index]
        }));
      }
    }
    
    setResults(finalResult);
    setShuffling(false);
    setShufflePreview([]);
  }

  return (
    <UserLayout 
      title="Hero Shuffle"
      description="Acak pilihan hero untuk mode fun atau ranked">
      <section className='p-4 sm:p-6 md:p-8 border-2 border-[#ffd700] rounded-lg max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white my-8 sm:mb-10'>
      <div className='mb-6 sm:mb-8 md:mb-10'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-yellow-400'>Hero Shuffle</h1>
        
        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6'>
          <Select 
            label="Mode" 
            className="flex-1"
            selectedKeys={[mode]}
            onSelectionChange={(keys) => setMode(String(Array.from(keys)[0]))}
            // description={mode === 'fun' ? 'Acak hero dan role secara terpisah (hero bisa dapat role apa saja)' : 'Acak hero dengan role unik (tidak ada role yang sama)'}
          >
            <SelectItem key="fun">Fun</SelectItem>
            <SelectItem key="role">Role</SelectItem>
          </Select>
          
          <Select 
            label="Jumlah Player" 
            className="flex-1"
            selectedKeys={[playerCount]}
            onSelectionChange={(keys) => setPlayerCount(String(Array.from(keys)[0]))}
          >
            <SelectItem key="1">1</SelectItem>
            <SelectItem key="2">2</SelectItem>
            <SelectItem key="3">3</SelectItem>
            <SelectItem key="4">4</SelectItem>
            <SelectItem key="5">5</SelectItem>
          </Select>
        </div>
        
        <Button 
          onClick={shuffleHeroes}
          className='w-full py-2 sm:py-3 text-sm sm:text-base bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all duration-300'
          disabled={loading || heroes.length === 0 || shuffling}
        >
          {loading ? 'Loading Heroes...' : shuffling ? `Shuffling...` : 'Shuffle Heroes'}
        </Button>
      </div>
      
      <div className='mt-6 sm:mt-8 md:mt-10'>
        <h2 className='text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center'>Result</h2>
        {/* <div className='flex justify-between mb-4 px-2'>
          <p className='text-lg'>Mode: <span className='font-bold text-yellow-400 capitalize'>{mode}</span></p>
          <p className='text-lg'>Jumlah Player: <span className='font-bold text-yellow-400'>{playerCount}</span></p>
        </div> */}
        
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
          {shuffling ? (
            // Tampilkan preview shuffling yang berubah-ubah
            shufflePreview.map((hero, index) => (
              <div 
                key={hero.id} 
                className='bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-yellow-500 transform transition-all duration-100'
                style={{
                  animation: 'quickPulse 0.1s ease-in-out infinite alternate',
                }}
              >
                <div className='w-full aspect-[3/4] bg-gray-700 flex items-center justify-center relative'>
                  <img 
                    src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${hero.image_hero}`}
                    alt={hero.hero} 
                    className='w-full h-full object-cover transition-opacity duration-100'
                    onError={(e) => {
                      // Try alternative path
                      if (!e.currentTarget.src.includes('/images/')) {
                        e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/images/${hero.image_hero}`;
                      } else {
                        // If both fail, show placeholder with hero name
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling;
                        if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className='absolute inset-0 bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-white font-bold text-center px-2'
                    style={{ display: 'none' }}
                  >
                    <span className='text-sm sm:text-base'>{hero.hero}</span>
                  </div>
                </div>
                <div className='p-3 sm:p-4'>
                  <h3 className='text-sm sm:text-base md:text-lg font-bold text-center mb-2 text-yellow-400 truncate'>{hero.hero}</h3>
                  <div className='flex items-center justify-center'>
                    <div className='flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-yellow-500 text-black rounded-full text-xs sm:text-sm font-bold'>
                      <img 
                        src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${hero.role}`}
                        alt={hero.role}
                        className='w-3 h-3 sm:w-4 sm:h-4'
                        onError={(e) => {
                          // Try alternative path for SVG
                          if (!e.currentTarget.src.includes('/role/')) {
                            e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/role/${hero.role}`;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                      <span>{hero.role.replace('.svg', '').replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Tampilkan hasil akhir dengan animasi slide in
            results.map((hero, index) => (
              <div 
                key={hero.id} 
                className='bg-gray-800 rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 border border-gray-700'
                style={{
                  animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className='w-full aspect-[3/4] bg-gray-700 flex items-center justify-center relative'>
                  <img 
                    src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${hero.image_hero}`}
                    alt={hero.hero} 
                    className='w-full h-full object-cover'
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onError={(e) => {
                      // Try alternative path
                      if (!e.currentTarget.src.includes('/images/')) {
                        e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/images/${hero.image_hero}`;
                      } else {
                        // If both fail, show placeholder with hero name
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling;
                        if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                      }
                    }}
                    style={{ opacity: '0', transition: 'opacity 0.3s' }}
                  />
                  <div 
                    className='absolute inset-0 bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-white font-bold text-center px-2'
                    style={{ display: 'none' }}
                  >
                    <span className='text-sm sm:text-base'>{hero.hero}</span>
                  </div>
                </div>
                <div className='p-3 sm:p-4'>
                  <h3 className='text-sm sm:text-base md:text-lg font-bold text-center mb-2 truncate'>{hero.hero}</h3>
                  <div className='flex items-center justify-center'>
                    <div className='flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-yellow-500 text-black rounded-full text-xs sm:text-sm font-bold'>
                      <img 
                        src={`https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/${hero.role}`}
                        alt={hero.role}
                        className='w-3 h-3 sm:w-4 sm:h-4'
                        onError={(e) => {
                          // Try alternative path for SVG
                          if (!e.currentTarget.src.includes('/role/')) {
                            e.currentTarget.src = `https://raw.githubusercontent.com/Mikaelaazz/assets/master/src/role/${hero.role}`;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                      <span>{hero.role.replace('.svg', '').replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {loading && (
          <div className='text-center py-6 sm:py-10 text-gray-400'>
            <p className='text-sm sm:text-base'>Loading heroes data...</p>
          </div>
        )}
        
        {!loading && !shuffling && results.length === 0 && (
          <div className='text-center py-6 sm:py-10 text-gray-400'>
            <p className='text-sm sm:text-base'>Belum ada hasil. Klik "Shuffle Heroes" untuk memulai!</p>
          </div>
        )}
        
        {shuffling && (
          <div className='text-center py-6 sm:py-10 text-yellow-400'>
            <div className='flex items-center justify-center gap-2 sm:gap-3'>
              <div className='w-6 h-6 sm:w-8 sm:h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
              <p className='text-lg sm:text-xl font-bold'>Shuffling Heroes...</p>
            </div>
            {/* <p className='text-gray-400'>Cycle {shuffleCycle} of 20 - Randomizing selection...</p> */}
            {/* <div className='mt-4 w-full bg-gray-700 rounded-full h-2 overflow-hidden'>
              <div 
                className='bg-yellow-400 h-2 rounded-full transition-all duration-100 ease-out'
                style={{ width: `${(shuffleCycle / 20) * 100}%` }}
              ></div>
            </div> */}
          </div>
        )}
      </div>
    </section>
  </UserLayout>
  )
}

export default Page