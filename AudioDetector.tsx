'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface AudioDetectorProps {
  onClapDetected: () => void;
  isActive: boolean;
}

export default function AudioDetector({ onClapDetected, isActive }: AudioDetectorProps) {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Clap detection parameters
  const clapThreshold = 0.8; // Amplitude threshold for clap detection
  const clapCooldown = 1000; // Minimum time between clap detections (ms)
  const lastClapTimeRef = useRef<number>(0);

  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate the average volume level
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / bufferLength;
    const normalizedLevel = average / 255;
    
    setAudioLevel(normalizedLevel);
    
    // Simple clap detection based on sudden amplitude spikes
    if (normalizedLevel > clapThreshold) {
      const now = Date.now();
      
      // Check if enough time has passed since the last clap
      if (now - lastClapTimeRef.current > clapCooldown) {
        lastClapTimeRef.current = now;
        onClapDetected();
      }
    }
    
    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [onClapDetected, clapThreshold, clapCooldown]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Create microphone source
      microphoneRef.current = audioContext.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setIsListening(true);
      processAudio();
      
    } catch (error) {
      console.error('Microphone access error:', error);
      setError(
        error instanceof Error 
          ? error.message.includes('Permission denied')
            ? 'Microphone permission denied. Please allow microphone access and reload the page.'
            : `Microphone error: ${error.message}`
          : 'Failed to access microphone. Please check your microphone permissions.'
      );
    }
  }, [processAudio]);

  const stopListening = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Disconnect audio nodes
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsListening(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    // Start listening when component mounts
    startListening();
    
    // Cleanup on unmount
    return stopListening;
  }, [startListening, stopListening]);

  return (
    <div className="text-center">
      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon icon="material-symbols:mic-off" className="text-xl text-red-400" />
              <span className="text-red-400 font-medium">Microphone Error</span>
            </div>
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={startListening}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ 
                  scale: isListening ? [1, 1.1, 1] : 1,
                  opacity: isListening ? 1 : 0.5 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: isListening ? Infinity : 0,
                  ease: "easeInOut" 
                }}
              >
                <Icon 
                  icon={isListening ? "mdi:microphone" : "mdi:microphone-off"} 
                  className={`text-3xl ${
                    isListening ? 'text-green-400' : 'text-gray-400'
                  }`} 
                />
              </motion.div>
              
              <div className="text-left">
                <h3 className={`font-medium ${
                  isListening ? 'text-green-400' : 'text-gray-300'
                }`}>
                  Clap Detection
                </h3>
                <p className="text-sm text-gray-300">
                  {isListening ? 'Listening for claps...' : 'Microphone inactive'}
                </p>
              </div>
            </div>
            
            {/* Audio Level Indicator */}
            {isListening && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-400">Audio Level:</span>
                  <div className="flex-1 max-w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400"
                      style={{ width: `${audioLevel * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">
                    {Math.round(audioLevel * 100)}%
                  </span>
                </div>
                
                {/* Clap Detection Indicator */}
                <AnimatePresence>
                  {audioLevel > clapThreshold && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      👏 Clap Detected!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Current Status */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className={`text-sm ${
                  isActive ? 'text-green-400' : 'text-gray-300'
                }`}>
                  Camera: {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}