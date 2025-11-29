'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface CTAConfig {
    text: string
    icon: string
    variant: 'primary' | 'secondary'
    message?: string
    href?: string
}

interface SmartCTAProps {
    config: CTAConfig
    onClick?: () => void
}

/**
 * 상황 인지형 단일 CTA 버튼
 */
export default function SmartCTA({ config, onClick }: SmartCTAProps) {
    const router = useRouter()

    const handleClick = () => {
        if (config.href) {
            router.push(config.href)
        } else if (onClick) {
            onClick()
        }
    }

    const buttonClasses = config.variant === 'primary'
        ? 'bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black hover:scale-[1.02]'
        : 'bg-gray-800 text-white border-2 border-gray-700 hover:border-[#00FFC2]/50'

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            className="space-y-3"
        >
            {config.message && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-gray-400 text-sm"
                >
                    {config.message}
                </motion.p>
            )}

            <button
                onClick={handleClick}
                className={`w-full py-4 font-bold text-lg rounded-2xl transition-all shadow-lg ${buttonClasses}`}
            >
                {config.icon} {config.text}
            </button>
        </motion.div>
    )
}
