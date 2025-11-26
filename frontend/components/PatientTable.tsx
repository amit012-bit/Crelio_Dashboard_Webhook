/**
 * Patient Table Component
 * 
 * Displays a table of recent patients/appointments with:
 * - Patient information
 * - Date & Time
 * - Age and Gender
 * - Assigned doctor
 * - Actions (edit, delete)
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'

interface Patient {
  _id: string
  name: string
  patientId: string
  age?: number
  gender?: string
  status?: string
  registrationDate?: string
  assignedDoctor?: {
    name: string
    specialty: string
  }
}

interface PatientTableProps {
  patients: Patient[]
}

export default function PatientTable({ patients }: PatientTableProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6"
      style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800">Online Appointment</h3>
        <Link
          href="/patients"
          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">No.</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Name</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Date & Time</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Age</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Gender</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Appoint for</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 text-xs">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((patient, index) => (
                <motion.tr
                  key={patient._id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="py-2 px-3 text-xs text-gray-700">{String(index + 1).padStart(2, '0')}</td>
                  <td className="py-2 px-3 text-xs font-medium text-gray-800">
                    {patient.name}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600">
                    {patient.registrationDate
                      ? (() => {
                          const date = new Date(patient.registrationDate)
                          const day = date.getDate()
                          const month = format(date, 'MMM')
                          const time = format(date, 'h:mma').toLowerCase()
                          return `${day} ${month} ${time}`
                        })()
                      : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    {patient.age || 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    {patient.gender || 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600">
                    {patient.assignedDoctor?.name || 'Not Assigned'}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-1">
                      <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

