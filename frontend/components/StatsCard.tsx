/**
 * Stats Card Component
 * 
 * Displays a statistic card with:
 * - Icon
 * - Title
 * - Value
 * - Subtitle
 * - Color theme
 * 
 * Supports both small and large card variants.
 */

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  color: 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'teal'
  icon: string | ReactNode
  large?: boolean
  small?: boolean
  whiteCard?: boolean
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    bgDark: 'bg-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    textWhite: 'text-white',
  },
  red: {
    bg: 'bg-red-500',
    bgDark: 'bg-red-600',
    light: 'bg-red-50',
    text: 'text-red-600',
    textWhite: 'text-white',
  },
  orange: {
    bg: 'bg-orange-500',
    bgDark: 'bg-orange-600',
    light: 'bg-orange-50',
    text: 'text-orange-600',
    textWhite: 'text-white',
  },
  green: {
    bg: 'bg-green-500',
    bgDark: 'bg-green-600',
    light: 'bg-green-50',
    text: 'text-green-600',
    textWhite: 'text-white',
  },
  purple: {
    bg: 'bg-purple-500',
    bgDark: 'bg-purple-600',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    textWhite: 'text-white',
  },
  teal: {
    bg: 'bg-teal-500',
    bgDark: 'bg-teal-600',
    light: 'bg-teal-50',
    text: 'text-teal-600',
    textWhite: 'text-white',
  },
}

export default function StatsCard({
  title,
  value,
  subtitle,
  color,
  icon,
  large = false,
  small = false,
  whiteCard = false,
}: StatsCardProps) {
  const colors = colorClasses[color]

  // White cards with colored circular icons (main stats cards)
  if (whiteCard) {
    // Format number with commas
    const formattedValue = typeof value === 'number' 
      ? value.toLocaleString('en-US')
      : value

    return (
      <motion.div
        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Colored circular icon - smaller */}
            <div className={`${colors.bg} w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-sm`}>
              {typeof icon === 'string' ? (
                <span className="text-white text-lg">{icon}</span>
              ) : (
                <div className="text-white text-lg">{icon}</div>
              )}
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{formattedValue}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {/* Smaller illustration on the right */}
          <div className="w-16 h-16 flex items-center justify-center opacity-10">
            {typeof icon === 'string' ? (
              <span className="text-3xl">{icon}</span>
            ) : (
              <div className="text-3xl opacity-50">{icon}</div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Small white cards (quick stats in top right)
  if (small) {
    return (
      <motion.div
        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-xs font-medium ${colors.text} mb-1`}>{title}</p>
            <h3 className="text-lg font-bold text-gray-800">{value}</h3>
          </div>
          <div className={`${colors.bg} rounded-full p-1.5`}>
            {typeof icon === 'string' ? (
              <span className="text-base text-white">{icon}</span>
            ) : (
              <div className="text-white text-sm">{icon}</div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Large cards have solid colored background (like Medicare dashboard)
  if (large) {
    return (
      <motion.div
        className={`${colors.bg} rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-white min-h-[180px] flex flex-col justify-between`}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                {typeof icon === 'string' ? (
                  <span className="text-2xl">{icon}</span>
                ) : (
                  <div className="text-white text-xl">{icon}</div>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-white text-opacity-90 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-white text-opacity-80">{subtitle}</p>
            )}
          </div>
        </div>
        {/* Illustration area on the right */}
        <div className="mt-4 flex justify-end">
          <div className="w-24 h-24 bg-white bg-opacity-10 rounded-lg flex items-center justify-center">
            {typeof icon === 'string' ? (
              <span className="text-4xl opacity-50">{icon}</span>
            ) : (
              <div className="text-white text-3xl opacity-50">{icon}</div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Small cards have light background (like the quick stats)
  return (
    <motion.div
      className={`${colors.light} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.text} mb-1`}>{title}</p>
          <h3 className="text-xl font-bold text-gray-800">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.bg} rounded-full p-2`}>
          {typeof icon === 'string' ? (
            <span className="text-xl text-white">{icon}</span>
          ) : (
            <div className="text-white text-lg">{icon}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}


