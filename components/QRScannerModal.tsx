"use client";
 
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Alert } from "@heroui/react";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import jsQR from 'jsqr';
 
interface QRScannerModalProps {
  pertemuanId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}
 
const QRScannerModal: React.FC<QRScannerModalProps> = ({
  pertemuanId,
  isOpen,
  onClose,
  onSuccess
}) => {
  // State variables
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
 
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanAnimationRef = useRef<number | null>(null);
 
  // Cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up QR Scanner...');
    
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
      console.log('🧹 Cancelled scan animation');
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🧹 Stopped camera track:', track.kind);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log('🧹 Cleared video source');
    }
    
    setError(null);
    setIsLoading(true);
    setHasPermission(false);
    setNeedsPermission(false);
    setIsScanning(false);
    setIsSubmitting(false);
    setLastScanTime(0);
    setScanSuccess(false);
    setShowSuccessOverlay(false);
    setScanResult(null);
    setAttendanceStatus(null);
    console.log('🧹 Reset all states');
  };
 
  // Format time for Indonesia timezone (WIB)
  const formatIndonesiaTime = (timeString: string) => {
    if (!timeString) return 'Sekarang';
    
    try {
      const date = new Date(timeString);
      return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' WIB';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Waktu tidak valid';
    }
  };
 
  // Check browser compatibility and camera support
  const checkBrowserSupport = () => {
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser tidak mendukung akses kamera. Pastikan menggunakan HTTPS dan browser modern.');
      setIsLoading(false);
      setNeedsPermission(false);
      return false;
    }
    return true;
  };

  // Detect if device is mobile or tablet
  const isMobileOrTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobile || isTablet || (isTouchDevice && window.innerWidth <= 1024);
  };
 
  // Check camera permission status
  const checkPermissionStatus = async () => {
    console.log('🔍 Checking camera permission status...');
    
    try {
      if (!checkBrowserSupport()) return;
 
      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('📋 Camera permission status:', permission.state);
          
          if (permission.state === 'granted') {
            console.log('✅ Permission already granted, starting camera...');
            await startCamera();
          } else if (permission.state === 'prompt') {
            console.log('❓ Permission needs prompt');
            setNeedsPermission(true);
            setIsLoading(false);
          } else {
            console.log('❌ Permission denied');
            setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
            setIsLoading(false);
            setNeedsPermission(false);
          }
        } catch (permErr) {
          console.warn('⚠️ Permission query failed, trying direct approach:', permErr);
          // Try direct camera access
          try {
            await startCamera();
          } catch (directErr) {
            console.log('❓ Direct access failed, showing permission request');
            setNeedsPermission(true);
            setIsLoading(false);
          }
        }
      } else {
        console.log('⚠️ No permission API, trying direct camera access...');
        // Try direct camera access for older browsers
        try {
          await startCamera();
        } catch (directErr) {
          console.log('❓ Direct access failed, showing permission request');
          setNeedsPermission(true);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('❌ Error checking permission:', err);
      setError('Gagal memeriksa izin kamera');
      setIsLoading(false);
      setNeedsPermission(false);
    }
  };
 
  // Start camera
  const startCamera = async () => {
    console.log('📹 Starting camera...');
    
    try {
      setIsLoading(true);
      setError(null);
      setScanSuccess(false);
      setShowSuccessOverlay(false);
 
      if (!checkBrowserSupport()) return;

      // Detect device type and configure camera accordingly
      const isDevice = isMobileOrTablet();
      
      // Configure video constraints based on device type
      const videoConstraints: any = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 }
      };

      // For mobile/tablet devices, prefer back camera (environment)
      if (isDevice) {
        videoConstraints.facingMode = { ideal: 'environment' };
        console.log('Mobile/Tablet detected - requesting back camera (environment)');
      } else {
        console.log('Desktop detected - using default camera');
      }

      // Request camera access with appropriate configuration
      console.log('Requesting camera with constraints:', videoConstraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      console.log('✅ Camera stream acquired');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('✅ Video started successfully');
              console.log('📐 Video dimensions:', {
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight
              });
              setHasPermission(true);
              setIsLoading(false);
              
              // Small delay to ensure video is fully ready
              setTimeout(() => {
                console.log('🔍 Starting QR scanning...');
                setIsScanning(true);
                startScanning();
              }, 500);
              
              // Fallback: ensure scanning is running after 2 seconds
              setTimeout(() => {
                if (!isSubmitting && !scanSuccess && !showSuccessOverlay) {
                  console.log('🔄 Fallback: Ensuring QR scanning is active...');
                  setIsScanning(true);
                  startScanning();
                }
              }, 2000);
            }).catch(err => {
              console.error('❌ Error playing video:', err);
              setError('Gagal memulai video kamera');
              setIsLoading(false);
            });
          }
        };
      }
 
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      handleCameraError(err);
    }
  };
 
  // Handle camera errors
  const handleCameraError = (err: any) => {
    let errorMessage = 'Gagal mengakses kamera.';
    
    if (err.message && err.message.includes('tidak mendukung')) {
      errorMessage = 'Browser tidak mendukung akses kamera. Pastikan menggunakan HTTPS dan browser modern.';
    } else {
      switch (err.name) {
        case 'NotAllowedError':
          errorMessage = 'Akses kamera ditolak. Klik ikon kamera di address bar dan pilih "Izinkan".';
          break;
        case 'NotFoundError':
          errorMessage = 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.';
          break;
        case 'NotReadableError':
          errorMessage = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Pengaturan kamera tidak didukung. Coba gunakan kamera lain.';
          break;
        case 'SecurityError':
          errorMessage = 'Akses kamera diblokir karena keamanan. Pastikan menggunakan HTTPS.';
          break;
        case 'AbortError':
          errorMessage = 'Permintaan akses kamera dibatalkan.';
          break;
        default:
          errorMessage = err.message || 'Kesalahan tidak diketahui saat mengakses kamera.';
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setHasPermission(false);
    setIsScanning(false);
  };
 
  // Request permission and start camera
  const requestPermissionAndStart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsPermission(false);
      
      if (!checkBrowserSupport()) return;
      
      await startCamera();
    } catch (err: any) {
      console.error('Error requesting permission:', err);
      setError(err.message || 'Gagal memulai kamera');
      setIsLoading(false);
      setNeedsPermission(false);
    }
  };
 
  // Start QR code scanning
  const startScanning = () => {
    console.log('🔍 Starting QR scanning...');
    console.log('📊 Current states:', {
      hasVideoRef: !!videoRef.current,
      hasCanvasRef: !!canvasRef.current,
      isScanning,
      isSubmitting,
      scanSuccess,
      showSuccessOverlay
    });
    
    // Jangan mulai scanning jika overlay success aktif
    if (showSuccessOverlay) {
      console.log('❌ Success overlay is active, not starting scanner');
      return;
    }
    
    // Set scanning to true at the start
    setIsScanning(true);
    console.log('✅ Set isScanning to true');
    
    let scanCount = 0;
    
    const scan = () => {
      scanCount++;
      
      // Check basic requirements first
      if (!videoRef.current || !canvasRef.current) {
        console.log('❌ Missing video or canvas reference:', {
          hasVideo: !!videoRef.current,
          hasCanvas: !!canvasRef.current,
          scanCount
        });
        // Retry after short delay
        setTimeout(() => {
          if (!isSubmitting && !scanSuccess && !showSuccessOverlay) {
            scan();
          }
        }, 100);
        return;
      }
      
      // Check if we should continue scanning
      if (isSubmitting || scanSuccess || showSuccessOverlay) {
        console.log('❌ Should stop scanning:', {
          isSubmitting,
          scanSuccess,
          showSuccessOverlay,
          scanCount
        });
        return;
      }
 
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
 
      if (!context) {
        console.log('❌ No canvas context');
        return;
      }
 
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (scanCount % 30 === 0) { // Log every 30 frames
          console.log('⏳ Waiting for video data, readyState:', video.readyState);
        }
        scanAnimationRef.current = requestAnimationFrame(scan);
        return;
      }
 
      const { videoWidth, videoHeight } = video;
      
      if (videoWidth === 0 || videoHeight === 0) {
        if (scanCount % 30 === 0) {
          console.log('⚠️ Video dimensions not ready:', { videoWidth, videoHeight });
        }
        scanAnimationRef.current = requestAnimationFrame(scan);
        return;
      }
 
      // Log scanning activity periodically
      if (scanCount % 30 === 0) { // Log every 30 frames (about every 1 second)
        console.log('🔄 Scanning active, frame:', scanCount, 'dimensions:', videoWidth + 'x' + videoHeight);
      }
 
      // Set canvas size to match video
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      try {
        // Get image data for QR scanning
        const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
        
        // Scan for QR code with enhanced options for better detection
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth", // Try both normal and inverted
          // Add more permissive scanning options
        });
        
        // Debug: Log scanning attempt every 60 frames
        if (scanCount % 60 === 0) {
          console.log('🔍 QR Scan attempt:', scanCount, 'Result:', code ? 'DETECTED' : 'NOT_FOUND');
        }
        
        if (code && code.data) {
          console.log('🎯 QR Code detected:', code.data);
          const now = Date.now();
          if (now - lastScanTime > 1000) { // Reduced cooldown to 1 second for better responsiveness
            console.log('✅ Processing QR code (cooldown passed)');
            setLastScanTime(now);
            handleQRCodeScanned(code.data);
            return; // Stop scanning after successful detection
          } else {
            console.log('⏰ QR code detected but in cooldown period, remaining:', Math.round((1000 - (now - lastScanTime))/1000) + 's');
          }
        }
      } catch (err) {
        console.error('❌ Error scanning QR code:', err);
      }
      
      // Continue scanning - check conditions again
      if (!isSubmitting && !scanSuccess && !showSuccessOverlay) {
        scanAnimationRef.current = requestAnimationFrame(scan);
      } else {
        console.log('🛑 Stopping scan loop:', { isSubmitting, scanSuccess, showSuccessOverlay });
      }
    };
 
    // Start the scanning loop
    scan();
  };
 
  // Handle QR code detection
  const handleQRCodeScanned = async (qrData: string) => {
    console.log('🚀 handleQRCodeScanned called with:', {
      isSubmitting,
      scanSuccess,
      showSuccessOverlay,
      qrDataType: typeof qrData,
      qrDataLength: qrData?.length
    });
 
    if (isSubmitting) {
      console.log('❌ Already submitting, ignoring QR scan');
      return;
    }
 
    if (scanSuccess || showSuccessOverlay) {
      console.log('❌ Already successful or overlay active, ignoring QR scan');
      return;
    }
 
    // Tambahkan validasi untuk mendeteksi response API
    try {
      const parsed = JSON.parse(qrData);
      
      // Deteksi jika QR code adalah response API
      if (parsed.success !== undefined || 
          parsed.message !== undefined || 
          parsed.operation !== undefined ||
          parsed.data !== undefined) {
        console.log('❌ Detected API response in QR code - rejecting');
        setError('QR Code yang dipindai adalah hasil response API. Silakan scan QR code presensi yang asli dari moderator.');
        setIsSubmitting(false);
        
        // Resume scanning setelah 3 detik
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          startScanning();
        }, 3000);
        return;
      }
    } catch {
      // Bukan JSON, lanjutkan proses normal
    }
 
    // Add cooldown to prevent rapid scanning
    const now = Date.now();
    if (now - lastScanTime < 1000) { // 1 second cooldown - consistent with scanning
      console.log('❌ Cooldown active, ignoring QR scan');
      return;
    }
    setLastScanTime(now);
    
    const pertemuanIdNumber = parseInt(pertemuanId, 10);
    let isValidQR = false;
    
    // STRICT QR validation - only accept valid attendance QR codes
    try {
      const parsed = JSON.parse(qrData);
      console.log('🔍 Parsed QR data structure:', Object.keys(parsed));
      
      // IMMEDIATELY reject any API response patterns - ZERO TOLERANCE
      if (parsed.success !== undefined || 
          parsed.message !== undefined || 
          parsed.operation !== undefined ||
          parsed.data !== undefined ||
          parsed.previous_status !== undefined ||
          parsed.user_id !== undefined ||
          parsed.nim !== undefined ||
          parsed.created_at !== undefined ||
          parsed.updated_at !== undefined ||
          parsed.id !== undefined ||
          parsed.qr_code !== undefined ||
          parsed.jam !== undefined ||
          parsed.hari !== undefined) {
        setError('❌ TIDAK VALID: QR Code yang dipindai adalah response sistem atau data database, bukan QR presensi yang sah. Mohon pindai QR code presensi asli yang ditampilkan moderator!');
        setIsSubmitting(false);
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          startScanning();
        }, 4000); // Increased timeout for longer message
        return;
      }
      
      // ONLY accept proper attendance QR codes
      if (parsed.type !== 'attendance') {
        console.log('❌ QR type is not "attendance":', parsed.type);
        setError('QR Code harus bertipe "attendance" untuk presensi.');
        setIsSubmitting(false);
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          startScanning();
        }, 3000);
        return;
      }
      
      // Must have required fields
      if (!parsed.pertemuan_id || !parsed.token) {
        console.log('❌ QR code missing essential attendance fields');
        setError('QR Code tidak lengkap. Harus memiliki pertemuan_id dan token.');
        setIsSubmitting(false);
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          startScanning();
        }, 3000);
        return;
      }
 
      // Check QR code expiry
      if (parsed.expires_at) {
        const expiryTime = new Date(parsed.expires_at).getTime();
        const currentTime = new Date().getTime();
        
        if (currentTime > expiryTime) {
          console.log('❌ QR code has expired');
          setError('QR Code sudah kadaluarsa. Minta QR Code baru dari moderator.');
          setIsSubmitting(false);
          setTimeout(() => {
            setError(null);
            setIsScanning(true);
            startScanning();
          }, 3000);
          return;
        }
      }
 
      // Validate pertemuan_id matches
      if (parsed.pertemuan_id !== pertemuanIdNumber) {
        console.log(`❌ QR pertemuan_id mismatch: ${parsed.pertemuan_id} vs ${pertemuanIdNumber}`);
        setError(`QR Code ini untuk pertemuan ${parsed.pertemuan_id}, bukan pertemuan ${pertemuanIdNumber}. Pastikan menggunakan QR Code yang sesuai.`);
        setIsSubmitting(false);
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          startScanning();
        }, 3000);
        return;
      }
      
      console.log('✅ QR data validation passed, proceeding with API call');
      isValidQR = true;
      
    } catch {
      // Not JSON format - REJECT immediately
      console.log('❌ STRICT: QR data is not valid JSON format - rejecting');
      setError('QR Code harus dalam format JSON yang valid untuk presensi.');
      setIsSubmitting(false);
      setTimeout(() => {
        setError(null);
        setIsScanning(true);
        startScanning();
      }, 3000);
      return;
    }
    
    // Only proceed if QR is valid
    if (!isValidQR) {
      console.log('❌ QR validation failed, not proceeding with API call');
      return;
    }
    
    // Stop scanning immediately
    setIsSubmitting(true);
    setIsScanning(false);
    
    // Stop the scan animation
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
    }
 
    try {
      // Prepare request data
      const pertemuanIdNumber = parseInt(pertemuanId, 10);
      
      if (isNaN(pertemuanIdNumber)) {
        console.error('❌ Invalid pertemuan ID:', pertemuanId);
        setError('ID pertemuan tidak valid');
        setIsSubmitting(false);
        setIsScanning(true);
        startScanning();
        return;
      }
      
      const requestData = {
        qr_data: String(qrData), // Pastikan selalu dikirim sebagai string
        pertemuan_id: pertemuanIdNumber
      };
      
      console.log('📨 Sending request:', {
        ...requestData,
        qr_data_type: typeof requestData.qr_data,
        pertemuan_id_type: typeof requestData.pertemuan_id
      });
 
      const response = await fetch('/api/user/absen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
 
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📋 Response data:', result);
 
      if (response.ok && result.success) {
        console.log('✅ Attendance recorded successfully');
        
        // IMMEDIATELY stop all scanning to prevent response being read as QR
        setIsScanning(false);
        setIsSubmitting(false);
        setScanSuccess(true);
        setShowSuccessOverlay(true); // Tampilkan overlay
        
        // Stop the scan animation permanently
        if (scanAnimationRef.current) {
          cancelAnimationFrame(scanAnimationRef.current);
          scanAnimationRef.current = null;
        }
        
        // Berhenti streaming video sepenuhnya
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('🛑 Stopped camera track after success:', track.kind);
          });
          setStream(null);
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          console.log('🛑 Cleared video source after success');
        }
        
        setScanResult(result);
        
        // Set attendance status for display based on operation
        if (result.operation === 'update' && result.previous_status === 'tidak_hadir') {
          setAttendanceStatus('updated_from_absent');
        } else if (result.operation === 'insert') {
          setAttendanceStatus('new_attendance');
        } else if (result.operation === 'already_present') {
          setAttendanceStatus('already_attended');
        } else if (result.operation === 'update') {
          setAttendanceStatus('already_present');
        } else {
          setAttendanceStatus('success');
        }
        
        onSuccess?.(result);
        
        // Show success for 4 seconds then close
        setTimeout(() => {
          onClose();
        }, 4000);
      } else {
        const errorMsg = result.message || result.error || 'Gagal melakukan absensi';
        console.error('❌ Attendance error:', errorMsg);
 
        
        // For 409 or already attended cases, treat as success
        if (response.status === 409 || errorMsg.includes('sudah melakukan absensi')) {
          console.log('ℹ️ User already attended, treating as success');
          
          // IMMEDIATELY stop scanning
          setIsScanning(false);
          setIsSubmitting(false);
          setScanSuccess(true);
          setShowSuccessOverlay(true);
          
          if (scanAnimationRef.current) {
            cancelAnimationFrame(scanAnimationRef.current);
            scanAnimationRef.current = null;
          }
          
          // Berhenti streaming video sepenuhnya
          if (stream) {
            stream.getTracks().forEach(track => {
              track.stop();
              console.log('🛑 Stopped camera track after already attended:', track.kind);
            });
            setStream(null);
          }
          
          if (videoRef.current) {
            videoRef.current.srcObject = null;
            console.log('🛑 Cleared video source after already attended');
          }
          
          setAttendanceStatus('already_attended');
          setScanResult(result);
          
          // Show message for 4 seconds then close
          setTimeout(() => {
            onClose();
          }, 4000);
        } else {
          setError(errorMsg);
          
          // Resume scanning after error
          setTimeout(() => {
            console.log('🔄 Resuming scanning after error...');
            setIsSubmitting(false);
            setIsScanning(true);
            startScanning();
          }, 2000);
        }
      }
 
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError('Gagal terhubung ke server. Periksa koneksi internet.');
      
      // Resume scanning after network error
      setTimeout(() => {
        console.log('🔄 Resuming scanning after network error...');
        setIsSubmitting(false);
        setIsScanning(true);
        startScanning();
      }, 2000);
    }
  };
 
  // Retry on error
  const handleRetry = () => {
    console.log('🔄 Retrying camera access...');
    setError(null);
    setScanSuccess(false);
    setShowSuccessOverlay(false);
    setIsSubmitting(false);
    setIsScanning(false);
    setLastScanTime(0);
    
    if (!checkBrowserSupport()) return;
    
    // Clean up any existing scan animation
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
    }
    
    // Restart camera which will automatically start scanning
    startCamera();
  };
 
  // Handle modal close
  const handleClose = () => {
    cleanup();
    onClose();
  };
 
  // Auto-start when modal opens
  useEffect(() => {
    console.log('📱 Modal state changed - isOpen:', isOpen);
    
    if (isOpen) {
      console.log('🚀 Modal opened, starting permission check...');
      console.log('📋 Pertemuan ID:', pertemuanId);
      checkPermissionStatus();
    } else {
      console.log('🚪 Modal closed, cleaning up...');
      cleanup();
    }
  }, [isOpen]);
 
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="sm"
      backdrop="blur"
      isDismissable={!isSubmitting && !scanSuccess && !showSuccessOverlay}
      placement="center"
      classNames={{
        base: "mx-4 my-4 max-h-[85vh] max-w-[400px] lg:max-w-[450px]", // Smaller max width for desktop
        wrapper: "p-4", // Add padding to wrapper
        backdrop: "bg-black/50",
        header: "border-b border-divider px-4 py-3",
        body: "px-4 py-4 max-h-[65vh] overflow-y-auto", // Smaller body height
        footer: "border-t border-divider px-4 py-3"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Scan Presensi</h2>
              {/* <p className="text-small text-default-500">Pertemuan ID: {pertemuanId}</p> */}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {/* Success Overlay - Covers entire modal to prevent scanner from reading the response */}
          {showSuccessOverlay && (
            <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
              <Card className="border-none shadow-lg max-w-[280px] sm:max-w-[320px] mx-auto w-full">
                <CardHeader className="text-center pb-2">
                  {/* Icon based on attendance status */}
                  <div className="flex justify-center w-full">
                    <div className={`p-3 sm:p-4 rounded-full ${
                      attendanceStatus === 'already_attended' 
                        ? 'bg-warning-100 text-warning-600'
                        : attendanceStatus === 'updated_from_absent'
                        ? 'bg-secondary-100 text-secondary-600'
                        : 'bg-success-100 text-success-600'
                    }`}>
                      {attendanceStatus === 'already_attended' ? (
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardBody className="text-center pt-2 px-4 sm:px-6">
                  {/* Title and message based on status */}
                  {attendanceStatus === 'already_attended' ? (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Sudah Absen</h3>
                      <p className="text-warning-600 mb-3 text-sm sm:text-base">
                        Anda sudah melakukan absensi untuk pertemuan ini
                      </p>
                      <Chip color="warning" variant="flat" size="sm">
                        Status: {scanResult?.data?.status || 'Hadir'}
                      </Chip>
                    </>
                  ) : attendanceStatus === 'updated_from_absent' ? (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Absensi Berhasil Diperbarui!</h3>
                      <p className="text-secondary-600 mb-3 text-sm sm:text-base">
                        Status Anda telah berhasil diubah dari "Tidak Hadir" menjadi "Hadir"
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        <Chip color="secondary" variant="flat" size="sm">
                          Status: {scanResult?.data?.status || 'Hadir'}
                        </Chip>
                        <p className="text-xs sm:text-small text-default-500">
                          Waktu: {formatIndonesiaTime(scanResult?.data?.jam || '')}
                        </p>
                      </div>
                    </>
                  ) : attendanceStatus === 'new_attendance' ? (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Absensi Berhasil Tercatat!</h3>
                      <p className="text-success-600 mb-3 text-sm sm:text-base">
                        Presensi Anda telah berhasil dicatat
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        <Chip color="success" variant="flat" size="sm">
                          Status: {scanResult?.data?.status || 'Hadir'}
                        </Chip>
                        <p className="text-xs sm:text-small text-default-500">
                          Waktu: {formatIndonesiaTime(scanResult?.data?.jam || '')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Absensi Berhasil!</h3>
                      <p className="text-success-600 mb-3 text-sm sm:text-base">
                        Presensi Anda telah tercatat
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        <Chip color="success" variant="flat" size="sm">
                          Status: {scanResult?.data?.status || 'Hadir'}
                        </Chip>
                        <p className="text-small text-default-500">
                          Waktu: {formatIndonesiaTime(scanResult?.data?.jam || '')}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Progress bar for auto-close */}
                  <div className="mt-4">
                    <Progress 
                      value={100} 
                      color="success" 
                      className="h-1"
                    />
                    <p className="text-xs text-default-500 mt-2">
                      Modal akan tertutup otomatis dalam 4 detik
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
 
          {/* Permission Request */}
          {needsPermission && !error && !scanSuccess && !showSuccessOverlay && (
            <Card className="border-none shadow-lg">
              <CardBody className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-warning-100 text-warning-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Izin Akses Kamera</h3>
                <p className="text-default-600 text-sm max-w-sm mx-auto mb-6">
                  Aplikasi membutuhkan akses kamera untuk memindai kode QR presensi. 
                  Pastikan untuk mengizinkan akses kamera di browser Anda.
                </p>
                <Button
                  color="warning"
                  onPress={requestPermissionAndStart}
                  className="font-semibold"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Meminta Izin...' : 'Izinkan Akses Kamera'}
                </Button>
              </CardBody>
            </Card>
          )}
 
          {/* Error Display - Using Heroui Alert */}
          {error && !isSubmitting && !scanSuccess && !showSuccessOverlay && (
            <div className="mb-4">
              <Alert 
                hideIconWrapper
                color="danger"
                variant="bordered"
                title="Error"
                description={error}
              />
            </div>
          )}
 
          {/* Scanner Interface */}
          {!needsPermission && !error && !scanSuccess && !showSuccessOverlay && (
            <div className="space-y-4">
              {/* QR Scanner Container */}
              <Card className="border border-divider p-1 sm:p-2">
                <CardBody className="flex items-center justify-center p-2">
                  <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[300px] mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      playsInline
                      style={{ display: hasPermission && !isLoading ? 'block' : 'none' }}
                    />
                    
                    {/* Hidden Canvas for QR Processing */}
                    <canvas 
                      ref={canvasRef}
                      style={{ display: 'none' }}
                    />
                    
                    {/* Loading Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex items-center justify-center z-10">
                        <div className="text-center text-gray-800 dark:text-white">
                          <Spinner size="lg" className="mb-4" />
                          <p className="text-xs sm:text-sm font-medium">Mengakses kamera...</p>
                        </div>
                      </div>
                    )}
 
                    {/* Submitting Overlay */}
                    {isSubmitting && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex items-center justify-center z-20">
                        <div className="text-center text-gray-800 dark:text-white">
                          <Spinner size="lg" className="mb-4" />
                          <p className="text-xs sm:text-sm font-medium">Memproses absensi...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
              
              {/* Simple Status Indicator */}
              <div className="flex justify-center">
                {isSubmitting ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Spinner size="sm" color="primary" />
                    <span className="text-xs sm:text-sm font-medium">Memproses...</span>
                  </div>
                ) : hasPermission && !isLoading && !error && isScanning ? (
                  <div className="flex items-center gap-2 text-success">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium animate-pulse">Silahkan Scan QR Code</span>
                  </div>
                ) : isLoading ? (
                  <span className="text-xs sm:text-sm text-warning font-medium">Memuat...</span>
                ) : (
                  <span className="text-xs sm:text-sm text-default-500 font-medium">Menunggu kamera</span>
                )}
              </div>
            </div>
          )}
 
          {/* Initial State - No camera yet */}
          {!hasPermission && !isLoading && !error && !needsPermission && !scanSuccess && !showSuccessOverlay && (
            <Card className="border-none shadow-lg">
              <CardBody className="text-center py-4 sm:py-6">
                <div className="flex justify-center mb-3">
                  <div className="p-2 sm:p-3 rounded-full bg-warning-100 text-warning-600">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm sm:text-base font-semibold mb-2">QR Scanner Presensi</h3>
                <p className="text-xs sm:text-sm text-default-600">
                  Scanner akan mulai secara otomatis untuk memindai QR code presensi
                </p>
              </CardBody>
            </Card>
          )}
        </ModalBody>
        
        <ModalFooter>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            {error && !isSubmitting && !scanSuccess && !showSuccessOverlay && (
              <Button
                color="warning"
                variant="flat"
                onPress={handleRetry}
                className="flex-1 font-semibold text-sm sm:text-base"
                size="sm"
              >
                Coba Lagi
              </Button>
            )}
            <Button 
              color="danger" 
              variant="light" 
              onPress={handleClose}
              className="flex-1 text-sm sm:text-base"
              size="sm"
              isDisabled={isSubmitting}
            >
              {scanSuccess || showSuccessOverlay ? 'Selesai' : isSubmitting ? 'Tunggu...' : 'Tutup'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
 
export default QRScannerModal;
