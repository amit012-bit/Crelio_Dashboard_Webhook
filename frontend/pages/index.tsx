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
import { getDashboardStats, getTodayPatients, getActivityData, getSuccessStats, getAllDoctors } from '@/lib/api'
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
        const [statsRes, patientsRes, activityRes, successRes, doctorsRes] = await Promise.all([
          getDashboardStats(),
          getTodayPatients(),
          getActivityData(6),
          getSuccessStats(),
          getAllDoctors(),
        ])

        // API functions return response.data, which is { success: true, data: {...} }
        // So we need to access the nested 'data' property
        const statsData = (statsRes as any)?.data || statsRes
        const patientsData = (patientsRes as any)?.data || (patientsRes as any) || []
        const activityDataResult = (activityRes as any)?.data || (activityRes as any) || []
        const successData = (successRes as any)?.data || (successRes as any) || []
        const doctorsData = (doctorsRes as any)?.data || (doctorsRes as any) || []
        
        setStats(statsData)
        setTodayPatients(patientsData)
        setActivityData(activityDataResult)
        setSuccessStats(successData)
        setDoctors(doctorsData)
        
        // Debug logging (remove in production)
        console.log('📊 Dashboard Data Loaded:', {
          stats: statsData,
          patients: patientsData,
          activity: activityDataResult,
          success: successData,
          doctors: doctorsData,
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
        className="p-4 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Section: Welcome Banner */}
        <motion.div variants={itemVariants}>
          {/* Welcome Banner - Ultra compact, minimal height */}
          <motion.div
            className="bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-lg px-3 text-white shadow-sm"
            style={{ height: '60px', paddingTop: '8px', paddingBottom: '8px' }}
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 pr-2">
                <h1 className="text-2xl font-bold leading-tight">Hello Admin!</h1>
                <p className="text-white text-opacity-95 text-[20px] leading-tight line-clamp-1 mt-0.5">
                  Here are your important task, Updates and alerts. You can set your in app preferences here.
                </p>
              </div>
              <div className="hidden md:block flex-shrink-0">
                {/* Illustration - healthcare professionals, minimal size */}
                {/* <div className="w-5 h-5 flex items-center justify-center">
                  <div className="flex space-x-0.5">
                    <span className="text-lg">👨‍⚕️</span>
                    <span className="text-lg">👩‍⚕️</span>
                    <span className="text-lg">👨‍⚕️</span>
                  </div>
                </div> */}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* All Stats Cards - 5 cards in one row, equal size, full width */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

