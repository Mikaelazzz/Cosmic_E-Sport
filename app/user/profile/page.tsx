"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import Lottie from "lottie-react";
import { useAuth } from "@/context/AuthContext";
import UserLayout from "@/components/UserLayout";
import { getUserAvatarUrl } from "@/lib/avatar";
import { VerificationCodeInput } from "@/components/VerificationCodeInput";

// Eye Icon Component
const EyeIcon = ({ isVisible, onClick }: { isVisible: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-gray-400 hover:text-white transition-colors"
  >
    {isVisible ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      </svg>
    )}
  </button>
);

// Simple Image Converter Component dengan automatic 1:1 aspect ratio
const ImageConverter = ({ imageSrc, onConvert, onCancel }: {
  imageSrc: string;
  onConvert: (convertedImageBlob: Blob) => void;
  onCancel: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleConvert = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    setIsProcessing(true);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to square (1:1 aspect ratio)
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Calculate the square crop from center
      const minDimension = Math.min(naturalWidth, naturalHeight);
      const cropX = (naturalWidth - minDimension) / 2;
      const cropY = (naturalHeight - minDimension) / 2;

      // Clear canvas and draw square cropped image
      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.drawImage(
        img,
        cropX,
        cropY,
        minDimension,
        minDimension,
        0, 0, outputSize, outputSize
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onConvert(blob);
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error converting image:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="text-center">
        <p className="text-sm text-gray-300 mb-3">
          Preview gambar akan dikonversi ke aspect ratio 1:1 (persegi)
        </p>
        <div className="relative inline-block rounded-lg overflow-hidden border border-gray-600 bg-gray-800">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Preview"
            className="block max-w-[300px] max-h-[300px] object-contain"
            onLoad={handleImageLoad}
          />
        </div>
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Controls */}
      <div className="flex justify-center gap-3 pt-2">
        <Button
          variant="light"
          onPress={onCancel}
          className="text-gray-300"
          disabled={isProcessing}
        >
          Batal
        </Button>
        <Button
          color="primary"
          onPress={handleConvert}
          disabled={!imageLoaded || isProcessing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" color="white" />
              Memproses...
            </>
          ) : (
            'Gunakan Gambar'
          )}
        </Button>
      </div>
    </div>
  );
};

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [avatarKey, setAvatarKey] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [editAnimation, setEditAnimation] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lottieRef = useRef<any>(null);
  
  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // Change password states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
    isValid: false,
    match: false
  });

  const [formData, setFormData] = useState({
    nim: "",
    nama_lengkap: "",
    jabatan: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nim: user.nim || "",
        nama_lengkap: user.nama_lengkap || "",
        jabatan: user.jabatan || "",
      });
    }
  }, [user]);

  // Load Lottie animation
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const animationData = await fetch('/edit-profile.json').then(res => res.json());
        setEditAnimation(animationData);
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };
    loadAnimation();
  }, []);

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user?.email) return;
      
      try {
        const response = await fetch('/api/auth/check-email-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        const result = await response.json();
        setIsEmailVerified(result.verified || false);
      } catch (error) {
        console.error('Error checking email verification:', error);
        setIsEmailVerified(user?.email_verified || false);
      }
    };

    if (user?.email) {
      checkEmailVerification();
    }
  }, [user?.email]);

  // Fetch fresh user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setFormData({
              nim: result.data.nim || "",
              nama_lengkap: result.data.nama_lengkap || "",
              jabatan: result.data.jabatan || "",
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validasi format file
      const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedFormats.includes(file.type)) {
        setMessage("Format file tidak valid! Hanya menerima format JPG, JPEG, PNG, atau WEBP.");
        setMessageType("error");
        // Reset input file
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validasi ukuran file (maksimal 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB dalam bytes
      if (file.size > maxSize) {
        setMessage("Ukuran file melebihi batas maksimal 5MB!");
        setMessageType("error");
        // Reset input file
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Jika validasi lolos, lanjutkan proses
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async (croppedBlob: Blob) => {
    if (!user) return;

    const formData = new FormData();
    const fileName = `${user.role.toLowerCase()}-${user.nim}.jpg`;
    formData.append('avatar', croppedBlob, fileName);
    formData.append('nim', user.nim);
    formData.append('role', user.role);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Avatar updated successfully!");
        setMessageType("success");
        setShowCropModal(false);
        setSelectedImage("");
        setAvatarKey(prev => prev + 1);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage(result.message || "Failed to update avatar");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage("An error occurred while updating avatar");
      setMessageType("error");
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: user.nim, role: user.role }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Avatar removed successfully!");
        setMessageType("success");
        setAvatarKey(prev => prev + 1);
        
        // Refresh user data to update navbar and other components
        await refreshUser();
      } else {
        setMessage(result.message || "Failed to remove avatar");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      setMessage("An error occurred while removing avatar");
      setMessageType("error");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
        setIsEditing(false);
      } else {
        setMessage(result.message || "Failed to update profile");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage("An error occurred while updating profile");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nim: user.nim || "",
        nama_lengkap: user.nama_lengkap || "",
        jabatan: user.jabatan || "",
      });
    }
    setIsEditing(false);
    setMessage("");
  };

  const handleSendVerification = async () => {
    if (!user?.email) return;

    setIsSendingVerification(true);
    setMessage("");

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationSent(true);
        setShowVerificationModal(true);
        setMessage("Kode verifikasi telah dikirim ke email Anda.");
        setMessageType("success");
      } else {
        setMessage(result.message || "Gagal mengirim kode verifikasi");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setMessage("Terjadi kesalahan saat mengirim kode verifikasi");
      setMessageType("error");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!user?.email) return;

    setIsVerifyingCode(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, code }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEmailVerified(true);
        setShowVerificationModal(false);
        setMessage("Email berhasil diverifikasi!");
        setMessageType("success");
      } else {
        setMessage(result.message || "Kode verifikasi tidak valid");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessage("Terjadi kesalahan saat memverifikasi kode");
      setMessageType("error");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const validatePassword = (password: string, confirmPassword: string = passwordData.confirmPassword) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: false,
      match: password === confirmPassword && password.length > 0
    };
    
    validation.isValid = validation.length && validation.uppercase && validation.number && validation.symbol && validation.match;
    setPasswordValidation(validation);
    return validation.isValid;
  };

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    const newPasswordData = { ...passwordData, [field]: value };
    setPasswordData(newPasswordData);
    
    if (field === 'newPassword') {
      validatePassword(value, newPasswordData.confirmPassword);
    } else {
      validatePassword(newPasswordData.newPassword, value);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordValidation.isValid) {
      setMessage("Password tidak memenuhi kriteria yang diperlukan");
      setMessageType("error");
      return;
    }

    setIsChangingPassword(true);
    setMessage("");

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: passwordData.newPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowChangePasswordModal(false);
        setPasswordData({ newPassword: "", confirmPassword: "" });
        setMessage("Password berhasil diubah!");
        setMessageType("success");
      } else {
        setMessage(result.message || "Gagal mengubah password");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage("Terjadi kesalahan saat mengubah password");
      setMessageType("error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="warning" title="Access Denied">
          Please login to access this page.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="warning" title="Access Denied">
          Please login to access this page.
        </Alert>
      </div>
    );
  }

  return (
    <UserLayout
      title="Profile User"
      description="Kelola informasi profil dan avatar Anda"
    >
      {message && (
        <Alert
          color={messageType === "success" ? "success" : "danger"}
          className="mb-6"
          title={messageType === "success" ? "Success" : "Error"}
        >
          {message}
        </Alert>
      )}

      <div className="shadow-lg">
        <div className="p-8">
          {/* Mobile Layout: Avatar on top, Form below */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar Section - Appears first on mobile, right on desktop */}
            <div className="flex flex-col items-center justify-start space-y-4 lg:order-2">
              <div className="relative">
                <div className="w-48 h-48 border-4 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    key={avatarKey} // Force re-render when avatar changes
                    src={getUserAvatarUrl(user, 200, true)}
                    alt="Profile"
                    className="w-48 h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/logc.png';
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-0.5 right-4 rounded-full w-10 h-10 min-w-10 bg-[#FFD700] border-2 border-[#FF1744] p-0 overflow-hidden"
                  onPress={() => fileInputRef.current?.click()}
                  onMouseEnter={() => {
                    setIsHovering(true);
                    if (lottieRef.current) {
                      lottieRef.current.play();
                    }
                  }}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    if (lottieRef.current) {
                      lottieRef.current.stop();
                    }
                  }}
                >
                  {editAnimation ? (
                    <Lottie
                      lottieRef={lottieRef}
                      animationData={editAnimation}
                      className="w-6 h-6"
                      loop={true}
                      autoplay={false}
                    />
                  ) : (
                    // Fallback icon jika animasi belum load
                    <svg 
                      className="w-5 h-5 text-[#FF1744]" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  )}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                color="danger"
                variant="solid"
                size="sm"
                className="px-8"
                onPress={handleRemoveAvatar}
              >
                Remove
              </Button>
            </div>

            {/* Form Section - Appears second on mobile, left on desktop */}
            <div className="flex-1 space-y-6 lg:order-1">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Username</label>
                <Input
                  value={formData.nama_lengkap}
                  onValueChange={(value) => handleInputChange('nama_lengkap', value)}
                  size="lg"
                  isReadOnly={!isEditing}
                  variant={isEditing ? "bordered" : "flat"}
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: `bg-transparent border-2 ${isEditing ? 'border-yellow-400' : 'border-gray-600'} rounded-lg`,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">NIM</label>
                <Input
                  value={formData.nim}
                  onValueChange={(value) => handleInputChange('nim', value)}
                  size="lg"
                  isReadOnly
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: `bg-transparent border-2 border-gray-600 rounded-lg`,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Jabatan</label>
                <Input
                  value={formData.jabatan}
                  onValueChange={(value) => handleInputChange('jabatan', value)}
                  size="lg"
                  isReadOnly
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: `bg-transparent border-2 border-gray-600 rounded-lg`,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Email
                  {isEmailVerified ? (
                    <span className="ml-2 text-green-400 text-xs">✓ Terverifikasi</span>
                  ) : (
                    <span className="ml-2 text-red-400 text-xs">⚠ Belum diverifikasi</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={user.email}
                    size="lg"
                    type="email"
                    isReadOnly
                    variant="flat"
                    className="bg-transparent flex-1"
                    classNames={{
                      input: "bg-transparent text-white placeholder-gray-400",
                      inputWrapper: `bg-transparent border-2 border-gray-600 rounded-lg ${!isEmailVerified ? 'border-red-500/50' : 'border-green-500/50'}`,
                    }}
                  />
                  {!isEmailVerified && (
                    <Button
                      onClick={handleSendVerification}
                      disabled={isSendingVerification}
                      size="lg"
                      className="bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition-colors whitespace-nowrap"
                    >
                      {isSendingVerification ? 'Mengirim...' : verificationSent ? 'Kirim Ulang' : 'Verifikasi'}
                    </Button>
                  )}
                </div>
                {!isEmailVerified && (
                  <p className="text-red-400 text-xs mt-1">
                    Email Anda belum diverifikasi. Silakan klik tombol "Verifikasi" untuk mendapatkan kode verifikasi.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Bergabung pada</label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                  size="lg"
                  isReadOnly
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Role</label>
                <Input
                  value="Member"
                  size="lg"
                  isReadOnly
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start mt-8 pt-6 border-t border-gray-700">
            {!isEditing ? (
              <Button
                color="primary"
                size="lg"
                className="px-12"
                onPress={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-4">
                <Button
                  color="success"
                  size="lg"
                  className="px-8"
                  onPress={handleSave}
                  isLoading={isSaving}
                  isDisabled={isSaving}
                >
                  Save
                </Button>
                <Button
                  color="warning"
                  variant="light"
                  size="lg"
                  className="px-6"
                  onPress={() => setShowChangePasswordModal(true)}
                  isDisabled={isSaving}
                >
                  Change Password
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  size="lg"
                  className="px-8"
                  onPress={handleCancel}
                  isDisabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        size="md"
        classNames={{
          base: "bg-black",
          header: "border-b border-gray-700",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white flex flex-col gap-1">
            <h3 className="text-xl font-bold">Verifikasi Email</h3>
            <p className="text-sm text-gray-400">
              Masukkan kode verifikasi 6 digit yang dikirim ke email Anda
            </p>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-4">
                Kode verifikasi telah dikirim ke:
              </p>
              <p className="text-yellow-400 font-semibold mb-6">
                {user?.email}
              </p>
              
              <VerificationCodeInput
                onComplete={handleVerifyCode}
                disabled={isVerifyingCode}
              />
              
              {isVerifyingCode && (
                <p className="text-gray-400 text-sm mt-4">
                  Memverifikasi kode...
                </p>
              )}
              
              <div className="mt-6 flex gap-2 justify-center">
                <Button
                  onClick={handleSendVerification}
                  disabled={isSendingVerification}
                  color="warning"
                  variant="light"
                  className="text-yellow-400"
                >
                  {isSendingVerification ? 'Mengirim...' : 'Kirim Ulang Kode'}
                </Button>
                <Button
                  onClick={() => setShowVerificationModal(false)}
                  variant="light"
                  className="text-gray-400"
                >
                  Batal
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        size="md"
        classNames={{
          base: "bg-black",
          header: "border-b border-gray-700",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white flex flex-col gap-1">
            <h3 className="text-xl font-bold">Ubah Password</h3>
            <p className="text-sm text-gray-400">
              Masukkan password baru yang kuat dan aman
            </p>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password Baru
                </label>
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full"
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg focus-within:border-yellow-400",
                  }}
                  endContent={
                    <EyeIcon 
                      isVisible={showNewPassword} 
                      onClick={() => setShowNewPassword(!showNewPassword)} 
                    />
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Konfirmasi Password
                </label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full"
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg focus-within:border-yellow-400",
                  }}
                  endContent={
                    <EyeIcon 
                      isVisible={showConfirmPassword} 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    />
                  }
                />
              </div>

              {/* Password Requirements */}
              {passwordData.newPassword.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Persyaratan Password:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={passwordValidation.length ? 'text-green-500' : 'text-red-500'}>
                        {passwordValidation.length ? '✓' : '✗'}
                      </span>
                      <span>Minimal 8 karakter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordValidation.uppercase ? 'text-green-500' : 'text-red-500'}>
                        {passwordValidation.uppercase ? '✓' : '✗'}
                      </span>
                      <span>1 huruf kapital (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordValidation.number ? 'text-green-500' : 'text-red-500'}>
                        {passwordValidation.number ? '✓' : '✗'}
                      </span>
                      <span>1 angka (0-9)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordValidation.symbol ? 'text-green-500' : 'text-red-500'}>
                        {passwordValidation.symbol ? '✓' : '✗'}
                      </span>
                      <span>1 simbol (!@#$%^&*)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordValidation.match ? 'text-green-500' : 'text-red-500'}>
                        {passwordValidation.match ? '✓' : '✗'}
                      </span>
                      <span>Password dan konfirmasi cocok</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2 justify-center">
                <Button
                  onClick={handleChangePassword}
                  disabled={!passwordValidation.isValid || isChangingPassword}
                  color="success"
                  className="px-8"
                  isLoading={isChangingPassword}
                >
                  {isChangingPassword ? 'Mengubah...' : 'Ubah Password'}
                </Button>
                <Button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordData({ newPassword: "", confirmPassword: "" });
                  }}
                  variant="ghost"
                  className="text-gray-400 px-8"
                >
                  Batal
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Crop Modal */}
      <Modal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        size="full"
        classNames={{
          base: "bg-black sm:max-w-lg sm:max-h-[90vh] sm:mx-auto sm:my-auto",
          header: "border-b border-gray-700",
          body: "py-6 px-4 sm:px-6",
          footer: "border-t border-gray-700 px-4 sm:px-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <h3>Convert Image to Square</h3>
          </ModalHeader>
          <ModalBody>
            {selectedImage && (
              <ImageConverter
                imageSrc={selectedImage}
                onConvert={handleCropSave}
                onCancel={() => setShowCropModal(false)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </UserLayout>
  );
}