import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { HiDownload, HiUserCircle, HiArrowLeft, HiDocument, HiBeaker, HiCurrencyDollar, HiOfficeBuilding, HiPhone, HiMail, HiLocationMarker, HiCalendar, HiIdentification, HiClipboardList, HiPlus, HiPrinter, HiCheckCircle } from 'react-icons/hi'
import { getPatientBillById, getPatientTests, getPatientReports, getPatientReportStatus } from '@/lib/api'

export default function PatientDetail() {
  const router = useRouter()
  const { id } = router.query

  const [patientBill, setPatientBill] = useState<any>(null)
  const [tests, setTests] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [reportStatus, setReportStatus] = useState<any[]>([])
  const [activeTestTab, setActiveTestTab] = useState<number>(0)
  const [activeInfoTab, setActiveInfoTab] = useState<number>(0)

  useEffect(() => {
    async function fetchPatientBill() {
      try {
        const data = await getPatientBillById(id);
        setPatientBill(data?.data || null);
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
        setTests(data?.data || []);
      } catch (error) {
        console.error("Error fetching patient tests:", error);
        setTests([]);
      }
    }
  
    if (id) {
      fetchPatientTests();
    }
  }, [id]);

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

  useEffect(() => {
    async function fetchPatientReportStatus() {
      try {
        const data = await getPatientReportStatus(id);
        setReportStatus(data?.data || []);
      } catch (error) {
        console.error("Error fetching patient report status:", error);
        setReportStatus([]);
      }
    }
  
    if (id) {
      fetchPatientReportStatus();
    }
  }, [id]);

  const billData = patientBill || {};
  const billInfoDetails = billData.billInfoDetails || [];
  const labReportDetails = billData.labReportDetails || [];
  // Extract reportDetails from all reportStatus entries, not just the first one
  const reportDetails = reportStatus.length > 0 
    ? reportStatus.flatMap((rs: any) => rs.reportDetails || [])
    : [];

  // Reset active tab when tests change
  useEffect(() => {
    if (billInfoDetails.length > 0 && activeTestTab >= billInfoDetails.length) {
      setActiveTestTab(0);
    }
  }, [billInfoDetails.length, activeTestTab]);

  // Helper to format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `₹${amount.toFixed(2)}`;
  };

  // Helper to extract initials from test name
  const getTestInitials = (testName: string | null | undefined, index: number): string => {
    if (!testName) return `T${index + 1}`;
    
    // Remove special characters and split into words
    const words = testName
      .replace(/[()&+]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // If it's a short acronym (2-4 chars), use it as is
    if (words.length === 1 && words[0].length <= 4) {
      return words[0].toUpperCase().substring(0, 3);
    }
    
    // Extract first letter of each significant word (ignore common words)
    const ignoreWords = ['and', '&', '+', 'the', 'of', 'for'];
    const initials = words
      .filter(word => !ignoreWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // Limit to 3 characters max
    return initials.substring(0, 3) || `T${index + 1}`;
  };

  // Helper to determine imaging type from test name
  const getImagingType = (testName: string | null | undefined): string | null => {
    if (!testName) return null;
    const normalized = testName.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    
    // MRI
    if (/\b(mri|magnetic resonance)\b/.test(normalized)) return 'MRI';
    // CT Scan
    if (/\b(ct|computed tomography|hrct)\b/.test(normalized)) return 'CT Scan';
    // Ultrasound
    if (/\b(ultrasound|usg|sonography|doppler)\b/.test(normalized)) return 'Ultrasound';
    // X-Ray
    if (/\b(x ray|x-ray|xray|radiography)\b/.test(normalized)) return 'X-Ray';
    // Echocardiography
    if (/\b(echo|echocardiography)\b/.test(normalized)) return 'Echocardiography';
    // Mammography
    if (/\b(mammography|mammogram)\b/.test(normalized)) return 'Mammography';
    // Endoscopy
    if (/\b(endoscopy|colonoscopy|bronchoscopy)\b/.test(normalized)) return 'Endoscopy';
    
    return null;
  };

  // Helper function to get timeline stages for a test
  const getTimelineStages = (test: any, testReport: any, testStatus: any, reportDetail: any) => {
    const stages = [
      {
        id: 'billGeneration',
        label: 'Bill Generation',
        icon: HiPlus,
        completed: true, // Always completed if test exists
        timestamp: billData?.billTime || null,
      },
      {
        id: 'sample',
        label: 'Sample Collection',
        icon: HiBeaker,
        completed: testStatus?.Status === 'Sample Received',
        timestamp: testStatus?.accessionDate || null,
      },
      {
        id: 'report',
        label: testReport?.status || reportDetail?.status || 'Report Generation',
        icon: HiDocument,
        completed: !!(testReport?.status || reportDetail),
        timestamp: testReport?.sampleDate || reportDetail?.['Sample Date'] || reportDetail?.['Report Date'] || null,
      },
      {
        id: 'print',
        label: 'Report Print',
        icon: HiPrinter,
        completed: testReport?.status === 'Report PDF (Webhook)',
        timestamp: reportDetail?.['Report Date'] || null,
      }
    ];
    return stages;
  };

  return (
    <Layout>
      <div className="p-2 space-y-2 bg-gray-50">
        {/* Patient Header - Compact with Basic Information - Sticky */}
        <motion.div
          className="sticky top-0 z-50 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl p-3 shadow-sm text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center justify-between gap-6">
            {/* Left: Arrow + Name (Vertically Centered) */}
            <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          onClick={() => router.push('/')}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white hover:text-white hover:bg-white hover:bg-opacity-20 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <HiArrowLeft className="w-5 h-5" />
        </motion.button>
              <div className="flex items-center gap-2">
                {billData['Patient Designation'] && (
                  <span className="text-sm text-white text-opacity-90">{billData['Patient Designation']}</span>
                )}
                <h1 className="text-2xl font-bold text-white m-0 p-0 leading-tight">{billData['Patient Name'] || 'N/A'}</h1>
              </div>
            </div>

            {/* Middle: Two Column Information Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-white text-opacity-80">Patient ID:</p>
                <p className="text-sm font-medium text-white">{billData['Patient Id'] || 'N/A'}</p>
            </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white text-opacity-80">Age:</p>
                <p className="text-sm font-medium text-white">{billData['Patient Age'] || 'N/A'}</p>
                </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white text-opacity-80">Gender:</p>
                <p className="text-sm font-medium text-white">{billData['Patient gender'] || billData.Gender || 'N/A'}</p>
                </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white text-opacity-80">Phone:</p>
                <p className="text-sm font-medium text-white flex items-center gap-1">
                  <HiPhone className="w-3 h-3" />
                  {billData.country_code && <span>+{billData.country_code} </span>}
                  {billData['Mobile Number'] || billData['Patient Contact'] || 'N/A'}
                </p>
              </div>
              {billData.labPatientId && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white text-opacity-80">Lab Patient ID:</p>
                  <p className="text-sm font-medium text-white">{billData.labPatientId}</p>
                </div>
              )}
              {billData.patient_email && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white text-opacity-80">Email:</p>
                  <p className="text-sm font-medium text-white flex items-center gap-1">
                    <HiMail className="w-3 h-3" />
                    {billData.patient_email}
                  </p>
                </div>
              )}
            </div>

            {/* Right: DOB and Bill ID - Vertically Stacked */}
            {(billData['Patient Dob'] || billData.billId || billData.bill_id) && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                {billData['Patient Dob'] && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-white text-opacity-80">Date of Birth:</p>
                    <p className="text-sm font-medium text-white">{billData['Patient Dob']}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white text-opacity-80">Bill ID:</p>
                  <p className="text-sm font-medium text-white">{billData.billId || billData.bill_id || 'N/A'}</p>
                </div>
              </div>
            )}
            </div>
          </motion.div>

        {/* Main Content Grid - Left: Pipeline, Right: Information */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-2">
          {/* Left Column - Progress Pipeline Only */}
          <div className="space-y-2">
            {/* Tests with Progress Pipeline */}
          <motion.div
              className="bg-white rounded-xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
          >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1.5 rounded-lg">
                <HiBeaker className="w-3 h-3" />
                Test Progress ({billInfoDetails.length})
              </h3>
              
              {/* Test Tabs - Only show if multiple tests */}
              {billInfoDetails.length > 1 && (
                <div className="flex gap-2 mb-2 border-b border-gray-200 overflow-x-auto">
                  {billInfoDetails.map((test: any, index: number) => {
                    const testName = test.testname || test.TestDetails?.TestName || `Test ${index + 1}`;
                    const initials = getTestInitials(testName, index);
                    return (
              <button
                        key={index}
                        onClick={() => setActiveTestTab(index)}
                        title={testName}
                        className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTestTab === index
                            ? 'text-purple-600 border-b-2 border-purple-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {initials}
              </button>
                    );
                  })}
            </div>
              )}

              {/* Active Test Pipeline */}
              {billInfoDetails.length > 0 ? (
                (() => {
                  const test = billInfoDetails[activeTestTab];
                  const testReport = reports.find((r: any) => r.testId === test.testId);
                  const testStatus = tests.find((t: any) => t.testID?.includes(test.testId));
                  const reportDetail = reportDetails.find((rd: any) => rd.reportID?.testID === test.testId);
                  const stages = getTimelineStages(test, testReport, testStatus, reportDetail);
                
                return (
                    <div className="border border-gray-200 rounded-lg p-2">
                    {/* Test Name */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">{test.testname || test.TestDetails?.TestName || 'N/A'}</h4>
                          {(getImagingType(test.testname || test.TestDetails?.TestName) || test.TestDetails?.category || test.TestDetails?.Department) && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase">
                              {getImagingType(test.testname || test.TestDetails?.TestName) || test.TestDetails?.category || test.TestDetails?.Department}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {test.TestDetails?.TestCode || test.testCode || 'N/A'} • {formatCurrency(test.testAmount)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                          <span className="font-medium">Imaging Type:</span>
                          <span>{getImagingType(test.testname || test.TestDetails?.TestName) || ''}</span>
                        </div>
                    </div>

                      {/* Progress Timeline Pipeline */}
                    <div className="relative">
                        {stages.map((stage, stageIndex) => {
                        const Icon = stage.icon;
                          const isLast = stageIndex === stages.length - 1;
                        const isCompleted = stage.completed;
                          const nextStage = stages[stageIndex + 1];
                        const isNextCompleted = nextStage?.completed || false;
                        
                        return (
                            <div key={stage.id} className="relative flex items-start gap-3 pb-4">
                            {/* Vertical Line */}
                            {!isLast && (
                              <div
                                  className={`absolute left-5 top-10 w-0.5 h-full ${
                                  isCompleted && isNextCompleted
                                    ? 'bg-green-500'
                                    : isCompleted
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                                  style={{ height: 'calc(100% - 0.5rem)' }}
                              />
                            )}
                            
                            {/* Icon Circle */}
                            <div
                                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                                isCompleted
                                    ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                                {isCompleted ? (
                                  <HiCheckCircle className="w-5 h-5" />
                                ) : (
                                  <Icon className="w-5 h-5" />
                                )}
                            </div>
                            
                            {/* Content */}
                              <div className="flex-1 pt-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                isCompleted ? 'text-gray-800' : 'text-gray-500'
                              }`}>
                                {stage.label}
                              </p>
                              {stage.timestamp ? (
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(stage.timestamp)}
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
                      {testReport?.reportBase64 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                              const byteCharacters = atob(testReport.reportBase64);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors w-full justify-center"
                        >
                          <HiDownload className="w-4 h-4" />
                            View Report PDF
                        </button>
                      </div>
                    )}
                  </div>
                );
                })()
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">No tests available</div>
              )}
            </motion.div>
          </div>

          {/* Right Column - All Other Information with Tabs */}
          <div className="space-y-2">
            {/* Information Tabs */}
            <div className="bg-white rounded-xl p-1 shadow-sm">
              <div className="flex gap-1 border-b border-gray-200">
                {['Patient & Tests', 'Billing & Organization', 'Additional Details'].map((tabName, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveInfoTab(index)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeInfoTab === index
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tabName}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-2">
              {/* Tab 1: Patient & Tests */}
              {activeInfoTab === 0 && (
                <>
                  {/* Test Details from Lab Reports */}
            {labReportDetails.length > 0 && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg">
                  <HiBeaker className="w-4 h-4" />
                  Test & Sample Details
                </h3>
                <div className="space-y-2">
                  {labReportDetails.map((report: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-xs text-gray-800">
                          {report.reportID?.testName || 'N/A'}
                        </h4>
                        {(getImagingType(report.reportID?.testName) || report.reportID?.['Test Type'] || report.reportID?.departmentId?.name) && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase">
                            {getImagingType(report.reportID?.testName) || report.reportID?.['Test Type'] || report.reportID?.departmentId?.name}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        {report.reportID?.testCode && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Test Code:</span>
                            <span>{report.reportID.testCode}</span>
                          </div>
                        )}
                        {report.reportID?.departmentId?.name && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Department:</span>
                            <span>{report.reportID.departmentId.name}</span>
                          </div>
                        )}
                        {report.reportID?.['Test Type'] && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Test Type:</span>
                            <span>{report.reportID['Test Type']}</span>
                          </div>
                        )}
                        {report.labReportId && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Lab Report ID:</span>
                            <span>{report.labReportId}</span>
                          </div>
                        )}
                        {report.reportID?.sampleId && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Sample Type:</span>
                            <span>{report.reportID.sampleId.name || report.reportID.sampleId.type || 'N/A'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Imaging Type:</span>
                          <span>{getImagingType(report.reportID?.testName) || ''}</span>
                        </div>
                        {report.collectedSampleId?.accessionNo && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Accession No:</span>
                            <span>{report.collectedSampleId.accessionNo}</span>
                          </div>
                        )}
                        {report.sampleDate && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Sample Date:</span>
                            <span>{formatDate(report.sampleDate)}</span>
                          </div>
                        )}
                        {report.collectedSampleId?.collectionTime && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Collection Time:</span>
                            <span>{formatDate(report.collectedSampleId.collectionTime)}</span>
                          </div>
                        )}
                        {report.reportDate && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Report Date:</span>
                            <span>{formatDate(report.reportDate)}</span>
                          </div>
                        )}
                        {report.collectedSampleId?.isRejected !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Rejected:</span>
                            <span className={report.collectedSampleId.isRejected ? 'text-red-600' : 'text-green-600'}>
                              {report.collectedSampleId.isRejected ? 'Yes' : 'No'}
                            </span>
                          </div>
                        )}
                        {report.collectedSampleId?.dismissed !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Dismissed:</span>
                            <span>{report.collectedSampleId.dismissed ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {report.collectedSampleId?.redraw !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Redraw:</span>
                            <span>{report.collectedSampleId.redraw ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {report.outsourcedReportFlag !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Outsourced:</span>
                            <span>{report.outsourcedReportFlag ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {report.comments && report.comments.trim() && (
                          <div className="col-span-3 flex items-center gap-1">
                            <span className="font-medium">Comments:</span>
                            <span>{report.comments}</span>
                          </div>
                        )}
                        {report.collectedSampleId?.comments && (
                          <div className="col-span-3 flex items-center gap-1">
                            <span className="font-medium">Sample Comments:</span>
                            <span>{report.collectedSampleId.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Address Information */}
            {(billData.address || billData.city || billData['Org City'] || billData.state || billData.zip_code || billData.areaOfResidance || billData.landmark) && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg">
                  <HiLocationMarker className="w-4 h-4" />
                  Address
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {billData.address && (
                    <div className="col-span-3 flex items-center gap-2">
                      <p className="text-xs text-gray-500">Street:</p>
                      <p className="font-medium text-gray-800">{billData.address}</p>
                    </div>
                  )}
                  {(billData.city || billData['Org City']) && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">City:</p>
                      <p className="font-medium text-gray-800">{billData.city || billData['Org City']}</p>
                    </div>
                  )}
                  {billData.state && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">State:</p>
                      <p className="font-medium text-gray-800">{billData.state}</p>
                    </div>
                  )}
                  {billData.zip_code && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">ZIP Code:</p>
                      <p className="font-medium text-gray-800">{billData.zip_code}</p>
                    </div>
                  )}
                  {billData.areaOfResidance && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Area:</p>
                      <p className="font-medium text-gray-800">{billData.areaOfResidance}</p>
                    </div>
                  )}
                  {billData.landmark && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Landmark:</p>
                      <p className="font-medium text-gray-800">{billData.landmark}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
                </>
              )}

              {/* Tab 2: Billing & Organization */}
              {activeInfoTab === 1 && (
                <>
                  {/* Billing Information */}
            <motion.div
              className="bg-white rounded-xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg">
                <HiCurrencyDollar className="w-4 h-4" />
                Billing Information
              </h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Total Amount:</p>
                  <p className="font-medium text-gray-800">{formatCurrency(billData.billTotalAmount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Due Amount:</p>
                  <p className="font-medium text-gray-800">{formatCurrency(billData.dueAmount)}</p>
                </div>
                {billData.billAdvance !== undefined && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Advance:</p>
                    <p className="font-medium text-gray-800">{formatCurrency(billData.billAdvance)}</p>
                  </div>
                )}
                {billData.billConcession !== undefined && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Concession:</p>
                    <p className="font-medium text-gray-800">{formatCurrency(billData.billConcession)}</p>
                  </div>
                )}
                {billData.Status && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Status:</p>
                    <p className="font-medium text-gray-800">{billData.Status}</p>
                  </div>
                )}
                {billData.orderNumber && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Order Number:</p>
                    <p className="font-medium text-gray-800">{billData.orderNumber}</p>
                  </div>
                )}
                {billData.billTime && (
                  <div className="col-span-3 flex items-center gap-2">
                    <p className="text-xs text-gray-500">Bill Time:</p>
                    <p className="font-medium text-gray-800 text-xs">{formatDate(billData.billTime)}</p>
                  </div>
                )}
                {billData.billPaymentStatus !== undefined && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Payment Status:</p>
                    <p className={`font-medium ${billData.billPaymentStatus === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {billData.billPaymentStatus === 1 ? 'Paid' : 'Unpaid'}
                    </p>
                  </div>
                )}
                {billData.billPaymentMode && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Payment Mode:</p>
                    <p className="font-medium text-gray-800">{billData.billPaymentMode}</p>
                  </div>
                )}
                {billData.billComments && (
                  <div className="col-span-3 flex items-center gap-2">
                    <p className="text-xs text-gray-500">Comments:</p>
                    <p className="font-medium text-gray-800">{billData.billComments}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Lab & Organization */}
            {(billData.labId || billData.orgId) && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg">
                  <HiOfficeBuilding className="w-4 h-4" />
                  Lab & Organization
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {billData.labId?.labName && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">Lab Name:</p>
                        <p className="font-medium text-gray-800">{billData.labId.labName} (ID: {billData.labId.labId})</p>
                      </div>
                      {billData.orgId?.orgFullName && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">Organization:</p>
                          <p className="font-medium text-gray-800">{billData.orgId.orgFullName} (ID: {billData.orgId.orgId})</p>
                        </div>
                      )}
                    </div>
                  )}
                  {billData['Org email'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Org Email:</p>
                      <p className="font-medium text-gray-800">{billData['Org email']}</p>
                    </div>
                  )}
                  {billData['Org Contact'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Org Contact:</p>
                      <p className="font-medium text-gray-800">{billData['Org Contact']}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Referral Information */}
            {billData.billReferral && billData.billReferral !== 'SELF' && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xs font-semibold mb-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg">Referral Information</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2 flex items-center gap-2">
                    <p className="text-xs text-gray-500">Referral Doctor:</p>
                    <p className="font-medium text-gray-800">{billData.billReferral}</p>
                  </div>
                  {billData['Referral Type'] && billData['Referral Type'] !== 'None (Default)' && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Type:</p>
                      <p className="font-medium text-gray-800">{billData['Referral Type']}</p>
                    </div>
                  )}
                  {billData['Referral Contact'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Contact:</p>
                      <p className="font-medium text-gray-800">{billData['Referral Contact']}</p>
                    </div>
                  )}
                  {billData['Referral Email'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Email:</p>
                      <p className="font-medium text-gray-800">{billData['Referral Email']}</p>
                    </div>
                  )}
                  {billData['Referral Address'] && (
                    <div className="col-span-2 flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Address:</p>
                      <p className="font-medium text-gray-800">{billData['Referral Address']}</p>
                    </div>
                  )}
                  {billData['Referral City'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral City:</p>
                      <p className="font-medium text-gray-800">{billData['Referral City']}</p>
                    </div>
                  )}
                  {billData['Referral pincode'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Pincode:</p>
                      <p className="font-medium text-gray-800">{billData['Referral pincode']}</p>
                    </div>
                  )}
                  {billData['Referral RegNo'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Reg No:</p>
                      <p className="font-medium text-gray-800">{billData['Referral RegNo']}</p>
                    </div>
                  )}
                  {billData['Referral comments'] && (
                    <div className="col-span-2 flex items-center gap-2">
                      <p className="text-xs text-gray-500">Referral Comments:</p>
                      <p className="font-medium text-gray-800">{billData['Referral comments']}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Report Status Details */}
            {(reportStatus.length > 0 || reportDetails.length > 0) && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg">
                  <HiDocument className="w-4 h-4" />
                  Report Status Details
                </h3>
                {reportDetails.length > 0 ? (
                  <div className="space-y-2">
                    {reportDetails.map((rd: any, index: number) => {
                      // Find the parent reportStatus for this reportDetail
                      const parentStatus = reportStatus.find((rs: any) => 
                        rs.reportDetails?.some((rpd: any) => rpd === rd || rpd['Report Id'] === rd['Report Id'])
                      );
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-gray-800">
                                  {rd['Test Name'] || rd.testName || 'N/A'}
                                </h4>
                                {(getImagingType(rd['Test Name'] || rd.testName) || rd['Test Type'] || rd.testType) && (
                                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase">
                                    {getImagingType(rd['Test Name'] || rd.testName) || rd['Test Type'] || rd.testType}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {rd['Report Id'] || rd.reportID?.testID || rd.reportIdNumber ? (
                                  <>Report ID: {rd['Report Id'] || rd.reportID?.testID || rd.reportIdNumber}</>
                                ) : null}
                                {rd.labReportId && (
                                  <> | Lab Report ID: {rd.labReportId}</>
                                )}
                                {rd.testCode && (
                                  <> | Test Code: {rd.testCode}</>
                                )}
                              </p>
                              {(parentStatus?.status || rd.status) && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Status: <span className="font-medium">{parentStatus?.status || rd.status}</span>
                                </p>
                              )}
                            </div>
                            {(rd.billPaymentStatus !== undefined || rd.billPaymentStatus !== null) && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                rd.billPaymentStatus === 1 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {rd.billPaymentStatus === 1 ? 'Paid' : 'Unpaid'}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-2">
                            {(rd['Sample Date'] || rd.sampleDate) && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Sample Date:</span>
                                <span>{formatDate(rd['Sample Date'] || rd.sampleDate)}</span>
                              </div>
                            )}
                            {(rd['Accession Date'] || rd.accessionDate) && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Accession Date:</span>
                                <span>{formatDate(rd['Accession Date'] || rd.accessionDate)}</span>
                              </div>
                            )}
                            {(rd['Report Date'] || rd.reportDate) && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Report Date:</span>
                                <span>{formatDate(rd['Report Date'] || rd.reportDate)}</span>
                              </div>
                            )}
                            {(rd['Approval Date'] || rd.approvalDate) && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Approval Date:</span>
                                <span>{formatDate(rd['Approval Date'] || rd.approvalDate)}</span>
                              </div>
                            )}
                            {(rd.sampleID || rd.sampleId) && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Sample ID:</span>
                                <span>{rd.sampleID || rd.sampleId}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Imaging Type:</span>
                              <span>{getImagingType(rd['Test Name'] || rd.testName) || ''}</span>
                            </div>
                            {rd.billPaymentMode && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Payment Mode:</span>
                                <span>{rd.billPaymentMode}</span>
                              </div>
                            )}
                          </div>

                          {/* Signing Doctor */}
                          {(rd['Signing Doctor'] || rd.signingDoctor) && 
                           Array.isArray(rd['Signing Doctor'] || rd.signingDoctor) && 
                           (rd['Signing Doctor'] || rd.signingDoctor).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">Signing Doctor:</p>
                              {(rd['Signing Doctor'] || rd.signingDoctor).map((doc: any, docIndex: number) => {
                                const doctorName = typeof doc === 'string' 
                                  ? doc 
                                  : (Object.values(doc)[0] as string);
                                return (
                                  <p key={docIndex} className="text-xs text-gray-700">
                                    {doctorName || 'N/A'}
                                  </p>
                                );
                              })}
                            </div>
                          )}

                          {/* Report Format and Values */}
                          {rd.reportFormatAndValues && Array.isArray(rd.reportFormatAndValues) && rd.reportFormatAndValues.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">Test Values:</p>
                              <div className="space-y-1">
                                {rd.reportFormatAndValues.slice(0, 5).map((rfv: any, rfvIndex: number) => {
                                  if (typeof rfv.reportFormat === 'object' && !Array.isArray(rfv.reportFormat)) {
                                    return (
                                      <div key={rfvIndex} className="flex justify-between text-xs">
                                        <span className="text-gray-600">{rfv.reportFormat.testName || 'N/A'}:</span>
                                        <span className={`font-medium ${rfv.highlight ? 'text-red-600' : 'text-gray-800'}`}>
                                          {rfv.value || 'N/A'} {rfv.reportFormat.testUnit || ''}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return <div key={rfvIndex}></div>;
                                })}
                              </div>
                      </div>
                    )}
                  </div>
                );
              })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No report details available
                  </div>
                )}
              </motion.div>
            )}
                </>
              )}

              {/* Tab 3: Additional Details */}
              {activeInfoTab === 2 && (
                <>
                  {/* Additional Information */}
            {(billData.currency || billData.ssnNumber || billData.passportNumber || billData.ethnicity || billData.race || billData.alternateContact || billData.alternateEmail || billData['Patient Alternate Contact'] || billData.patient_type || billData.patient_email || billData.docId || billData['Billed Username'] || billData['Billed UserId']) && (
              <motion.div
                className="bg-white rounded-xl p-3 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 bg-gradient-to-r from-slate-500 to-gray-600 text-white px-3 py-2 rounded-lg">
                  <HiClipboardList className="w-4 h-4" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {billData.currency && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Currency:</p>
                      <p className="font-medium text-gray-800">{billData.currency}</p>
                    </div>
                  )}
                  {billData.patient_type && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Patient Type:</p>
                      <p className="font-medium text-gray-800">{billData.patient_type}</p>
                    </div>
                  )}
                  {billData.patient_email && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Email:</p>
                      <p className="font-medium text-gray-800">{billData.patient_email}</p>
                    </div>
                  )}
                  {(billData.alternateContact || billData['Patient Alternate Contact']) && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Alternate Contact:</p>
                      <p className="font-medium text-gray-800">{billData.alternateContact || billData['Patient Alternate Contact']}</p>
                    </div>
                  )}
                  {billData.alternateEmail && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Alternate Email:</p>
                      <p className="font-medium text-gray-800">{billData.alternateEmail}</p>
                    </div>
                  )}
                  {billData.ssnNumber && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">SSN Number:</p>
                      <p className="font-medium text-gray-800">{billData.ssnNumber}</p>
                    </div>
                  )}
                  {billData.passportNumber && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Passport Number:</p>
                      <p className="font-medium text-gray-800">{billData.passportNumber}</p>
                    </div>
                  )}
                  {billData.ethnicity && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Ethnicity:</p>
                      <p className="font-medium text-gray-800">{billData.ethnicity}</p>
                    </div>
                  )}
                  {billData.race && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Race:</p>
                      <p className="font-medium text-gray-800">{billData.race}</p>
                    </div>
                  )}
                  {billData.docId && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Doctor ID:</p>
                      <p className="font-medium text-gray-800">{billData.docId}</p>
                    </div>
                  )}
                  {billData['Billed Username'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Billed By:</p>
                      <p className="font-medium text-gray-800">{billData['Billed Username']}</p>
                </div>
              )}
                  {billData['Billed UserId'] && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Billed User ID:</p>
                      <p className="font-medium text-gray-800">{billData['Billed UserId']}</p>
                </div>
              )}
            </div>
          </motion.div>
            )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
