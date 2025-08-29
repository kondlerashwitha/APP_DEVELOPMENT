'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface CameraViewProps {
  isProcessing: boolean;
}

export interface CameraViewRef {
  captureImage: () => Promise<string | null>;
}

const CameraView = forwardRef<CameraViewRef, CameraViewProps>(({ isProcessing }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    captureImage: async (): Promise<string | null> => {
      if (!videoRef.current || !canvasRef.current) return null;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return null;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      return canvas.toDataURL('image/png');
    }
  }));

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setError(null);
        
        // Request camera access with optimal settings for OCR
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: { ideal: 'environment' }, // Use back camera on mobile
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              setIsReady(true);
            }
          };
        }
      } catch (error) {
        console.error('Camera access error:', error);
        if (mounted) {
          setError(
            error instanceof Error 
              ? error.message.includes('Permission denied')
                ? 'Camera permission denied. Please allow camera access and reload the page.'
                : `Camera error: ${error.message}`
              : 'Failed to access camera. Please check your camera permissions.'
          );
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  if (error) {
    return (
      <div className="relative bg-black/50 backdrop-blur-sm rounded-xl p-8 text-center border border-red-400/30">
        <Icon icon="material-symbols:error" className="text-4xl text-red-400 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">Camera Error</h3>
        <p className="text-red-200 text-sm">{error}</p>
        <p className="text-gray-300 text-xs mt-3">
          Make sure to allow camera permissions in your browser settings
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div 
        className="relative bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video object-cover"
        />
        
        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-blue-300 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white text-lg font-light">Initializing Camera...</p>
            </div>
          </div>
        )}
        
        {/* Processing Overlay */}
        {isProcessing && isReady && (
          <motion.div 
            className="absolute inset-0 bg-blue-600/20 backdrop-blur-[2px] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-blue-500/90 backdrop-blur-sm rounded-full p-4 mb-4"
              >
                <Icon icon="material-symbols:photo-camera" className="text-3xl text-white" />
              </motion.div>
              <p className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-full">
                Scanning Text...
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Scanning Animation Border */}
        {isReady && (
          <motion.div
            className="absolute inset-2 border-2 border-blue-400/60 rounded-lg pointer-events-none"
            animate={{ 
              opacity: isProcessing ? [0.3, 1, 0.3] : 0.3,
            }}
            transition={{ 
              duration: 2, 
              repeat: isProcessing ? Infinity : 0,
              ease: "easeInOut" 
            }}
          />
        )}
        
        {/* Corner Guides */}
        {isReady && (
          <>
            {/* Top corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-blue-400/80 rounded-tl-md" />
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-blue-400/80 rounded-tr-md" />
            {/* Bottom corners */}
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-blue-400/80 rounded-bl-md" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-blue-400/80 rounded-br-md" />
          </>
        )}
      </motion.div>
      
      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-blue-200 text-sm font-light">
          Point your camera at text-containing signs or documents
        </p>
        <p className="text-blue-300/70 text-xs mt-1">
          Best results with good lighting and clear, unobstructed text
        </p>
      </div>
    </div>
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;