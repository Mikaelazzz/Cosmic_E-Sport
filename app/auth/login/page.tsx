"use client";
import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import type { LoginData } from "@/types/type";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    nim: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    router.push("/");
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user types
    if (error) setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nim || !formData.password) {
      setError("NIM dan Password harus diisi");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await AuthService.login(formData);
      
      if (response.success && response.user) {
        // Call login to update context and set cookie
        login(response.user);
        
        // Small delay to ensure state is updated, then redirect
        setTimeout(() => {
          if (response.user) {
            switch (response.user.role) {
              case 'admin':
                router.push('/admin');
                break;
              case 'moderator':
                router.push('/moderator');
                break;
              default:
                router.push('/user');
            }
          }
        }, 100);
      } else {
        setError(response.message || "Login gagal");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Terjadi kesalahan sistem");
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
            className="text-[#FFD700] text-3xl md:text-4xl font-semibold font-['Orbitron',sans-serif] mb-8 md:mb-12 tracking-wider"
            style={{ letterSpacing: "1px" }}
          >
            LOGIN
          </h2>

          <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
            {error && (
              <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="NIM"
              type="text"
              value={formData.nim}
              onChange={(e) => handleInputChange("nim", e.target.value)}
              className="w-full mb-4 md:mb-5 rounded-md font-sans"
              color="warning"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full mb-4 md:mb-5 rounded-md font-sans"
              color="warning"
              disabled={isLoading}
              endContent={<EyeIcon />}
            />

            <a
              className="text-gray-400 mb-6 text-sm md:text-base self-start font-sans cursor-pointer hover:text-[#FFD700] transition-colors"
              onClick={() => router.push("/auth/forgot-password")}
            >
              Lupa Password ?
            </a>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-[110px] bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-lg font-bold py-2 rounded-md hover:bg-[#FFC300] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>

            <a className="text-gray-400 mt-6 md:mt-10 text-sm md:text-base self-center font-sans cursor-pointer">
              Belum mempunyai Akun ?{" "}
              <span 
                className="text-[#FFD700] hover:text-[#FFC300] transition-colors cursor-pointer" 
                onClick={() => router.push("/auth/register")}
              >
                Daftar
              </span>
            </a>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;