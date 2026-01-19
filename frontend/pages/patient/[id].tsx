import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { HiDownload, HiX, HiUserCircle, HiArrowLeft } from 'react-icons/hi'
import { getPatientBillById, getPatientTests } from '@/lib/api'

export default function PatientDetail() {
  const router = useRouter()
  const { id } = router.query

  const [patientBill, setPatientBill] = useState<any>(null)
  const [tests, setTests] = useState<[]>([])
  const [reports, setReports] = useState<[]>([])

  useEffect(() => {
    async function fetchPatientBill() {
      try {
        const data = await getPatientBillById(id);
        setPatientBill(data || null);
      } catch (error) {
        console.error('Error fetching patient bill:', error);
        setPatientBill(null);
      }
    }
  
    if (id) {
      fetchPatientBill();
    }
  }, [id]);

  
  useEffect(() => {
    async function fetchPatientTests() {
      try {
        const data = await getPatientTests(id);
  
        const billTests = patientBill?.data?.billInfoDetails || [];
        const statusTests = data?.data || [];
  
        const statusMap = new Map(
          statusTests.map((t: any) => [t.testID?.[0], t.Status])
        );
  
        const finalTests = billTests.map((test: any) => ({
          ...test,
          status: statusMap.get(test.testId) || "Not Collected",
        }));
  
        setTests(finalTests);
      } catch (error) {
        console.error("Error fetching patient tests:", error);
        setTests([]);
      }
    }
  
    if (id && patientBill) {
      fetchPatientTests();
    }
  }, [id, patientBill]);
  


  console.log(tests, 'tests after fetch--------------')
 
  const [activeTab, setActiveTab] = useState<'future' | 'past' | 'planned'>('future')

  return (
    <Layout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Back Button */}
        <motion.button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <HiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Bill List</span>
        </motion.button>

        {/* Top Section: Patient Profile, General Info */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
          {/* Patient Profile Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4">
                    <HiUserCircle className="w-full h-full text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{patientBill?.data?.['Patient Name'] || 'N/A'}</h2>
              <p className="text-sm text-gray-600 mb-1">+91 {patientBill?.data?.['Mobile Number'] || 'N/A'}</p>
            </div>
          </motion.div>

          {/* General Information Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">General information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Patient ID:</p>
                  <p className="text-sm font-medium text-gray-800">{patientBill?.data?.['Patient Id'] || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bill ID:</p>
                  <p className="text-sm font-medium text-gray-800">{patientBill?.data?.['billId'] || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Age:</p>
                  <p className="text-sm font-medium text-gray-800">{patientBill?.data?.['Patient Age'] || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gender:</p>
                  <p className="text-sm font-medium text-gray-800">{patientBill?.data?.['Patient gender'] || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Future Visits Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('future')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'future'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tests ({tests?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports ({patientBill?.['Patient Reports']?.length || 0})
              </button>
            </div>

            {/* Visit List */}
            <div className="space-y-3">
              {activeTab === 'future' && tests?.length > 0 && tests?.map((test: any) => (
                <div
                  key={test?.id}
                  className={`p-4 rounded-lg border-l-4`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{test.testname}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium ${test.status === 'Sample Received' ? 'text-green-500' : 'text-red-500'}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeTab === 'past' && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Past visits data will be displayed here
                </div>
              )}
              {activeTab === 'planned' && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Planned treatments data will be displayed here
                </div>
              )}
            </div>
          </motion.div>

          {/* Files Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Files</h3>
              <button className="px-4 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                <HiDownload className="inline-block w-4 h-4 mr-1" />
                DOWNLOAD
              </button>
            </div>
            <div className="space-y-2">
              {patientBill?.['Patient Files']?.map((file: any, index: number) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      <HiDownload className="w-4 h-4" />
                    </button>
                    {index === 1 && (
                      <button className="text-red-600 hover:text-red-700">
                        <HiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

