"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Alert } from "@heroui/alert";

interface QRCodeGeneratorProps {
  pertemuanId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QRData {
  qr_code: string;
  qr_data: {
    type: string;
    pertemuan_id: number;
    token: string;
    time_slot: number;
    timestamp: string;
    meeting_title: string;
    generated_at: string;
    expires_at: string;
  };
  meeting: {
    id: number;
    title: string;
    date: string;
    time: string;
    status: string;
  };
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  pertemuanId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // QR expires every 10 seconds (must match API)
  const QR_EXPIRY_SECONDS = 10;

  // Generate QR Code
  const generateQRCode = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/moderator/absensi/${pertemuanId}/qr-code`);
      const result = await response.json();
      
      if (result.success) {
        setQrData(result.data);
        startCountdown(QR_EXPIRY_SECONDS);
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to generate QR code');
        setAutoRefresh(false);
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
      setAutoRefresh(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Start auto-refresh QR code generation
  const startAutoRefresh = async () => {
    setAutoRefresh(true);
    await generateQRCode(true);
    
    // Set up auto-refresh every 10 seconds
    refreshIntervalRef.current = setInterval(async () => {
      await generateQRCode(false); // Don't show loading spinner for auto-refresh
    }, QR_EXPIRY_SECONDS * 1000);
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    setAutoRefresh(false);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Start countdown timer for visual feedback
  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    return `${seconds}s`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      setError(null);
      setCountdown(0);
      stopAutoRefresh();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isOpen]);

  // Auto-start refresh when modal opens
  useEffect(() => {
    if (isOpen && !autoRefresh && !loading) {
      startAutoRefresh();
    }
  }, [isOpen]);

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
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Absensi QR</h2>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-gray-400 mt-4">Generating QR Code...</p>
            </div>
          )}

          {qrData && (
            <div className="space-y-6">
              {/* QR Code Display */}
              <Card className="bg-white p-2">
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <img 
                      src={qrData.qr_code} 
                      alt="QR Code for Attendance"
                      className="mx-auto mb-2 w-80 h-80 max-w-full"
                    />
                    <p className="text-gray-600">Scan untuk Absensi</p>
                  </div>
                </CardBody>
              </Card>

              {/* Auto-refresh Controls */}
              <div className="bg-gradient-to-r from-[#0f3460] to-[#16213e] p-4 rounded-lg border border-gray-700">
                {/* <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white">Auto-Refresh QR Code</h4>
                    <p className="text-gray-400 text-sm">QR code refreshes every 10 seconds</p>
                  </div>
                  <div className="flex gap-2">
                    {!autoRefresh ? (
                      <Button
                        size="sm"
                        color="success"
                        onPress={startAutoRefresh}
                        className="font-semibold"
                      >
                        Start Auto-Refresh
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        color="danger"
                        onPress={stopAutoRefresh}
                        className="font-semibold"
                      >
                        Stop Auto-Refresh
                      </Button>
                    )}
                  </div>
                </div> */}
                
                {/* Countdown Display */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      {/* <p className="text-gray-400 text-xs">Next refresh in:</p> */}
                      <div className="text-xl font-bold text-[#FFD700]">
                        {formatCountdown(countdown)}
                      </div>
                    </div>
                    {autoRefresh && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm">Auto-refresh active</span>
                      </div>
                    )}
                  </div>
                  {/* {qrData && (
                    <p className="text-gray-500 text-xs mt-2">
                      Token: {qrData.qr_data.token} | Slot: {qrData.qr_data.time_slot}
                    </p>
                  )} */}
                </div>
              </div>
            </div>
          )}

          {!qrData && !loading && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">QR Code Auto-Refresh</h3>
              <p className="text-gray-400 mb-6">
                QR code untuk absensi akan mulai generate secara otomatis dan refresh setiap 10 detik
              </p>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button 
            color="danger" 
            variant="light" 
            onPress={onClose}
          >
            Close
          </Button>
          {autoRefresh && (
            <Button 
              color="warning" 
              onPress={stopAutoRefresh}
              className="font-semibold"
            >
              Stop Auto-Refresh
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeGenerator;
