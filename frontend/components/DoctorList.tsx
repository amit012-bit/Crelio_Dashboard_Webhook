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
      className="bg-gray-50 rounded-lg shadow-sm p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Doctor List</h3>
        <Link
          href="/doctors"
          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
        >
          <span className="text-gray-600 text-sm">→</span>
        </Link>
      </div>

      <div className="space-y-3">
        {doctors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No doctors available</p>
        ) : (
          doctors.map((doctor, index) => (
            <motion.div
              key={doctor._id}
              className="flex items-center justify-between py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {doctor.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{doctor.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{doctor.specialty}</p>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 ml-2">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
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

