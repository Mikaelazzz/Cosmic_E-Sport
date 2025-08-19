import { useState, useRef, useCallback } from 'react';
import { Button, Card, CardBody, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Slider } from '@heroui/react';
import { IconPlus, IconTrash, IconEdit } from './icons';

// Custom Crop Icon
const IconCrop = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6h8v8" />
    <path d="M18 18H10V10" />
    <path d="M6 2v4" />
    <path d="M2 6h4" />
    <path d="M18 22v-4" />
    <path d="M22 18h-4" />
  </svg>
);

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  informasiId?: string;
  disabled?: boolean;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  informasiId,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 }); // Percentage position
  const [needsCropping, setNeedsCropping] = useState(false);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0); // Force re-render key
  const [previewIsCropped, setPreviewIsCropped] = useState(false); // Track if preview is cropped
  
  // Convert database path to API route for preview
  const getPreviewUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('/src/informasi/')) {
      const filename = path.replace('/src/informasi/', '');
      return `/api/static/informasi/${filename}`;
    }
    return path;
  };
  
  const [preview, setPreview] = useState<string | null>(getPreviewUrl(value || null));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to generate crop preview
  const generateCropPreview = async (file: File, cropPos: { x: number, y: number }): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new window.Image();

      img.onload = () => {
        const targetRatio = 16 / 9;
        const sourceRatio = img.width / img.height;

        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

        // Calculate crop dimensions to achieve 16:9 ratio
        if (sourceRatio > targetRatio) {
          // Image is wider than target ratio, crop width
          sourceWidth = img.height * targetRatio;
          // Use crop position (0-100%) to determine X offset
          const maxOffsetX = img.width - sourceWidth;
          sourceX = (maxOffsetX * cropPos.x) / 100;
        } else if (sourceRatio < targetRatio) {
          // Image is taller than target ratio, crop height
          sourceHeight = img.width / targetRatio;
          // Use crop position (0-100%) to determine Y offset
          const maxOffsetY = img.height - sourceHeight;
          sourceY = (maxOffsetY * cropPos.y) / 100;
        }

        // Set canvas dimensions (preview size)
        const previewWidth = 400;
        const previewHeight = previewWidth / targetRatio;

        canvas.width = previewWidth;
        canvas.height = previewHeight;

        // Draw the cropped image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, previewWidth, previewHeight
        );

        // Convert canvas to data URL
        resolve(canvas.toDataURL(file.type, 0.9));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Function to resize and crop image to 16:9 aspect ratio with custom position
  const resizeImageTo16x9 = (file: File, cropPos = { x: 50, y: 50 }): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new window.Image();

      img.onload = () => {
        const targetRatio = 16 / 9;
        const sourceRatio = img.width / img.height;

        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

        // Calculate crop dimensions to achieve 16:9 ratio
        if (sourceRatio > targetRatio) {
          // Image is wider than target ratio, crop width
          sourceWidth = img.height * targetRatio;
          // Use crop position (0-100%) to determine X offset
          const maxOffsetX = img.width - sourceWidth;
          sourceX = (maxOffsetX * cropPos.x) / 100;
        } else if (sourceRatio < targetRatio) {
          // Image is taller than target ratio, crop height
          sourceHeight = img.width / targetRatio;
          // Use crop position (0-100%) to determine Y offset
          const maxOffsetY = img.height - sourceHeight;
          sourceY = (maxOffsetY * cropPos.y) / 100;
        }

        // Set canvas dimensions (max 1200px width)
        const maxWidth = 1200;
        const canvasWidth = Math.min(maxWidth, sourceWidth);
        const canvasHeight = canvasWidth / targetRatio;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvasWidth, canvasHeight
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const extension = file.name.split('.').pop() || 'jpg';
            // Add timestamp to filename to ensure uniqueness
            const timestamp = Date.now();
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${baseName}_${timestamp}.${extension}`;
            
            const newFile = new File([blob], newFileName, { 
              type: file.type,
              lastModified: timestamp
            });
            resolve(newFile);
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    // Check if image needs cropping
    const img = new window.Image();
    img.onload = async () => {
      const targetRatio = 16 / 9;
      const sourceRatio = img.width / img.height;
      const tolerance = 0.05; // 5% tolerance

      setOriginalFile(file);
      setPreviewIsCropped(false); // Reset crop state for new file
      
      if (Math.abs(sourceRatio - targetRatio) > tolerance) {
        // Image needs cropping - show adjustment modal
        setNeedsCropping(true);
        const initialPosition = { x: 50, y: 50 };
        setCropPosition(initialPosition);
        
        // Generate initial crop preview
        const initialPreview = await generateCropPreview(file, initialPosition);
        setCropPreview(initialPreview);
        
        setShowCropModal(true);
      } else {
        // Image is already close to 16:9, process directly
        await processImageUpload(file, { x: 50, y: 50 });
      }
    };
    
    img.src = URL.createObjectURL(file);
  }, [informasiId, onChange, value]);

  const processImageUpload = async (file: File, cropPos = { x: 50, y: 50 }) => {
    // Clear any existing preview URL to prevent caching issues
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    // Resize image to 16:9 aspect ratio
    const resizedFile = await resizeImageTo16x9(file, cropPos);

    // Create preview URL from the processed file with timestamp to force refresh
    const objectUrl = URL.createObjectURL(resizedFile);
    setPreview(objectUrl);
    setImageKey(prev => prev + 1); // Force image re-render
    setPreviewIsCropped(true); // Mark that this preview is cropped
    
    // Clear crop preview since we now have the final image
    setCropPreview(null);

    // Only upload if we have informasiId
    if (informasiId) {
      setUploading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', resizedFile);
        formData.append('informasiId', informasiId);

        const response = await fetch('/api/upload/informasi', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          const filename = result.data.filename;
          const staticUrl = `/api/static/informasi/${filename}`;
          onChange(result.data.path);
          // Keep using the blob URL for preview to show the cropped result immediately
          // setPreview(staticUrl); // Don't override the cropped preview
        } else {
          alert(result.message || 'Gagal mengupload gambar');
          setPreview(value || null);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal mengupload gambar');
        setPreview(value || null);
      } finally {
        setUploading(false);
      }
    } else {
      // If no informasiId, just set the preview and pass the file URL
      onChange(objectUrl);
    }
  };

  const handleCropAdjustment = async () => {
    if (!originalFile) return;
    
    setShowCropModal(false);
    
    // Reset crop-related states
    setCropPreview(null);
    setNeedsCropping(false);
    
    // Process the image with the current crop position
    await processImageUpload(originalFile, cropPosition);
  };

  // Function to handle crop position change and update preview
  const handleCropPositionChange = async (newPosition: { x?: number, y?: number }) => {
    const updatedPosition = { ...cropPosition, ...newPosition };
    setCropPosition(updatedPosition);
    
    if (originalFile) {
      // Generate new crop preview
      const newPreview = await generateCropPreview(originalFile, updatedPosition);
      setCropPreview(newPreview);
    }
  };

  const handleRemove = useCallback(() => {
    // Clean up blob URLs
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    if (cropPreview && cropPreview.startsWith('blob:')) {
      URL.revokeObjectURL(cropPreview);
    }
    
    setPreview(null);
    onChange(null);
    setOriginalFile(null);
    setCropPreview(null);
    setNeedsCropping(false);
    setPreviewIsCropped(false);
    setImageKey(prev => prev + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, preview, cropPreview]);

  const handleModalClose = () => {
    setShowCropModal(false);
    setCropPreview(null);
    // Don't process image again if user cancels - keep current preview
    // if (originalFile) {
    //   processImageUpload(originalFile, { x: 50, y: 50 });
    // }
  };

  const handleReopenCrop = async () => {
    if (!originalFile) return;
    
    // Reset crop position and generate initial preview
    const initialPosition = { x: 50, y: 50 };
    setCropPosition(initialPosition);
    
    // Generate initial crop preview
    const initialPreview = await generateCropPreview(originalFile, initialPosition);
    setCropPreview(initialPreview);
    
    setNeedsCropping(true);
    setShowCropModal(true);
  };

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {preview ? (
        <Card className="relative">
          <CardBody className="p-0">
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <Image
                key={imageKey}
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                {!disabled && (
                  <>
                    <Button
                      isIconOnly
                      color="primary"
                      variant="solid"
                      size="sm"
                      onClick={handleClick}
                      disabled={uploading}
                      title="Ganti Gambar"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    {originalFile && (
                      <Button
                        isIconOnly
                        color="secondary"
                        variant="solid"
                        size="sm"
                        onClick={handleReopenCrop}
                        disabled={uploading}
                        title="Sesuaikan Posisi"
                      >
                        <IconCrop className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      isIconOnly
                      color="danger"
                      variant="solid"
                      size="sm"
                      onClick={handleRemove}
                      disabled={uploading}
                      title="Hapus Gambar"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card 
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
          isPressable
          onPress={disabled ? undefined : handleClick}
        >
          <CardBody className="flex flex-col items-center justify-center p-8 min-h-[200px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <IconPlus className="h-8 w-8 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  Upload Gambar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Klik untuk memilih gambar
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Format: JPG, PNG, WebP | Maksimal: 5MB<br />
                  Gambar akan otomatis disesuaikan ke rasio 16:9
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {uploading && (
        <div className="text-center">
          <p className="text-sm text-gray-600">Mengupload gambar...</p>
        </div>
      )}

      {/* Crop Adjustment Modal */}
      <Modal isOpen={showCropModal} onClose={handleModalClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Sesuaikan Posisi Gambar</h3>
          </ModalHeader>
          <ModalBody>
            {originalFile && (
              <div className="space-y-6">
                <div className="text-sm text-gray-600">
                  Sesuaikan posisi crop untuk mendapatkan bagian gambar yang diinginkan dalam rasio 16:9
                </div>
                
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={cropPreview || URL.createObjectURL(originalFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-primary border-dashed"></div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Posisi Horizontal: {cropPosition.x}%
                    </label>
                    <Slider
                      value={cropPosition.x}
                      onChange={(value) => handleCropPositionChange({ x: value as number })}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Posisi Vertikal: {cropPosition.y}%
                    </label>
                    <Slider
                      value={cropPosition.y}
                      onChange={(value) => handleCropPositionChange({ y: value as number })}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleModalClose}
            >
              Batal
            </Button>
            <Button
              color="primary"
              onPress={handleCropAdjustment}
            >
              Terapkan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
