/**
 * Doctor List Component
 * 
 * Displays a list of doctors with:
 * - Profile image/avatar
 * - Name
 * - Specialty
 * - Action menu
 */

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Doctor {
  _id: string
  name: string
  specialty: string
  profileImage?: string
  status?: string
}

interface DoctorListProps {
  doctors: Doctor[]
}

export default function DoctorList({ doctors }: DoctorListProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6"
      style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800">Doctor List</h3>
        <Link
          href="/doctors"
          className="w-7 h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm border border-gray-200"
        >
          <span className="text-gray-600 text-sm">→</span>
        </Link>
      </div>

      <div className="space-y-2">
        {doctors.length === 0 ? (
          <p className="text-gray-500 text-center py-3 text-xs">No doctors available</p>
        ) : (
          doctors.map((doctor, index) => (
            <motion.div
              key={doctor._id}
              className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded-lg px-2 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {doctor.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs">{doctor.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{doctor.specialty}</p>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 ml-2">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

