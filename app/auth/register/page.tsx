"use client"
import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
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
  const [messageType, setMessageType] = useState<'success' | 'danger' | 'warning' | 'default'>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
    isValid: false
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email && !isEmailSent && !isEmailVerified) {
        checkEmailStatus(formData.email);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.email, isEmailSent, isEmailVerified]);

  const handleClose = () => {
    router.push("/");
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

  const checkEmailStatus = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    setIsCheckingEmail(true);
    
    try {
      const response = await fetch('/api/auth/check-email-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.available) {
        showMessage(result.message, 'warning');
        // Reset email states if email not available
        setIsEmailSent(false);
        setIsEmailVerified(false);
        setResendTimer(0);
      } else {
        // Clear any previous warning messages if email is available
        if (messageType === 'warning' && showAlert) {
          hideMessage();
        }
      }
    } catch (error) {
      console.error('Check email status error:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: false
    };
    
    validation.isValid = validation.length && validation.uppercase && validation.number && validation.symbol;
    setPasswordValidation(validation);

    // Show alert if password doesn't meet requirements and user has typed something
    if (password.length > 0 && !validation.isValid) {
      const missingRequirements = [];
      if (!validation.length) missingRequirements.push("minimal 8 karakter");
      if (!validation.uppercase) missingRequirements.push("1 huruf kapital");
      if (!validation.number) missingRequirements.push("1 angka");
      if (!validation.symbol) missingRequirements.push("1 simbol");
      
      showMessage(`Password harus memiliki: ${missingRequirements.join(", ")}`, 'warning');
    } else if (validation.isValid && messageType === 'warning' && message.includes('Password')) {
      hideMessage();
    }

    return validation.isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate password in real-time
    if (field === 'password') {
      setTimeout(() => validatePassword(value), 500); // Debounce 500ms
    } else {
      hideMessage(); // Clear message when user types in other fields
    }
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      showMessage('Email harus diisi terlebih dahulu', 'warning');
      return;
    }

    setIsSendingEmail(true);
    hideMessage();

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
        setResendTimer(60); // 60 seconds cooldown
        showMessage('Kode verifikasi telah dikirim ke email Anda', 'success');
      } else {
        showMessage(result.message || 'Gagal mengirim kode verifikasi', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Send verification error:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingEmail(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();

      if (result.success) {
        setResendTimer(60); // Reset 60 seconds cooldown
        showMessage('Kode verifikasi baru telah dikirim ke email Anda', 'success');
      } else {
        showMessage(result.message || 'Gagal mengirim ulang kode verifikasi', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Resend verification error:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, code }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEmailVerified(true);
        showMessage('Email berhasil diverifikasi!', 'success');
      } else {
        showMessage(result.message || 'Kode verifikasi tidak valid', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Verify code error:', error);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email is verified
    if (!isEmailVerified) {
      showMessage('Email harus diverifikasi terlebih dahulu', 'warning');
      return;
    }

    // Check password validation
    if (!passwordValidation.isValid) {
      showMessage('Password tidak memenuhi kriteria yang diperlukan', 'warning');
      return;
    }
    
    setIsLoading(true);
    hideMessage();

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
        showMessage('Pendaftaran berhasil! Silakan login.', 'success');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        showMessage(result.message || 'Pendaftaran gagal', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eye icon component
  const EyeIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
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
        <img src="/logo.webp" alt="Logo" className="w-96 mb-4" />
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
            className="text-[#FFD700] text-3xl md:text-4xl font-semibold font-['Orbitron',sans-serif] mb-8 md:mb-12 tracking-wider"
            style={{ letterSpacing: "1px" }}
          >
            Register
          </h2>
          
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

          <Input
            label="Nama Lengkap"
            type="text"
            value={formData.nama_lengkap}
            onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
            className="w-full mb-4 md:mb-5 rounded-md font-sans"
            required
            color="warning"
          />
          <Input
            label="NIM"
            type="text"
            value={formData.nim}
            onChange={(e) => handleInputChange('nim', e.target.value)}
            className="w-full mb-4 md:mb-5 rounded-md font-sans"
            required
            color="warning"
          />
          
          {/* Email with verification */}
          <div className="w-full">
            <div className="flex gap-2 mb-4 md:mb-5">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="flex-1 rounded-md font-sans"
                required
                color="warning"
                disabled={isEmailVerified}
                description={isCheckingEmail ? "Mengecek ketersediaan email..." : ""}
              />
              <Button
                type="button"
                onClick={isEmailSent && !isEmailVerified ? handleResendVerification : handleSendVerification}
                disabled={!formData.email || isSendingEmail || isEmailVerified || isCheckingEmail || (isEmailSent && resendTimer > 0)}
                className="h-14 px-4 bg-[#FFD700] text-black font-bold rounded-md hover:bg-[#FFC300] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isSendingEmail 
                  ? 'Mengirim...' 
                  : isCheckingEmail
                    ? 'Mengecek...'
                    : isEmailVerified 
                      ? 'Terverifikasi' 
                      : isEmailSent 
                        ? (resendTimer > 0 ? `Kirim Ulang (${resendTimer}s)` : 'Kirim Ulang Kode')
                        : 'Kirim Kode'
                }
              </Button>
            </div>
            
            {isEmailSent && !isEmailVerified && (
              <div className="-mt-4 mb-4 md:mb-5">
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
          
          <div className="w-full mb-4 md:mb-5">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full rounded-md font-sans"
              required
              color="warning"
              endContent={<EyeIcon />}
              description={
                formData.password.length > 0 ? (
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
          
          <Button
            type="submit"
            disabled={isLoading || !isEmailVerified || !passwordValidation.isValid}
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