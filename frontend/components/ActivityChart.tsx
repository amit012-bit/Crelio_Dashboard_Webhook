/**
 * Activity Chart Component
 * 
 * Displays a line chart showing:
 * - Consultation trends over time
 * - Patient registration trends over time
 * 
 * Uses Recharts for visualization.
 */

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ActivityChartProps {
  data: any[]
}

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
        <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
          <option>Last 6 Month</option>
          <option>Last 3 Month</option>
          <option>Last Year</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="consultations"
            stroke="#14b8a6"
            strokeWidth={2}
            name="Consultation"
            dot={{ fill: '#14b8a6' }}
          />
          <Line
            type="monotone"
            dataKey="patients"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Patients"
            dot={{ fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

