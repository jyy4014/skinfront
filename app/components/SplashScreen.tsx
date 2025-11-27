'use client'

import { motion } from 'framer-motion'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#121212] text-white flex flex-col items-center justify-center">
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(0,255,194,0.25), transparent 55%)',
            'radial-gradient(circle at 70% 70%, rgba(0,200,255,0.2), transparent 55%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center space-y-3"
        >
          <p className="text-sm tracking-[0.3em] text-[#00FFC2]/80">DERMA AI</p>
          <h1 className="text-3xl font-bold">피부 솔루션 로딩 중</h1>
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-500">
        청담 실장님
      </div>
    </div>
  )
}


