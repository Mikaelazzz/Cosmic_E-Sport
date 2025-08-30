"use client"
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select'
import React, { useState } from 'react'

const Page = () => {
  // State untuk form
  const [mode, setMode] = useState('fun')
  const [playerCount, setPlayerCount] = useState('4')
  
  // State untuk hasil shuffle
  const [results, setResults] = useState([])
  
  // Data hero dummy
  const heroes = [
    { id: 1, name: 'Layla', role: 'Marksman', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Tigreal', role: 'Tank', image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Eudora', role: 'Mage', image: 'https://via.placeholder.com/150' },
    { id: 4, name: 'Alucard', role: 'Fighter', image: 'https://via.placeholder.com/150' },
    { id: 5, name: 'Nana', role: 'Support', image: 'https://via.placeholder.com/150' },
    { id: 6, name: 'Zilong', role: 'Fighter', image: 'https://via.placeholder.com/150' },
    { id: 7, name: 'Miya', role: 'Marksman', image: 'https://via.placeholder.com/150' },
    { id: 8, name: 'Franco', role: 'Tank', image: 'https://via.placeholder.com/150' },
  ]

  // Fungsi untuk shuffle hero
  const shuffleHeroes = () => {
    // Buat salinan array hero
    const shuffled = [...heroes]
    
    // Algoritma Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // Ambil sesuai jumlah player
    const selected = shuffled.slice(0, parseInt(playerCount))
    setResults(selected)
  }

  return (
    <section className='p-8 border-2 border-[#ffd700] rounded-lg max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white mb-10'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold mb-6 text-center text-yellow-400'>Hero Shuffle</h1>
        
        <div className='flex flex-col md:flex-row gap-4 mb-6'>
          <Select 
            label="Mode" 
            className="flex-1"
            selectedKeys={[mode]}
            onSelectionChange={(keys) => setMode(Array.from(keys)[0])}
          >
            <SelectItem key="fun" value="fun">Fun</SelectItem>
            <SelectItem key="role" value="role">Role</SelectItem>
          </Select>
          
          <Select 
            label="Jumlah Player" 
            className="flex-1"
            selectedKeys={[playerCount]}
            onSelectionChange={(keys) => setPlayerCount(Array.from(keys)[0])}
          >
            <SelectItem key="1" value="1">1</SelectItem>
            <SelectItem key="2" value="2">2</SelectItem>
            <SelectItem key="3" value="3">3</SelectItem>
            <SelectItem key="4" value="4">4</SelectItem>
            <SelectItem key="5" value="5">5</SelectItem>
          </Select>
        </div>
        
        <Button 
          onClick={shuffleHeroes}
          className='w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg'
        >
          Shuffle Heroes
        </Button>
      </div>
      
      <div className='mt-10'>
        <h2 className='text-2xl font-bold mb-4 text-center'>Result</h2>
        <div className='flex justify-between mb-4 px-2'>
          <p className='text-lg'>Mode: <span className='font-bold text-yellow-400 capitalize'>{mode}</span></p>
          <p className='text-lg'>Jumlah Player: <span className='font-bold text-yellow-400'>{playerCount}</span></p>
        </div>
        
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {results.map((hero) => (
            <div key={hero.id} className='bg-gray-800 rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 border border-gray-700'>
              <img 
                src={hero.image} 
                alt={hero.name} 
                className='w-full h-48 object-cover'
              />
              <div className='p-4'>
                <h3 className='text-xl font-bold text-center mb-2'>{hero.name}</h3>
                <div className='flex items-center justify-center'>
                  <span className='px-3 py-1 bg-yellow-500 text-black rounded-full text-sm font-bold'>
                    {hero.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {results.length === 0 && (
          <div className='text-center py-10 text-gray-400'>
            <p>Belum ada hasil. Klik "Shuffle Heroes" untuk memulai!</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Page