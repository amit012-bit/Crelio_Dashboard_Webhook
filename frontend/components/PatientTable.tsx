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
      className="bg-white rounded-lg shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Online Appointment</h3>
        <Link
          href="/patients"
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          View
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">No.</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Date & Time</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Age</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Gender</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Appoint for</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
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
                  <td className="py-3 px-4 text-sm text-gray-700">{String(index + 1).padStart(2, '0')}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {patient.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
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
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {patient.age || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {patient.gender || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {patient.assignedDoctor?.name || 'Not Assigned'}
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
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

