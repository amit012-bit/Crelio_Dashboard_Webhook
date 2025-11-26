/**
 * Success Stats Component
 * 
 * Displays success statistics by specialty with:
 * - Specialty name
 * - Progress bar showing success rate
 * - Numerical value
 */

import { motion } from 'framer-motion'

interface SuccessStatsProps {
  data: Array<{
    specialty: string
    total: number
    completed: number
    successRate: number
  }>
}

export default function SuccessStats({ data }: SuccessStatsProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6"
      style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Success Stats</h3>
        <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
          <option>May 2024</option>
          <option>April 2024</option>
          <option>March 2024</option>
        </select>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data available</p>
        ) : (
          data.map((item, index) => (
            <motion.div
              key={index}
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.specialty}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {item.successRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-teal-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.successRate}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

