"use client"
import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { VerificationCodeInput } from "@/components/VerificationCodeInput";

const page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nim: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleClose = () => {
    router.push("/");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage(''); // Clear message when user types
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      setMessage('Email harus diisi terlebih dahulu');
      return;
    }

    setIsSendingEmail(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEmailSent(true);
        setMessage('Kode verifikasi telah dikirim ke email Anda');
      } else {
        setMessage(result.message || 'Gagal mengirim kode verifikasi');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan, silakan coba lagi');
      console.error('Send verification error:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, code }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEmailVerified(true);
        setMessage('Email berhasil diverifikasi!');
      } else {
        setMessage(result.message || 'Kode verifikasi tidak valid');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan, silakan coba lagi');
      console.error('Verify code error:', error);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email is verified
    if (!isEmailVerified) {
      setMessage('Email harus diverifikasi terlebih dahulu');
      return;
    }
    
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Pendaftaran berhasil! Silakan login.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setMessage(result.message || 'Pendaftaran gagal');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan, silakan coba lagi');
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen relative">
      {/* Close Button - X di pojok kiri atas */}
      <button
  onClick={handleClose}
  className="absolute top-4 left-4 z-10 w-10 h-10 bg-black text-white hover:bg-gray-800 rounded-[6px] flex items-center justify-center text-center text-xl font-bold transition-colors duration-200 leading-none md:block"
  aria-label="Close"
>
  ×
</button>

      {/* Left Side - Hidden on mobile */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center bg-[#FFD700]">
        <img src="/logo.png" alt="Logo" className="w-96 mb-4" />
        <div className="max-w-md text-center">
          {/* <Button
            className="border-2 border-black !text-black bg-transparent hover:bg-[#FFC300] font-bold px-8 py-2 rounded-md transition-colors duration-200 disabled:opacity-50"
            style={{ color: "#FFD700" }}
            onClick={() => router.push("/auth/login")}
          >
            Login
          </Button> */}
        </div>
      </div>
      {/* Right Side - Full width on mobile */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-black px-6 md:px-0">
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center px-4 md:px-0">
          <h2
            className="text-[#FFD700] text-3xl md:text-4xl font-normal font-['Orbitron',sans-serif] mb-8 md:mb-12 tracking-wider"
            style={{ letterSpacing: "1px" }}
          >
            Register
          </h2>
          
          {message && (
            <div className={`w-full mb-4 p-3 rounded-md text-center font-sans ${
              message.includes('berhasil') 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {message}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            type="text"
            value={formData.nama_lengkap}
            onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
            className="w-full mb-4 md:mb-5 bg-[#393B4A] text-gray-200 placeholder:text-gray-400 border-0 rounded-md font-sans"
            required
          />
          <Input
            label="NIM"
            type="text"
            value={formData.nim}
            onChange={(e) => handleInputChange('nim', e.target.value)}
            className="w-full mb-4 md:mb-5 bg-[#393B4A] text-gray-200 placeholder:text-gray-400 border-0 rounded-md font-sans"
            required
          />
          
          {/* Email with verification */}
          <div className="w-full mb-4 md:mb-5">
            <div className="flex gap-2">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="flex-1 bg-[#393B4A] text-gray-200 placeholder:text-gray-400 border-0 rounded-md font-sans"
                disabled={isEmailVerified}
                required
              />
              <Button
                type="button"
                onClick={handleSendVerification}
                disabled={!formData.email || isSendingEmail || isEmailVerified}
                className="px-4 py-2 bg-[#FFD700] text-black font-bold rounded-md hover:bg-[#FFC300] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isSendingEmail ? 'Mengirim...' : isEmailVerified ? 'Terverifikasi' : 'Kirim Kode'}
              </Button>
            </div>
            
            {isEmailSent && !isEmailVerified && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-3 text-center">
                  Masukkan kode verifikasi 6 digit yang dikirim ke email Anda
                </p>
                <VerificationCodeInput
                  onComplete={handleVerifyCode}
                  disabled={isVerifyingCode}
                />
                {isVerifyingCode && (
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    Memverifikasi kode...
                  </p>
                )}
              </div>
            )}
          </div>
          
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full mb-4 md:mb-5 bg-[#393B4A] text-gray-200 placeholder:text-gray-400 border-0 rounded-md font-sans"
            required
          />
          <Button
            type="submit"
            disabled={isLoading || !isEmailVerified}
            className="w-full md:w-[110px] bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-lg font-bold py-2 rounded-md hover:bg-[#FFC300] transition-colors duration-200 mb-6 disabled:opacity-50"
          >
            {isLoading ? 'Mendaftar...' : 'Daftar'}
          </Button>
          <a
            className="text-gray-400 text-sm md:text-base self-center font-sans cursor-pointer"
          >
            Sudah mempunyai Akun ? <span className="text-[#FFD700] hover:text-[#FFC300] transition-colors" onClick={() => router.push("/auth/login")}>Login</span>
          </a>
        </form>
      </div>
    </section>
  );
};

export default page;