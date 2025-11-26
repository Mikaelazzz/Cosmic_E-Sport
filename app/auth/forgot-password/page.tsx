"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { useRouter } from "next/navigation";
import { VerificationCodeInput } from "@/components/VerificationCodeInput";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger' | 'warning' | 'default'>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  const handleInputChange = (value: string) => {
    setEmail(value);
    hideMessage();
  };

  const handleSendResetCode = async () => {
    if (!email) {
      showMessage('Email harus diisi terlebih dahulu', 'warning');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Format email tidak valid', 'warning');
      return;
    }

    setIsSendingEmail(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEmailSent(true);
        setResendTimer(60);
        showMessage('Kode reset password telah dikirim ke email Anda', 'success');
      } else {
        showMessage(result.message || 'Gagal mengirim kode reset', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Send reset code error:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResendCode = async () => {
    setIsSendingEmail(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/resend-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setResendTimer(60);
        showMessage('Kode reset password baru telah dikirim ke email Anda', 'success');
      } else {
        showMessage(result.message || 'Gagal mengirim ulang kode reset', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Resend reset code error:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    hideMessage();

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();

      if (result.success) {
        setIsCodeVerified(true);
        showMessage('Kode berhasil diverifikasi! Redirecting ke halaman reset password...', 'success');
        
        // Redirect to reset password page with token
        setTimeout(() => {
          router.push(`/auth/reset-password?token=${result.token}&email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        showMessage(result.message || 'Kode verifikasi tidak valid', 'danger');
      }
    } catch (error) {
      showMessage('Terjadi kesalahan, silakan coba lagi', 'danger');
      console.error('Verify reset code error:', error);
    } finally {
      setIsVerifyingCode(false);
    }
  };

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
        <img src="/logo.webp" alt="Logo" className="w-96 mb-4" />
      </div>

      {/* Right Side - Full width on mobile */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-black px-6 md:px-0">
        <div className="w-full max-w-md flex flex-col items-center px-4 md:px-0">
          <h2
            className="text-[#FFD700] text-3xl md:text-4xl font-semibold font-['Orbitron',sans-serif] mb-4 md:mb-6 tracking-wider text-center"
            style={{ letterSpacing: "1px" }}
          >
            LUPA PASSWORD
          </h2>
          
          <p className="text-gray-400 text-sm md:text-base text-center mb-8 md:mb-12 font-sans">
            Masukkan email Anda untuk mendapatkan kode verifikasi reset password
          </p>

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

          {!isEmailSent ? (
            // Email Input Form
            <div className="w-full flex flex-col items-center">
              <div className="flex gap-2 w-full mb-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 rounded-md font-sans"
                  color="warning"
                  disabled={isSendingEmail}
                />
                <Button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={!email || isSendingEmail}
                  className="h-14 px-4 bg-[#FFD700] text-black font-bold rounded-md hover:bg-[#FFC300] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isSendingEmail ? 'Mengirim...' : 'Kirim Kode'}
                </Button>
              </div>

              <a
                className="text-gray-400 text-sm md:text-base self-center font-sans cursor-pointer hover:text-[#FFD700] transition-colors"
                onClick={() => router.push("/auth/login")}
              >
                Kembali ke Login
              </a>
            </div>
          ) : !isCodeVerified ? (
            // Code Verification Form
            <div className="w-full flex flex-col items-center">
              <div className="flex gap-2 w-full mb-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  className="flex-1 rounded-md font-sans"
                  color="warning"
                  disabled={true}
                />
                <Button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || isSendingEmail}
                  className="h-14 px-4 bg-[#FFD700] text-black font-bold rounded-md hover:bg-[#FFC300] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isSendingEmail 
                    ? 'Mengirim...' 
                    : resendTimer > 0 
                      ? `Kirim Ulang (${resendTimer}s)` 
                      : 'Kirim Ulang'
                  }
                </Button>
              </div>

              <div className="w-full mb-6">
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

              <a
                className="text-gray-400 text-sm md:text-base self-center font-sans cursor-pointer hover:text-[#FFD700] transition-colors"
                onClick={() => router.push("/auth/login")}
              >
                Kembali ke Login
              </a>
            </div>
          ) : (
            // Success State
            <div className="w-full flex flex-col items-center text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <p className="text-gray-300 text-lg mb-6">
                Kode berhasil diverifikasi!
              </p>
              <p className="text-gray-400 text-sm">
                Anda akan dialihkan ke halaman reset password...
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;