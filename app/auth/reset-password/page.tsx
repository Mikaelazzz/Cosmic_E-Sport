'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Alert } from '@heroui/alert';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger' | 'warning' | 'default'>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
    isValid: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Redirect jika tidak ada token
  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  // Validasi password real-time
  useEffect(() => {
    const { newPassword } = formData;
    const validation = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      isValid: false
    };
    
    validation.isValid = validation.length && validation.uppercase && validation.number && validation.symbol;
    setPasswordValidation(validation);
  }, [formData.newPassword]);

  // Validasi konfirmasi password
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordsMatch(formData.newPassword === formData.confirmPassword);
    }
  }, [formData.newPassword, formData.confirmPassword]);

  const handleClose = () => {
    router.push("/auth/login");
  };

  const showMessage = (msg: string, type: 'success' | 'danger' | 'warning' | 'default' = 'default') => {
    setMessage(msg);
    setMessageType(type);
    setShowAlert(true);
  };

  const hideMessage = () => {
    setShowAlert(false);
    setMessage('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear message when user types
    if (showAlert) hideMessage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      showMessage('Password harus memenuhi semua kriteria yang diperlukan', 'warning');
      return;
    }

    if (!passwordsMatch) {
      showMessage('Konfirmasi password tidak cocok dengan password baru', 'warning');
      return;
    }

    if (!token) {
      showMessage('Token reset password tidak valid', 'danger');
      return;
    }

    setIsLoading(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Password berhasil direset! Silakan login dengan password baru Anda.', 'success');
        
        // Redirect ke login setelah 3 detik
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        showMessage(data.message || 'Gagal mereset password. Silakan coba lagi.', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan jaringan. Silakan coba lagi.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Eye icon components
  const EyeIcon = ({ showPassword, onClick }: { showPassword: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="text-gray-400 hover:text-gray-200 transition-colors p-1"
      tabIndex={-1}
    >
      {showPassword ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  if (!token) {
    return null; // Akan redirect di useEffect
  }

  return (
    <section className="flex min-h-screen relative">
      {/* Close Button */}
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
        {/* <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-5 text-black font-sans">
            Reset Password
          </h1>
          <p className="text-lg text-black font-sans mb-8 leading-relaxed">
            Masukkan password baru Anda untuk melanjutkan proses reset password
          </p>
        </div> */}
      </div>

      {/* Right Side - Full width on mobile */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-black px-6 md:px-0">
        <div className="w-full max-w-md flex flex-col items-center px-4 md:px-0">
          <h2
            className="text-[#FFD700] text-3xl md:text-4xl font-semibold font-['Orbitron',sans-serif] mb-8 md:mb-12 tracking-wider"
            style={{ letterSpacing: "1px" }}
          >
            RESET PASSWORD
          </h2>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            {showAlert && message && (
              <Alert
                color={messageType}
                description={message}
                isVisible={showAlert}
                title={messageType === 'success' ? 'Berhasil!' : messageType === 'danger' ? 'Error!' : messageType === 'warning' ? 'Peringatan!' : 'Info'}
                variant="faded"
                onClose={hideMessage}
                className="w-full mb-4"
              />
            )}

            <div className="w-full mb-4 md:mb-5">
              <Input
                label="Password Baru"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full rounded-md font-sans"
                color="warning"
                disabled={isLoading}
                endContent={
                  <EyeIcon 
                    showPassword={showPassword} 
                    onClick={() => setShowPassword(!showPassword)} 
                  />
                }
                description={
                  formData.newPassword.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={passwordValidation.length ? 'text-green-500' : 'text-red-500'}>
                          {passwordValidation.length ? '✓' : '✗'}
                        </span>
                        <span>Minimal 8 karakter</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={passwordValidation.uppercase ? 'text-green-500' : 'text-red-500'}>
                          {passwordValidation.uppercase ? '✓' : '✗'}
                        </span>
                        <span>1 huruf kapital</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={passwordValidation.number ? 'text-green-500' : 'text-red-500'}>
                          {passwordValidation.number ? '✓' : '✗'}
                        </span>
                        <span>1 angka</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={passwordValidation.symbol ? 'text-green-500' : 'text-red-500'}>
                          {passwordValidation.symbol ? '✓' : '✗'}
                        </span>
                        <span>1 simbol (!@#$%^&*)</span>
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </div>

            <div className="w-full mb-4 md:mb-5">
              <Input
                label="Konfirmasi Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full rounded-md font-sans"
                color={
                  formData.confirmPassword && !passwordsMatch 
                    ? 'danger' 
                    : formData.confirmPassword && passwordsMatch
                    ? 'success'
                    : 'warning'
                }
                disabled={isLoading}
                endContent={
                  <EyeIcon 
                    showPassword={showConfirmPassword} 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  />
                }
                description={
                  formData.confirmPassword ? (
                    <div className="mt-2">
                      {passwordsMatch ? (
                        <div className="text-xs text-green-500 flex items-center gap-2">
                          <span>✓</span>
                          <span>Password cocok</span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-500 flex items-center gap-2">
                          <span>✗</span>
                          <span>Password tidak cocok</span>
                        </div>
                      )}
                    </div>
                  ) : undefined
                }
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch || !formData.confirmPassword}
              className="w-auto md:w-[150px] bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-lg font-bold py-2 rounded-md hover:bg-[#FFC300] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {isLoading ? "Mereset..." : "Reset Password"}
            </Button>

            <a className="text-gray-400 text-sm md:text-base self-center font-sans cursor-pointer">
              Sudah ingat password ?{" "}
              <span 
                className="text-[#FFD700] hover:text-[#FFC300] transition-colors cursor-pointer" 
                onClick={() => router.push("/auth/login")}
              >
                Login
              </span>
            </a>
          </form>
        </div>
      </div>
    </section>
  );
}