import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { getAllPatients } from '@/lib/api'
import { HiSearch, HiCalendar } from 'react-icons/hi'

interface Patient {
  // add only what you use, not everything
  [key: string]: any; // allows extra keys safely
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export default function PatientTable() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState(getTodayDate())
  const [toDate, setToDate] = useState(getTodayDate())
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleRowClick = (patient: Patient) => {
    const billId = patient.request?.['billId'] 
    router.push(`/patient/${billId}`)
  }

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params: any = { page: 1, limit: 50 }
      
      // Add search parameter if provided
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim()
      }
      
      // Add date range parameters
      if (fromDate) {
        params.fromDate = fromDate
      }
      if (toDate) {
        params.toDate = toDate
      }
      
      const res: any = await getAllPatients(params)
      setLoading(false)
      
      // Handle response structure: res.data is the array of patients
      const patientsData = res?.data || []
      setPatients(Array.isArray(patientsData) ? patientsData : [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      setLoading(false)
      setPatients([])
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [debouncedSearchQuery, fromDate, toDate])
  
  return (
    <motion.div
      className="bg-white rounded-2xl p-6"
      style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Online Appointment</h3>
      </div>

      {/* Search and Date Filter Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by patient name, ID, bill ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* From Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiCalendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate}
            title="From Date"
            className="block w-[160px] pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* To Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiCalendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            title="To Date"
            className="block w-[160px] pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg hide-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">No.</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Patient ID</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Patient Details</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Org Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Bill ID</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Bill Amount</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Test Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500 text-xs">
                  Loading...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500 text-xs">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((patient, index) => {
                // Safely get gender
                const gender = patient.request?.['Patient gender']
                const genderDisplay = gender 
                  ? (Array.isArray(gender) 
                      ? gender[0]?.toUpperCase() 
                      : String(gender).charAt(0).toUpperCase())
                  : 'N/A'

                return (
                  <motion.tr
                    key={patient._id || index}
                    onClick={() => handleRowClick(patient)}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-2 px-3 text-xs text-gray-700">{String(index + 1).padStart(2, '0')}</td>
                    <td className="py-2 px-3 text-xs text-gray-700">{patient.request?.['Patient Id'] || 'N/A'}</td>
                    <td className="py-2 px-3 text-xs font-medium text-gray-800">
                      {patient.request?.['Patient Name']}
                      <br />
                      <span className="text-xs text-gray-500">{patient.request?.['Patient Age'] || 'N/A'} - {genderDisplay}</span>
                    </td>
                  <td className="py-2 px-3 text-xs text-gray-700">{patient.request?.orgId?.['orgFullName'] || 'N/A'}</td>
                  <td className="py-2 px-3 text-xs text-gray-700">{patient.request?.['billId'] || 'N/A'}</td>
                  <td className="py-2 px-3 text-xs text-gray-700">{patient.request?.['billTotalAmount'] || 'N/A'}</td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    <span
                      className="block max-w-[180px] truncate"
                      title={
                        patient.request?.billInfoDetails
                          ?.map((bill: any) => bill.TestDetails.TestName)
                          .join(', ')
                      }
                    >
                      {patient.request?.billInfoDetails
                        ?.map((bill: any) => bill.TestDetails.TestName)
                        .join(', ') || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    <span className="px-1 py-1 text-xs rounded-full font-medium bg-yellow-300">
                      Pending
                    </span>
                  </td>
                  </motion.tr>
                )
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

