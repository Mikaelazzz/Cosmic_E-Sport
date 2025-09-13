import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Card, CardBody, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Slider } from '@heroui/react';
import { IconPlus, IconTrash, IconEdit } from './icons';
import { getEventImageUrl } from '@/lib/event-image';

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

interface EventImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  eventId?: number | string;
  disabled?: boolean;
}

export default function EventImageUpload({
  value,
  onChange,
  eventId,
  disabled = false
}: EventImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 }); // Percentage position
  const [needsCropping, setNeedsCropping] = useState(false);
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0); // Force re-render key
  const [previewIsCropped, setPreviewIsCropped] = useState(false); // Track if preview is cropped
  const [dragActive, setDragActive] = useState(false);
  
  // Convert database path to Supabase Storage URL for preview
  const getPreviewUrl = (path: string | null) => {
    return getEventImageUrl(path);
  };
  
  const [preview, setPreview] = useState<string | null>(getPreviewUrl(value || null));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value prop changes
  useEffect(() => {
    const newPreviewUrl = getPreviewUrl(value || null);
    // Only update if the URLs are different and it's not a blob URL (which means it's from server)
    if (newPreviewUrl && newPreviewUrl !== preview && !newPreviewUrl.startsWith('blob:')) {
      // Add cache busting to ensure fresh image load
      const urlWithCacheBuster = newPreviewUrl + `?t=${Date.now()}`;
      setPreview(urlWithCacheBuster);
      setImageKey(prev => prev + 1); // Force re-render
    } else if (!newPreviewUrl && preview) {
      // Clear preview if value is null
      setPreview(null);
      setImageKey(prev => prev + 1);
    }
  }, [value]);

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
  }, [eventId, onChange, value]);

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

    // Only upload if we have eventId
    if (eventId) {
      setUploading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', resizedFile);
        formData.append('eventId', eventId.toString());

        const response = await fetch('/api/events/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          const imagePath = result.data.filePath;
          
          // Update the onChange with the new path
          onChange(imagePath);
          
          // Wait a moment to ensure the file is saved before updating preview
          setTimeout(() => {
            // Update preview to show the uploaded image with cache busting
            const newPreviewUrl = getPreviewUrl(imagePath) + `?t=${Date.now()}`;
            
            // Clean up the blob URL
            URL.revokeObjectURL(objectUrl);
            
            // Set the new preview URL with cache busting
            setPreview(newPreviewUrl);
            setImageKey(prev => prev + 1); // Force image re-render
          }, 100);
          
        } else {
          alert(result.message || 'Gagal mengupload gambar');
          setPreview(getPreviewUrl(value || null));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal mengupload gambar');
        setPreview(getPreviewUrl(value || null));
      } finally {
        setUploading(false);
      }
    } else {
      // If no eventId, just set the preview and pass the file URL
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Create a fake event to reuse the existing file select logic
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileSelect(fakeEvent);
    }
  };

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
        <Card className="bg-gray-800 border border-gray-700 overflow-hidden">
          <CardBody className="p-3">
            <div className="relative">
              {/* Gambar preview di tengah dengan rasio 16:9 dan ukuran lebih kecil */}
              <div
                className="w-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ aspectRatio: '16/9', maxHeight: '180px' }}
              >
                <Image
                  key={imageKey}
                  src={preview}
                  alt="Event preview"
                  className="w-full h-full object-cover"
                  width={640}
                  height={360}
                  loading="lazy"
                />
              </div>

              {/* Tombol di bawah gambar */}
              <div className="flex gap-2 mt-3 justify-center">
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  startContent={<IconEdit className="w-4 h-4" />}
                  onPress={handleClick}
                  isDisabled={disabled || uploading}
                >
                  Change
                </Button>
                {originalFile && (
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    startContent={<IconCrop className="w-4 h-4" />}
                    onPress={handleReopenCrop}
                    isDisabled={disabled || uploading}
                  >
                    Crop
                  </Button>
                )}
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  startContent={<IconTrash className="w-4 h-4" />}
                  onPress={handleRemove}
                  isDisabled={disabled || uploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card
          className={`bg-gray-800 border-2 border-dashed transition-colors cursor-pointer ${
            dragActive
              ? 'border-[#FFD700] bg-[#FFD700]/10'
              : 'border-gray-600 hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          isPressable={!disabled && !uploading}
          onPress={handleClick}
        >
          <CardBody className="p-4">
            <div
              className="w-full bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center"
              style={{ aspectRatio: '16/9', maxHeight: '180px', minHeight: '120px' }}
            >
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 text-xs">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <IconPlus className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-white text-sm font-medium">Klik untuk pilih gambar</p>
                  <p className="text-gray-400 text-xs">atau drag & drop</p>
                  <p className="text-gray-500 text-xs">JPG, PNG, WebP | ≤5MB</p>
                  <p className="text-gray-500 text-xs">Akan otomatis disesuaikan ke rasio 16:9</p>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Crop Adjustment Modal */}
      <Modal isOpen={showCropModal} onClose={handleModalClose} size="lg">
        <ModalContent className="bg-gray-800 border border-gray-700">
          <ModalHeader className="text-[#FFD700]">
            <h3 className="text-lg font-semibold">Sesuaikan Posisi Gambar Event</h3>
          </ModalHeader>
          <ModalBody>
            {originalFile && (
              <div className="space-y-6">
                <div className="text-sm text-gray-300">
                  Sesuaikan posisi crop untuk mendapatkan bagian gambar yang diinginkan dalam rasio 16:9
                </div>
                
                <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={cropPreview || URL.createObjectURL(originalFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-[#FFD700] border-dashed"></div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Posisi Horizontal: {cropPosition.x}%
                    </label>
                    <Slider
                      value={cropPosition.x}
                      onChange={(value) => handleCropPositionChange({ x: value as number })}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      className="w-full"
                      classNames={{
                        track: "bg-gray-700",
                        filler: "bg-[#FFD700]",
                        thumb: "bg-[#FFD700]"
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Posisi Vertikal: {cropPosition.y}%
                    </label>
                    <Slider
                      value={cropPosition.y}
                      onChange={(value) => handleCropPositionChange({ y: value as number })}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      className="w-full"
                      classNames={{
                        track: "bg-gray-700",
                        filler: "bg-[#FFD700]",
                        thumb: "bg-[#FFD700]"
                      }}
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
              className="text-gray-300"
            >
              Batal
            </Button>
            <Button
              color="primary"
              onPress={handleCropAdjustment}
              className="bg-[#FFD700] text-black"
            >
              Terapkan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}