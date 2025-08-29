'use client';

import { useState, useEffect } from 'react';
import SignboardReader from '@/app/components/SignboardReader';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Icon 
            icon="material-symbols:accessibility-rounded" 
            className="text-6xl text-blue-300 mx-auto mb-4" 
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-blue-100 mt-4 text-lg font-light">Loading SignBoard Reader...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon 
              icon="material-symbols:accessibility-rounded" 
              className="text-5xl text-blue-300" 
            />
            <h1 className="text-4xl md:text-5xl font-light text-white">
              SignBoard Reader
            </h1>
          </div>
          <p className="text-blue-200 text-lg font-light max-w-2xl mx-auto">
            An assistive technology app that reads text aloud from your surroundings. 
            Supports Telugu, Hindi, and English languages.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 md:p-8"
        >
          <SignboardReader />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-6"
        >
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Icon 
              icon="mdi:microphone" 
              className="text-3xl text-blue-300 mx-auto mb-3" 
            />
            <h3 className="text-white font-medium mb-2">Clap to Activate</h3>
            <p className="text-blue-200 text-sm font-light">
              First clap activates the camera, second clap deactivates it
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Icon 
              icon="material-symbols:camera-outline-rounded" 
              className="text-3xl text-blue-300 mx-auto mb-3" 
            />
            <h3 className="text-white font-medium mb-2">Smart OCR</h3>
            <p className="text-blue-200 text-sm font-light">
              Advanced text recognition that works in various lighting conditions
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Icon 
              icon="material-symbols:volume-up" 
              className="text-3xl text-blue-300 mx-auto mb-3" 
            />
            <h3 className="text-white font-medium mb-2">Multi-Language</h3>
            <p className="text-blue-200 text-sm font-light">
              Supports Telugu, Hindi, and English with natural voice output
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}