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
import AdminLayout from "@/components/AdminLayout";
import { User } from "@/types/type";
import { getUserAvatarUrl, generateConsistentAvatarUrl } from "@/lib/avatar";

// Crop Editor Component dengan aspect ratio 1:1
const CropEditor = ({ imageSrc, onCrop, onCancel }: {
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 400, height: 400 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 400, height: 400 });

  // Document-level touch event handlers for better mobile support
  const handleDocumentTouchMove = (e: TouchEvent) => {
    if (!containerRef.current || (!isDragging && !isResizing) || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];

    if (isDragging) {
      const newX = touch.clientX - rect.left - dragStart.x;
      const newY = touch.clientY - rect.top - dragStart.y;

      // Constrain crop area within image boundaries
      const maxX = displayDimensions.width - cropArea.width;
      const maxY = displayDimensions.height - cropArea.height;

      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      }));
    } else if (isResizing) {
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      // Use the maximum delta to maintain square aspect ratio
      const delta = Math.max(deltaX, deltaY);
      
      // Calculate new size (always square)
      const currentSize = cropArea.width; // Since it's square, width = height
      const newSize = Math.max(50, currentSize + delta);
      
      // Maximum size is limited by the smallest image dimension and boundaries
      const maxSize = Math.min(
        displayDimensions.width - cropArea.x,
        displayDimensions.height - cropArea.y,
        displayDimensions.width,
        displayDimensions.height
      );
      
      const finalSize = Math.min(newSize, maxSize);
      
      // Adjust position to keep crop area within bounds
      const maxX = displayDimensions.width - finalSize;
      const maxY = displayDimensions.height - finalSize;
      
      setCropArea(prev => ({
        x: Math.max(0, Math.min(maxX, prev.x)),
        y: Math.max(0, Math.min(maxY, prev.y)),
        width: finalSize,
        height: finalSize, // Keep 1:1 aspect ratio
      }));
      
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleDocumentTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    
    // Remove global touch listeners
    document.removeEventListener('touchmove', handleDocumentTouchMove);
    document.removeEventListener('touchend', handleDocumentTouchEnd);
  };

  // Cleanup effect for document event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, []);

  const handleImageLoad = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate display dimensions while maintaining aspect ratio
    // Make it responsive to screen size
    const isSmallScreen = window.innerWidth < 640; // sm breakpoint
    const maxContainerSize = isSmallScreen ? Math.min(300, window.innerWidth - 40) : 500;
    const aspectRatio = naturalWidth / naturalHeight;
    
    let displayWidth, displayHeight;
    
    if (aspectRatio > 1) {
      // Landscape image
      displayWidth = Math.min(maxContainerSize, naturalWidth);
      displayHeight = displayWidth / aspectRatio;
    } else {
      // Portrait or square image
      displayHeight = Math.min(maxContainerSize, naturalHeight);
      displayWidth = displayHeight * aspectRatio;
    }
    
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    setDisplayDimensions({ width: displayWidth, height: displayHeight });
    
    // Set initial crop area (square in the center with maximum possible size)
    const minDimension = Math.min(displayWidth, displayHeight);
    const maxCropSize = minDimension * 0.8; // 80% of the smaller dimension
    
    setCropArea({
      x: (displayWidth - maxCropSize) / 2,
      y: (displayHeight - maxCropSize) / 2,
      width: maxCropSize,
      height: maxCropSize, // Always square (1:1 aspect ratio)
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
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - cropArea.x,
        y: e.clientY - rect.top - cropArea.y,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, action: 'drag' | 'resize' = 'drag') => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();

    if (action === 'resize') {
      setIsResizing(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else {
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - rect.left - cropArea.x,
        y: touch.clientY - rect.top - cropArea.y,
      });
    }

    // Add global touch listeners to handle movement outside the container
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd, { passive: false });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || (!isDragging && !isResizing)) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    if (isDragging) {
      const newX = e.clientX - rect.left - dragStart.x;
      const newY = e.clientY - rect.top - dragStart.y;

      // Constrain crop area within image boundaries
      const maxX = displayDimensions.width - cropArea.width;
      const maxY = displayDimensions.height - cropArea.height;

      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      }));
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Use the maximum delta to maintain square aspect ratio
      const delta = Math.max(deltaX, deltaY);
      
      // Calculate new size (always square)
      const currentSize = cropArea.width; // Since it's square, width = height
      const newSize = Math.max(50, currentSize + delta);
      
      // Maximum size is limited by the smallest image dimension and boundaries
      const maxSize = Math.min(
        displayDimensions.width - cropArea.x,
        displayDimensions.height - cropArea.y,
        displayDimensions.width,
        displayDimensions.height
      );
      
      const finalSize = Math.min(newSize, maxSize);
      
      // Adjust position to keep crop area within bounds
      const maxX = displayDimensions.width - finalSize;
      const maxY = displayDimensions.height - finalSize;
      
      setCropArea(prev => ({
        x: Math.max(0, Math.min(maxX, prev.x)),
        y: Math.max(0, Math.min(maxY, prev.y)),
        width: finalSize,
        height: finalSize, // Keep 1:1 aspect ratio
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    
    // Remove global touch listeners
    document.removeEventListener('touchmove', handleDocumentTouchMove);
    document.removeEventListener('touchend', handleDocumentTouchEnd);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to square (1:1 aspect ratio)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate scaling factors from display to natural image size
    const scaleX = imageDimensions.width / displayDimensions.width;
    const scaleY = imageDimensions.height / displayDimensions.height;

    // Calculate source crop area in natural image coordinates
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Clear canvas and draw cropped image
    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0, 0, outputSize, outputSize
    );

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="text-center mb-4 px-4">
        <p className="text-sm text-gray-400 mb-2">
          <span className="hidden sm:inline">Drag to move, use corner handles to resize</span>
          <span className="sm:hidden">Touch and drag to move, use corner handles to resize</span>
        </p>
        <p className="text-xs text-gray-500">Crop area will maintain 1:1 aspect ratio</p>
      </div>
      
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-900 mx-2 select-none"
        style={{ 
          width: `${displayDimensions.width}px`, 
          height: `${displayDimensions.height}px`,
          maxWidth: '90vw',
          maxHeight: '60vh',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="block"
          onLoad={handleImageLoad}
          style={{ 
            width: `${displayDimensions.width}px`, 
            height: `${displayDimensions.height}px`,
            objectFit: 'contain'
          }}
          draggable={false}
        />
        {imageLoaded && (
          <>
            {/* Overlay to darken non-crop areas */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top overlay */}
              <div 
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${cropArea.y}px`
                }}
              />
              {/* Bottom overlay */}
              <div 
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `${cropArea.y + cropArea.height}px`,
                  left: 0,
                  width: '100%',
                  height: `${displayDimensions.height - cropArea.y - cropArea.height}px`
                }}
              />
              {/* Left overlay */}
              <div 
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `${cropArea.y}px`,
                  left: 0,
                  width: `${cropArea.x}px`,
                  height: `${cropArea.height}px`
                }}
              />
              {/* Right overlay */}
              <div 
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `${cropArea.y}px`,
                  left: `${cropArea.x + cropArea.width}px`,
                  width: `${displayDimensions.width - cropArea.x - cropArea.width}px`,
                  height: `${cropArea.height}px`
                }}
              />
            </div>

            {/* Crop area */}
            <div
              className="absolute border-2 border-yellow-400 cursor-move bg-transparent touch-manipulation select-none"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'drag')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart(e, 'drag');
              }}
            >
              {/* Grid lines for better visualization */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white border-opacity-20" />
                ))}
              </div>
              
              {/* Corner resize handles */}
              <div 
                className="absolute bg-yellow-400 rounded-full cursor-nw-resize border-2 border-white touch-manipulation select-none" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  top: '-12px', 
                  left: '-12px',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize')} 
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTouchStart(e, 'resize');
                }}
              />
              <div 
                className="absolute bg-yellow-400 rounded-full cursor-ne-resize border-2 border-white touch-manipulation select-none" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  top: '-12px', 
                  right: '-12px',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize')} 
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTouchStart(e, 'resize');
                }}
              />
              <div 
                className="absolute bg-yellow-400 rounded-full cursor-sw-resize border-2 border-white touch-manipulation select-none" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  bottom: '-12px', 
                  left: '-12px',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize')} 
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTouchStart(e, 'resize');
                }}
              />
              <div 
                className="absolute bg-yellow-400 rounded-full cursor-se-resize border-2 border-white touch-manipulation select-none" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  bottom: '-12px', 
                  right: '-12px',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize')} 
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTouchStart(e, 'resize');
                }}
              />
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex flex-col sm:flex-row gap-3 mt-6 px-4 w-full sm:w-auto">
        <Button 
          color="success" 
          onPress={handleCrop} 
          isDisabled={!imageLoaded}
          className="px-8 w-full sm:w-auto"
        >
          Crop & Save
        </Button>
        <Button 
          color="danger" 
          variant="light" 
          onPress={onCancel}
          className="px-8 w-full sm:w-auto"
        >
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
          
          if (result.success && result.data) {
            // Update form data with fresh data
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

    const formData = new FormData();
    const fileName = `${user.role.toLowerCase()}-${user.nim}.jpg`;
    formData.append('avatar', croppedBlob, fileName);
    formData.append('nim', user.nim);
    formData.append('role', user.role);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

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
    <AdminLayout 
      title="Profile Management" 
      description="Manage your admin profile settings"
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
        size="full"
        classNames={{
          base: "bg-black sm:max-w-lg sm:max-h-[90vh] sm:mx-auto sm:my-auto",
          header: "border-b border-gray-700",
          body: "py-6 px-4 sm:px-6",
          footer: "border-t border-gray-700 px-4 sm:px-6"
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
    </AdminLayout>
  );
}
