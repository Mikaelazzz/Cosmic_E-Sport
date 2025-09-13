"use client"
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import React, { useState } from 'react'
import UserLayout from "@/components/UserLayout"

const CekRegion = () => {
  // State untuk form
  const [idAkun, setIdAkun] = useState('')
  const [serverAkun, setServerAkun] = useState('')
  
  // State untuk hasil dan loading
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Fungsi untuk cek region
  const cekRegion = async () => {
    // Validasi input
    if (!idAkun.trim() || !serverAkun.trim()) {
      setError('ID Akun dan Server Akun harus diisi!')
      return
    }
    
    // Validasi format ID (harus berupa angka)
    if (!/^\d+$/.test(idAkun.trim())) {
      setError('ID Akun harus berupa angka!')
      return
    }
    
    // Validasi format Zone ID (harus berupa angka)
    if (!/^\d+$/.test(serverAkun.trim())) {
      setError('Server Akun (Zone ID) harus berupa angka!')
      return
    }
    
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const response = await fetch(
        `https://ceknickname.com/api/mlbb/region?userId=${encodeURIComponent(idAkun.trim())}&zoneId=${encodeURIComponent(serverAkun.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      const data = await response.json()
      
      
      if (!response.ok) {
        // Jika HTTP status bukan 2xx
        setResult({
          success: false,
          message: data.message || `HTTP Error: ${response.status}`,
          data: null
        })
        return
      }
      
      if (data.status === true && data.data) {
        // Sukses
        setResult({
          success: true,
          data: {
            id: data.data.id_game || idAkun.trim(),
            server: serverAkun.trim(),
            nickname: data.data.nickname,
            country: data.data.region
          }
        })
      } else {
        // Error dari API
        setResult({
          success: false,
          message: data.message || 'Data tidak ditemukan',
          data: null
        })
      }
      
    } catch (err) {
      console.error('Error fetching region:', err)
      setError('Terjadi kesalahan saat mengecek region. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      cekRegion()
    }
  }
  
  return (
    <UserLayout 
      title="Cek Region"
      description="Periksa region akun Mobile Legends">
      <section className='p-4 sm:p-6 md:p-8 border-2 border-[#ffd700] rounded-lg max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white my-8 sm:mb-10'>
      <div className='mb-6 sm:mb-8 md:mb-10'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-yellow-400'>Cek Region</h1>
        
        <div className='flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8'>
          <Input
            label="User ID"
            placeholder="Contoh: 12345678"
            value={idAkun}
            onChange={(e) => setIdAkun(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            variant="bordered"
            description="Masukkan User ID Mobile Legends"
            classNames={{
              input: "text-white",
              label: "text-gray-300",
              description: "text-gray-400",
              inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400"
            }}
          />
          
          <Input
            label="Zone ID"
            placeholder="Contoh: 1234"
            value={serverAkun}
            onChange={(e) => setServerAkun(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            variant="bordered"
            description="Masukkan Zone ID Mobile Legends"
            classNames={{
              input: "text-white",
              label: "text-gray-300",
              description: "text-gray-400",
              inputWrapper: "border-gray-600 hover:border-yellow-400 focus-within:border-yellow-400"
            }}
          />
        </div>
        
        {error && (
          <div className='mb-4 p-3 sm:p-4 bg-red-900/30 border border-red-500 rounded-lg'>
            <p className='text-red-400 text-sm sm:text-base text-center'>{error}</p>
          </div>
        )}
        
        <Button 
          onClick={cekRegion}
          className='w-full py-2 sm:py-3 text-sm sm:text-base bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all duration-300'
          disabled={loading}
        >
          {loading ? 'Mengecek Region...' : 'Cek Region'}
        </Button>
      </div>
      
      <div className='mt-6 sm:mt-8 md:mt-10'>
        <h2 className='text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center'>Hasil</h2>
        
        {loading && (
          <div className='text-center py-6 sm:py-10 text-yellow-400'>
            <div className='flex items-center justify-center gap-2 sm:gap-3'>
              <div className='w-6 h-6 sm:w-8 sm:h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
              <p className='text-lg sm:text-xl font-bold'>Mengecek Region...</p>
            </div>
          </div>
        )}
        
        {!loading && result && (
          <div className='bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-dashed border-yellow-400 shadow-lg transform transition-all duration-500 hover:scale-[1.02]'>
            {result.success ? (
              // Sukses
              <div className='space-y-4'>
                <div className='flex items-center justify-center mb-4'>
                  <div className='w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500 rounded-full flex items-center justify-center'>
                    <svg className='w-6 h-6 sm:w-8 sm:h-8 text-black' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7'></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className='text-xl sm:text-2xl font-bold text-center text-yellow-400 mb-6'>ID Ditemukan!</h3>
                
                <div className='grid gap-4 sm:gap-5'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                    <span className='text-yellow-400 font-medium mb-1 sm:mb-0'>ID :</span>
                    <span className='text-yellow-300 font-bold text-lg'>{result.data.id}</span>
                  </div>
{/*                   
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                    <span className='text-yellow-400 font-medium mb-1 sm:mb-0'>Server:</span>
                    <span className='text-yellow-300 font-bold text-lg'>{result.data.server}</span>
                  </div> */}
                  
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                    <span className='text-yellow-400 font-medium mb-1 sm:mb-0'>NickName :</span>
                    <span className='text-yellow-300 font-bold text-lg'>{result.data.nickname}</span>
                  </div>
                  
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                    <span className='text-yellow-400 font-medium mb-1 sm:mb-0'>Region :</span>
                    <span className='text-yellow-300 font-bold text-lg'>{result.data.country}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Error
              <div className='space-y-4'>
                <div className='flex items-center justify-center mb-4'>
                  <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center'>
                    <svg className='w-6 h-6 sm:w-8 sm:h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className='text-xl sm:text-2xl font-bold text-center text-red-400 mb-4'>
                  {result.message}
                </h3>
                
                {result.data && (
                  <div className='grid gap-4 sm:gap-5 opacity-60'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                      <span className='text-gray-300 font-medium mb-1 sm:mb-0'>Username:</span>
                      <span className='text-gray-400 font-bold text-lg'>{result.data.username}</span>
                    </div>
                    
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                      <span className='text-gray-300 font-medium mb-1 sm:mb-0'>User ID:</span>
                      <span className='text-gray-400 font-bold text-lg'>{result.data.user_id}</span>
                    </div>
                    
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                      <span className='text-gray-300 font-medium mb-1 sm:mb-0'>Zone:</span>
                      <span className='text-gray-400 font-bold text-lg'>{result.data.zone}</span>
                    </div>
                    
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg'>
                      <span className='text-gray-300 font-medium mb-1 sm:mb-0'>Country:</span>
                      <span className='text-gray-400 font-bold text-lg'>{result.data.country}</span>
                    </div>
                    
                    {result.data.status && (
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-red-900/30 border border-red-500 rounded-lg'>
                        <span className='text-gray-300 font-medium mb-1 sm:mb-0'>Status:</span>
                        <span className='text-red-400 font-bold text-lg uppercase'>{result.data.status}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {!loading && !result && (
          <div className='text-center py-6 sm:py-10 text-gray-400'>
            <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 sm:w-10 sm:h-10 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'></path>
              </svg>
            </div>
            <p className='text-sm sm:text-base'>Masukkan ID Akun dan Server Akun, lalu klik "Cek Region" untuk melihat informasi!</p>
          </div>
        )}
      </div>
    </section>
  </UserLayout>
  )
}

export default CekRegion