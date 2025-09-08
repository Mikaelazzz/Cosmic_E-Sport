"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import Lottie from "lottie-react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/type";
import { getUserAvatarUrl, generateConsistentAvatarUrl } from "@/lib/avatar";

// Simple crop editor component
const CropEditor = ({ imageSrc, onCrop, onCancel }: {
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageLoad = () => {
    const img = imageRef.current;
    if (!img) return;
    
    const containerWidth = 400;
    const containerHeight = 400;
    const minSize = Math.min(containerWidth, containerHeight) * 0.5;
    
    setCropArea({
      x: (containerWidth - minSize) / 2,
      y: (containerHeight - minSize) / 2,
      size: minSize
    });
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize' = 'drag') => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    if (action === 'resize') {
      setIsResizing(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - cropArea.x,
        y: e.clientY - rect.top - cropArea.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    if (isDragging) {
      const newX = e.clientX - rect.left - dragStart.x;
      const newY = e.clientY - rect.top - dragStart.y;
      
      // Keep crop area within bounds
      const maxX = 400 - cropArea.size;
      const maxY = 400 - cropArea.size;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      }));
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const delta = Math.max(deltaX, deltaY); // Use the larger delta to maintain 1:1 aspect ratio
      
      const newSize = Math.max(50, Math.min(300, cropArea.size + delta));
      
      // Adjust position to keep crop area centered during resize
      const sizeDiff = newSize - cropArea.size;
      const newX = Math.max(0, Math.min(400 - newSize, cropArea.x - sizeDiff / 2));
      const newY = Math.max(0, Math.min(400 - newSize, cropArea.y - sizeDiff / 2));
      
      setCropArea({
        x: newX,
        y: newY,
        size: newSize
      });
      
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for final output
    canvas.width = 400;
    canvas.height = 400;

    // Calculate scale factors
    const scaleX = img.naturalWidth / 400;
    const scaleY = img.naturalHeight / 400;

    // Draw the cropped portion
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.size * scaleX,
      cropArea.size * scaleY,
      0,
      0,
      400,
      400
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="relative inline-block rounded-lg overflow-hidden border-2 border-gray-600"
        style={{ width: '400px', height: '400px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          style={{ width: '400px', height: '400px' }}
        />
        {imageLoaded && (
          <div
            className="absolute border-2 border-yellow-400 cursor-move"
            style={{
              left: `${cropArea.x}px`,
              top: `${cropArea.y}px`,
              width: `${cropArea.size}px`,
              height: `${cropArea.size}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
          >
            <div className="w-full h-full border border-white border-opacity-50" />
            
            {/* Corner handles for resizing */}
            <div 
              className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-nw-resize" 
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-ne-resize" 
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
            <div 
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-sw-resize" 
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-se-resize" 
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2">
        <Button 
          color="success" 
          onPress={handleCrop}
          isDisabled={!imageLoaded}
        >
          Crop & Save
        </Button>
        <Button color="danger" variant="light" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default function AdminProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render of avatar
  const [isHovering, setIsHovering] = useState(false);
  const [editAnimation, setEditAnimation] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lottieRef = useRef<any>(null);
  
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

  // Fetch fresh user data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Fetched user profile:', result); // Debug log
          if (result.success && result.data) {
            // Update form data with fresh data
            setFormData({
              nim: result.data.nim || "",
              nama_lengkap: result.data.nama_lengkap || "",
              jabatan: result.data.jabatan || "",
            });
            console.log('Updated form data:', { // Debug log
              nim: result.data.nim,
              nama_lengkap: result.data.nama_lengkap,
              jabatan: result.data.jabatan
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (isAuthenticated && user) {
      console.log('Current user from context:', user); // Debug log
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id]); // Depend on user.id to avoid infinite loop

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

    console.log('Starting avatar upload...', { userRole: user.role, userNim: user.nim });

    const formData = new FormData();
    const fileName = `${user.role.toLowerCase()}-${user.nim}.jpg`;
    formData.append('avatar', croppedBlob, fileName);
    formData.append('nim', user.nim);
    formData.append('role', user.role);

    console.log('Form data prepared:', { fileName, blobSize: croppedBlob.size, nim: user.nim, role: user.role });

    try {
      console.log('Sending request to /api/user/avatar...');
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        setMessage("Avatar updated successfully!");
        setMessageType("success");
        setShowCropModal(false);
        setSelectedImage("");
        
        // Force re-render of avatar by updating key
        setAvatarKey(prev => prev + 1);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Remove the forced reload - let the component handle the update
        console.log('Avatar upload completed successfully');
      } else {
        console.error('Upload failed:', result.message);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nim: user.nim,
          role: user.role
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Avatar removed successfully!");
        setMessageType("success");
        
        // Force re-render of avatar by updating key
        setAvatarKey(prev => prev + 1);
        
        // Refresh user data to update navbar and other components
        await refreshUser();
        
        console.log('Avatar removal completed successfully');
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
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

  if (user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Unauthorized">
          You don't have permission to access this page.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

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
          <div className="flex gap-8">
            {/* Left side - Form fields */}
            <div className="flex-1 space-y-6">
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
                    inputWrapper: `bg-transparent border-2 ${isEditing ? 'border-yellow-400' : 'border-gray-600'} rounded-lg`
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">NIM</label>
                <Input
                  value={formData.nim}
                  onValueChange={(value) => handleInputChange('nim', value)}
                  size="lg"
                  isReadOnly={!isEditing}
                  variant={isEditing ? "bordered" : "flat"}
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: `bg-transparent border-2 ${isEditing ? 'border-yellow-400' : 'border-gray-600'} rounded-lg`
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Email</label>
                <Input
                  value={user.email}
                  size="lg"
                  type="email"
                  isReadOnly={true}
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg"
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Bergabung pada</label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                  size="lg"
                  isReadOnly={true}
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg"
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Role</label>
                <Input
                  value="Administrator"
                  size="lg"
                  isReadOnly={true}
                  variant="flat"
                  className="bg-transparent"
                  classNames={{
                    input: "bg-transparent text-white placeholder-gray-400",
                    inputWrapper: "bg-transparent border-2 border-gray-600 rounded-lg"
                  }}
                />
              </div>
            </div>

            {/* Right side - Profile picture */}
            <div className="flex flex-col items-center justify-start space-y-4">
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
                accept="image/*"
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
          </div>

          {/* Edit/Save/Cancel buttons at the bottom */}
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

      {/* Crop Modal */}
      <Modal 
        isOpen={showCropModal} 
        onClose={() => setShowCropModal(false)}
        size="lg"
        classNames={{
          base: "bg-black",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <h3>Crop Your Avatar</h3>
          </ModalHeader>
          <ModalBody>
            {selectedImage && (
              <CropEditor
                imageSrc={selectedImage}
                onCrop={handleCropSave}
                onCancel={() => setShowCropModal(false)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
