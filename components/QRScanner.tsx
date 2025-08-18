"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Alert } from "@heroui/alert";
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  userId: string;
  nim: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  nim
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Start camera and scanning
  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      setError(null);
      setSuccess(null);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError('Camera not available');
        return;
      }

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanSuccess(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Use back camera if available
        }
      );

      await qrScannerRef.current.start();
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  // Handle successful QR scan
  const handleScanSuccess = async (qrData: string) => {
    if (processing) return; // Prevent multiple scans
    
    setProcessing(true);
    stopScanning();

    try {
      // Send QR data to server for processing
      const response = await fetch('/api/absensi/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qr_data: qrData,
          user_id: userId,
          nim: nim
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`✅ ${result.message}`);
        onSuccess?.(result.data);
        
        // Auto close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Failed to process attendance');
        // Allow retry
        setTimeout(() => {
          setProcessing(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error processing QR scan:', err);
      setError('Failed to process attendance');
      setTimeout(() => {
        setProcessing(false);
      }, 2000);
    }
  };

  // Handle manual QR input (for testing)
  const handleManualInput = () => {
    const qrInput = prompt('Enter QR Code data (for testing):');
    if (qrInput) {
      handleScanSuccess(qrInput);
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setProcessing(false);
    } else {
      stopScanning();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="lg"
      backdrop="blur"
      classNames={{
        base: "bg-[#1a1a2e]",
        header: "border-b border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-700"
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12a1 1 0 002 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 6.414V12z"/>
                <path d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Scan QR Code Absensi</h2>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="success" className="mb-4">
              {success}
            </Alert>
          )}

          {processing && (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-gray-400 mt-4">Processing attendance...</p>
            </div>
          )}

          {!processing && !success && (
            <div className="space-y-6">
              {/* Camera View */}
              <Card className="bg-gray-800">
                <CardBody>
                  <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {!scanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
                            </svg>
                          </div>
                          <p className="text-white font-semibold mb-2">Ready to Scan</p>
                          <p className="text-gray-400 text-sm">
                            Position QR code within the frame
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Allow camera permission when prompted</li>
                  <li>• Point camera at QR code displayed by moderator</li>
                  <li>• Hold steady until scan completes</li>
                  <li>• Attendance will be recorded automatically</li>
                </ul>
              </div>

              {/* User Info */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Scanning as:</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">NIM:</span> {nim}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">User ID:</span> {userId}
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button 
            color="danger" 
            variant="light" 
            onPress={onClose}
          >
            Cancel
          </Button>
          {!scanning && !processing && !success && (
            <Button 
              color="primary" 
              onPress={startScanning}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold"
            >
              Start Scanning
            </Button>
          )}
          {scanning && (
            <Button 
              color="danger" 
              onPress={stopScanning}
            >
              Stop Scanning
            </Button>
          )}
          {/* Dev/Testing button */}
          {process.env.NODE_ENV === 'development' && (
            <Button 
              color="warning" 
              variant="flat"
              onPress={handleManualInput}
              className="text-xs"
            >
              Manual Input (Dev)
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRScanner;
