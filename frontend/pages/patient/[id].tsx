import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { HiDownload, HiPlus, HiUserCircle, HiArrowLeft, HiPrinter, HiBeaker, HiDocument } from 'react-icons/hi'
import { getPatientBillById, getPatientTests, getPatientReports } from '@/lib/api'

export default function PatientDetail() {
  const router = useRouter()
  const { id } = router.query

  const [patientBill, setPatientBill] = useState<any>(null)
  const [tests, setTests] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])

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
  
        const statusMap = statusTests.reduce((acc: any, t: any) => {
          const key = t.testID?.[0];
          if (key) {
            acc[key] = t; // store entire object (or t.Status if you want only status)
          }
          return acc;
        }, {});
        
  
        const finalTests = billTests.map((test: any) => ({
          ...test,
          status: statusMap[test.testId]?.Status || "Not Collected",
          timestamp: statusMap[test.testId]?.accessionDate || null,
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

  useEffect(() => {
    async function fetchPatientReports() {
      try {
        const data = await getPatientReports(id);
        setReports(data?.data || []);
      } catch (error) {
        console.error("Error fetching patient reports:", error);
        setReports([]);
      }
    }
  
    if (id) {
      fetchPatientReports();
    }
  }, [id]);

  console.log(patientBill, 'patientBill');
  console.log(tests, 'tests');
  console.log(reports, 'reports');
 
  const [activeTab, setActiveTab] = useState<'tests' | 'reports' >('tests')

  // Helper function to get timeline stages for a test
  const getTimelineStages = (test: any, report: any) => {
    const stages = [
      {
        id: 'billGeneration',
        label: 'Bill Generation',
        icon: HiPlus,
        completed: true, // Always completed if test exists
        timestamp: patientBill?.data?.billTime || null,
      },
      {
        id: 'sample',
        label: 'Sample Collection',
        icon: HiBeaker,
        completed: test.status === 'Sample Received',
        timestamp: test.timestamp || null,
      },
      {
        id: 'report',
        label: report?.status || 'Report Generation',
        icon: HiDocument,
        completed: report?.status ? true : false,
        timestamp: report?.sampleDate || null,
      },
      {
        id: 'print',
        label: 'Report Print',
        icon: HiPrinter,
        completed: report?.status === 'Report PDF (Webhook)',
        timestamp: null,
      }
    ];
    return stages;
  };

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
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {/* Tests Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('tests')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tests'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tests ({tests?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports ({patientBill?.['Patient Reports']?.length || 0})
              </button>
            </div>

            {/* Tests List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'tests' && tests?.length > 0 && tests?.map((test: any) => {
                // Find matching report for this test
                const report = reports.find((r: any) => r.testId === test.testId);
                const stages = getTimelineStages(test, report);
                
                return (
                  <div
                    key={test?.id || test?.testId}
                    className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    {/* Test Name */}
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-800">{test.testname}</p>
                    </div>

                    {/* Vertical Timeline */}
                    <div className="relative">
                      {stages.map((stage, index) => {
                        const Icon = stage.icon;
                        const isLast = index === stages.length - 1;
                        const isCompleted = stage.completed;
                        const nextStage = stages[index + 1];
                        const isNextCompleted = nextStage?.completed || false;
                        
                        return (
                          <div key={stage.id} className="relative flex items-start gap-4 pb-6">
                            {/* Vertical Line */}
                            {!isLast && (
                              <div
                                className={`absolute left-4 top-12 w-0.5 h-full ${
                                  isCompleted && isNextCompleted
                                    ? 'bg-green-500'
                                    : isCompleted
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                                style={{ height: 'calc(100% - 1rem)' }}
                              />
                            )}
                            
                            {/* Icon Circle */}
                            <div
                              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pt-1">
                              <p className={`text-sm font-medium ${
                                isCompleted ? 'text-gray-800' : 'text-gray-500'
                              }`}>
                                {stage.label}
                              </p>
                              {stage.timestamp ? (
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(stage.timestamp).toLocaleString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                    day: 'numeric',
                                    month: 'short',
                                    year: '2-digit'
                                  }).replace(',', '')}
                                </p>
                              ) : !isCompleted ? (
                                <p className="text-xs text-gray-400 mt-1">Pending</p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View Report Button */}
                    {report?.reportBase64 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // Decode base64 and open in new window
                            const byteCharacters = atob(report.reportBase64);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <HiDownload className="w-4 h-4" />
                          View Report
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {activeTab === 'tests' && (!tests || tests.length === 0) && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tests available for this patient
                </div>
              )}
              {activeTab === 'reports' && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Reports data will be displayed here
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

