import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PatientTable from '@/components/PatientTable'
import { getDashboardStats, getActivityData } from '@/lib/api'

export default function Dashboard() {
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [statsRes, activityRes] = await Promise.all([
          getDashboardStats(),
          getActivityData(6),
        ])

        const statsData = (statsRes as any)?.data || statsRes
        const activityDataResult = (activityRes as any)?.data || []
        
        setActivityData(activityDataResult)

        
        console.log('📊 Dashboard Data Loaded:', {
          stats: statsData,
          activity: activityDataResult,
        })
      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error)
        console.error('Error details:', error?.response?.data || error?.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
  }, [])

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
        {/* <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
        </motion.div> */}

        {/* Bottom Section: Activity Chart + Success Stats + Doctor List + Appointment Table */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Online Appointment Table */}
            <motion.div variants={itemVariants}>
              <PatientTable />
            </motion.div>
            {/* Doctor List */}
            {/* <motion.div variants={itemVariants}>
              <DoctorList doctors={doctors.slice(0, 5)} />
            </motion.div> */}
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}

