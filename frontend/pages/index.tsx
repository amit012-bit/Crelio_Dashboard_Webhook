/**
 * Dashboard Home Page
 * 
 * This is the main dashboard page that displays:
 * - Welcome banner
 * - Key statistics cards
 * - Activity chart
 * - Success stats
 * - Doctor list
 * - Recent appointments/patients
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import StatsCard from '@/components/StatsCard'
import ActivityChart from '@/components/ActivityChart'
import SuccessStats from '@/components/SuccessStats'
import DoctorList from '@/components/DoctorList'
import PatientTable from '@/components/PatientTable'
import { getDashboardStats, getTodayPatients, getAllPatients, getActivityData, getSuccessStats, getAllDoctors } from '@/lib/api'
import { 
  HiClipboardList, 
  HiUsers, 
  HiBell, 
  HiHome, 
  HiUserCircle 
} from 'react-icons/hi'

export default function Dashboard() {
  // State for dashboard data
  const [stats, setStats] = useState<any>(null)
  const [todayPatients, setTodayPatients] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [successStats, setSuccessStats] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        // Use getAllPatients instead of getTodayPatients to show all recent patients
        const [statsRes, patientsRes, activityRes, successRes, doctorsRes] = await Promise.all([
          getDashboardStats(),
          getAllPatients({ page: 1, limit: 50 }), // Get all recent patients (not just today's)
          getActivityData(6),
          getSuccessStats(),
          getAllDoctors(),
        ])

        // API functions return response.data from axios
        // Stats API returns: { success: true, data: {...} }
        // Patients API returns: { success: true, count: number, data: [...] } or { success: true, data: [...] }
        // Other APIs return: { success: true, data: [...] }
        const statsData = (statsRes as any)?.data || statsRes
        // Extract patients array from response (handle both getAllPatients and getTodayPatients format)
        const patientsData = (patientsRes as any)?.data || (patientsRes as any)?.data?.data || []
        // Extract activity data array
        const activityDataResult = (activityRes as any)?.data || []
        // Extract success stats array
        const successData = (successRes as any)?.data || []
        // Extract doctors array
        const doctorsData = (doctorsRes as any)?.data || []
        
        setStats(statsData)
        setTodayPatients(patientsData)
        setActivityData(activityDataResult)
        setSuccessStats(successData)
        setDoctors(doctorsData)
        
        // Debug logging (remove in production)
        console.log('📊 Dashboard Data Loaded:', {
          stats: statsData,
          patients: patientsData,
          patientsCount: patientsData?.length || 0,
          activity: activityDataResult,
          success: successData,
          doctors: doctorsData,
        })
        console.log('🔍 Raw API Responses:', {
          patientsRes: patientsRes,
          doctorsRes: doctorsRes,
        })
      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error)
        console.error('Error details:', error?.response?.data || error?.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        className="p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Section: Welcome Banner */}
        <motion.div variants={itemVariants}>
          {/* Welcome Banner - Gradient teal to blue */}
          <motion.div
            className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl px-8 py-6 text-white"
            style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">Hello Admin!</h1>
                <p className="text-white text-opacity-95 text-base leading-relaxed">
                  Here are your important task, Updates and alerts. You can set your in app preferences here.
                </p>
              </div>
              <div className="hidden md:block flex-shrink-0 ml-8">
                {/* Medical professionals illustration */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍⚕️</span>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👩‍⚕️</span>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍⚕️</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* All Stats Cards - 5 cards in single row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatsCard
            title="New Tasks"
            value={stats?.reports?.today || 0}
            subtitle=""
            color="blue"
            icon={<HiClipboardList />}
            small
          />
          <StatsCard
            title="New Patients"
            value={stats?.patients?.today || 0}
            subtitle=""
            color="blue"
            icon={<HiUsers />}
            small
          />
          <StatsCard
            title="Notification"
            value={25}
            subtitle=""
            color="red"
            icon={<HiBell />}
            small
          />
          <StatsCard
            title="Total Patients"
            value={stats?.patients?.total || 0}
            subtitle=""
            color="red"
            icon={<HiHome />}
            small
          />
          <StatsCard
            title="Total Staffs"
            value={stats?.doctors?.total || 0}
            subtitle=""
            color="orange"
            icon={<HiUserCircle />}
            small
          />
        </motion.div>

        {/* Bottom Section: Activity Chart + Success Stats + Doctor List + Appointment Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Activity Chart */}
            <motion.div variants={itemVariants}>
              <ActivityChart data={activityData} />
            </motion.div>

            {/* Doctor List */}
            <motion.div variants={itemVariants}>
              <DoctorList doctors={doctors.slice(0, 5)} />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Success Stats */}
            <motion.div variants={itemVariants}>
              <SuccessStats data={successStats} />
            </motion.div>

            {/* Online Appointment Table */}
            <motion.div variants={itemVariants}>
              <PatientTable patients={todayPatients.slice(0, 5)} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}

