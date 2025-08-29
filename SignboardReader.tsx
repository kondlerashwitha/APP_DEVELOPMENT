'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraView from './CameraView';
import AudioDetector from './AudioDetector';
import LanguageSelector from './LanguageSelector';

interface SignboardReaderState {
  isActive: boolean;
  isProcessing: boolean;
  recognizedText: string;
  currentLanguage: 'eng' | 'hin' | 'tel';
  status: string;
  error: string | null;
}

export default function SignboardReader() {
  const [state, setState] = useState<SignboardReaderState>({
    isActive: false,
    isProcessing: false,
    recognizedText: '',
    currentLanguage: 'eng',
    status: 'Ready to start. Clap to activate!',
    error: null
  });

  const cameraRef = useRef<{ captureImage: () => Promise<string | null> } | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback((status: string) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const speakStatus = useCallback((text: string, language: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const handleClapDetected = useCallback(() => {
    setState(prev => {
      const newIsActive = !prev.isActive;
      
      if (newIsActive) {
        speakStatus("SignBoard Reader activated. Point camera at text.");
        return {
          ...prev,
          isActive: true,
          status: 'Camera activated! Point at text to read.',
          error: null
        };
      } else {
        speakStatus("SignBoard Reader deactivated.");
        // Clear any processing timeout
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        return {
          ...prev,
          isActive: false,
          isProcessing: false,
          status: 'Deactivated. Clap to activate again.',
          recognizedText: ''
        };
      }
    });
  }, [speakStatus]);

  const processImage = useCallback(async () => {
    if (!state.isActive || state.isProcessing || !cameraRef.current) return;

    setState(prev => ({ ...prev, isProcessing: true, status: 'Scanning for text...' }));
    speakStatus("Scanning for text, please wait.");

    try {
      const imageData = await cameraRef.current.captureImage();
      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      // Import Tesseract dynamically to avoid SSR issues
      const { createWorker } = await import('tesseract.js');
      
      updateStatus('Processing text recognition...');
      
      const worker = await createWorker(state.currentLanguage);
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      const cleanText = text.trim();
      
      if (cleanText.length > 0) {
        setState(prev => ({
          ...prev,
          recognizedText: cleanText,
          status: `Found text: ${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}`,
          isProcessing: false
        }));

        // Determine language for TTS
        let ttsLanguage = 'en-US';
        if (state.currentLanguage === 'hin') {
          ttsLanguage = 'hi-IN';
        } else if (state.currentLanguage === 'tel') {
          ttsLanguage = 'te-IN';
        }

        // Speak the recognized text
        speakStatus(cleanText, ttsLanguage);
        
        // Auto-scan again after a delay if still active
        processingTimeoutRef.current = setTimeout(() => {
          if (state.isActive) {
            processImage();
          }
        }, 3000);
        
      } else {
        setState(prev => ({
          ...prev,
          status: 'No text found. Try adjusting the camera position.',
          isProcessing: false
        }));
        speakStatus("No text found. Try adjusting the camera position.");
        
        // Retry after a shorter delay
        processingTimeoutRef.current = setTimeout(() => {
          if (state.isActive) {
            processImage();
          }
        }, 1500);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'Error during text recognition. Please try again.',
        isProcessing: false
      }));
      speakStatus("Error during text recognition. Please try again.");
    }
  }, [state.isActive, state.isProcessing, state.currentLanguage, speakStatus, updateStatus]);

  // Auto-start processing when camera becomes active
  useEffect(() => {
    if (state.isActive && !state.isProcessing) {
      const timer = setTimeout(processImage, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isActive, processImage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleLanguageChange = (language: 'eng' | 'hin' | 'tel') => {
    setState(prev => ({ ...prev, currentLanguage: language }));
    const languageNames = { eng: 'English', hin: 'Hindi', tel: 'Telugu' };
    speakStatus(`Language changed to ${languageNames[language]}`);
  };

  return (
    <div className="space-y-6">
      {/* Audio Detection */}
      <AudioDetector onClapDetected={handleClapDetected} isActive={state.isActive} />
      
      {/* Language Selector */}
      <LanguageSelector 
        currentLanguage={state.currentLanguage}
        onLanguageChange={handleLanguageChange}
      />

      {/* Status Display */}
      <motion.div 
        className="text-center"
        key={state.status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          {state.isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Icon icon="material-symbols:sync" className="text-2xl text-blue-300" />
            </motion.div>
          ) : state.isActive ? (
            <Icon icon="material-symbols:visibility" className="text-2xl text-green-400" />
          ) : (
            <Icon icon="material-symbols:visibility-off" className="text-2xl text-gray-400" />
          )}
          
          <span className={`font-medium ${
            state.isActive ? 'text-green-400' : 'text-gray-300'
          }`}>
            {state.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <p className="text-white text-lg font-light">{state.status}</p>
        
        {state.error && (
          <p className="text-red-400 text-sm mt-2">{state.error}</p>
        )}
      </motion.div>

      {/* Camera View */}
      <AnimatePresence>
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <CameraView ref={cameraRef} isProcessing={state.isProcessing} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognized Text Display */}
      <AnimatePresence>
        {state.recognizedText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Icon icon="material-symbols:text-fields" className="text-xl text-blue-300" />
              Recognized Text
            </h3>
            <p className="text-gray-100 text-base leading-relaxed">
              {state.recognizedText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="text-center text-blue-200 text-sm">
        <p className="flex items-center justify-center gap-2 mb-2">
          <Icon icon="mdi:information" className="text-base" />
          Clap once to activate, clap again to deactivate
        </p>
        <p>Make sure to grant camera and microphone permissions when prompted</p>
      </div>
    </div>
  );
}