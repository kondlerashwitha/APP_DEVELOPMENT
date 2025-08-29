'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface TextToSpeechProps {
  text: string;
  language: 'eng' | 'hin' | 'tel';
  autoSpeak?: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

interface Voice {
  voice: SpeechSynthesisVoice;
  lang: string;
  name: string;
}

export default function TextToSpeech({ 
  text, 
  language, 
  autoSpeak = false, 
  onSpeakingChange 
}: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechVolume, setSpeechVolume] = useState(0.8);

  const languageMap = useMemo(() => ({
    eng: 'en-US',
    hin: 'hi-IN',
    tel: 'te-IN'
  }), []);

  // Load available voices
  const loadVoices = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    const voices = speechSynthesis.getVoices();
    const currentLang = languageMap[language];
    
    // Filter voices for current language or fallback to English
    const relevantVoices = voices
      .filter(voice => 
        voice.lang.startsWith(currentLang.split('-')[0]) || 
        voice.lang.startsWith('en')
      )
      .map(voice => ({
        voice,
        lang: voice.lang,
        name: voice.name
      }));

    setAvailableVoices(relevantVoices);
    
    // Select best voice for current language
    const preferredVoice = voices.find(voice => voice.lang === currentLang) ||
                          voices.find(voice => voice.lang.startsWith(currentLang.split('-')[0])) ||
                          voices.find(voice => voice.lang.startsWith('en')) ||
                          voices[0];
    
    setSelectedVoice(preferredVoice || null);
  }, [language, languageMap]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();
      
      // Some browsers need to wait for voices to load
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  const speak = useCallback((textToSpeak: string = text) => {
    if (!isSupported || !textToSpeak.trim()) return;
    
    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = languageMap[language];
    utterance.rate = speechRate;
    utterance.volume = speechVolume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      onSpeakingChange?.(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onSpeakingChange?.(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      onSpeakingChange?.(false);
    };
    
    speechSynthesis.speak(utterance);
  }, [text, language, languageMap, speechRate, speechVolume, selectedVoice, isSupported, onSpeakingChange]);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  // Auto-speak when text changes
  useEffect(() => {
    if (autoSpeak && text.trim() && isSupported && selectedVoice) {
      const timer = setTimeout(() => speak(), 500);
      return () => clearTimeout(timer);
    }
  }, [text, autoSpeak, speak, isSupported, selectedVoice]);

  if (!isSupported) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-yellow-300">
          <Icon icon="material-symbols:warning" className="text-xl" />
          <span className="font-medium">Text-to-Speech Not Supported</span>
        </div>
        <p className="text-yellow-200 text-sm mt-2">
          Your browser doesn&apos;t support text-to-speech functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <Icon icon="material-symbols:volume-up" className="text-xl text-green-400" />
        Text-to-Speech Controls
      </h3>
      
      {text.trim() ? (
        <div className="space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={() => speak()}
              disabled={isSpeaking && !isPaused}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-300 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon icon="material-symbols:play-arrow" className="text-xl" />
              Speak
            </motion.button>
            
            {isSpeaking && !isPaused && (
              <motion.button
                onClick={pause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Icon icon="material-symbols:pause" className="text-xl" />
                Pause
              </motion.button>
            )}
            
            {isSpeaking && isPaused && (
              <motion.button
                onClick={resume}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Icon icon="material-symbols:play-arrow" className="text-xl" />
                Resume
              </motion.button>
            )}
            
            {isSpeaking && (
              <motion.button
                onClick={stop}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Icon icon="material-symbols:stop" className="text-xl" />
                Stop
              </motion.button>
            )}
          </div>
          
          {/* Speaking Status */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Icon icon="material-symbols:graphic-eq" className="text-xl" />
                  </motion.div>
                  <span className="font-medium">
                    {isPaused ? 'Speech Paused' : 'Speaking...'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Speed and Volume Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Speed: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Volume: {Math.round(speechVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          {/* Voice Selection */}
          {availableVoices.length > 1 && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Voice ({availableVoices.length} available)
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find(v => v.voice.name === e.target.value);
                  setSelectedVoice(voice?.voice || null);
                }}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.voice.name} value={voice.voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <Icon icon="material-symbols:text-fields" className="text-3xl mx-auto mb-2 opacity-50" />
          <p>No text to speak. Scan some text first.</p>
        </div>
      )}
    </div>
  );
}