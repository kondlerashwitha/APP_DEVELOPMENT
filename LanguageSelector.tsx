'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface LanguageSelectorProps {
  currentLanguage: 'eng' | 'hin' | 'tel';
  onLanguageChange: (language: 'eng' | 'hin' | 'tel') => void;
}

const languages = [
  { 
    code: 'eng' as const, 
    name: 'English', 
    nativeName: 'English',
    flag: '🇺🇸',
    description: 'English text recognition'
  },
  { 
    code: 'hin' as const, 
    name: 'Hindi', 
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    description: 'Hindi text recognition'
  },
  { 
    code: 'tel' as const, 
    name: 'Telugu', 
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    description: 'Telugu text recognition'
  }
];

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <Icon icon="material-symbols:language" className="text-xl text-blue-300" />
        Select Language for Text Recognition
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {languages.map((language) => (
          <motion.button
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            className={`p-4 rounded-lg border transition-all duration-300 ${
              currentLanguage === language.code
                ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/20'
                : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: language.code === 'eng' ? 0 : language.code === 'hin' ? 0.1 : 0.2 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{language.flag}</div>
              <div className="text-white font-medium text-sm mb-1">
                {language.name}
              </div>
              <div className="text-blue-200 text-xs mb-2">
                {language.nativeName}
              </div>
              <div className="text-gray-300 text-xs">
                {language.description}
              </div>
              
              {currentLanguage === language.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-3 flex items-center justify-center"
                >
                  <div className="bg-blue-400 rounded-full p-1">
                    <Icon icon="material-symbols:check" className="text-white text-sm" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30">
        <div className="flex items-start gap-2">
          <Icon icon="material-symbols:info" className="text-blue-300 text-sm mt-0.5 flex-shrink-0" />
          <div className="text-blue-200 text-xs">
            <p className="mb-1">
              <strong>Current selection:</strong> {languages.find(l => l.code === currentLanguage)?.name}
            </p>
            <p>
              The selected language will be used for both text recognition (OCR) and text-to-speech output.
              Choose the language that matches the text you want to read.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}