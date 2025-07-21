"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  X,
  CreditCard,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  User,
  FileText,
  ZoomIn,
} from "lucide-react"
import Link from "next/link"

// Enhanced interfaces for comprehensive appointment and payment management
interface AppointmentDetails {
  _id: string
  date: string
  startTime: string
  endTime: string
  type: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  payment: {
    amount: number
    status: "pending" | "paid" | "partial" | "refunded"
    method: "cash" | "card" | "insurance" | "not_specified"
    paidAmount?: number
  }
  service: {
    name: string
    price: number
  }
  therapist: {
    name: string
    _id: string
  }
  totalSessions: number
  sessionsCompleted: number
  sessionsPaid: number
}

interface PatientWithAppointments {
  _id: string
  firstName?: string
  lastName?: string
  fullName?: string
  childName?: string
  dateOfBirth?: string
  childDOB?: string
  gender?: string
  childGender?: string
  // Added photo and birth certificate fields
  photo?: {
    url: string
    public_id: string
  } | null
  birthCertificate?: {
    url: string
    public_id: string
  } | null
  parentInfo?: {
    name: string
    phone: string
    email: string
    relationship?: string
    address?: string
  }
  parentName?: string
  contactNumber?: string
  email?: string
  appointments: AppointmentDetails[]
  totalAppointments: number
  completedAppointments: number
  pendingPayments: number
  totalOwed: number
  totalPaid: number
  status?: string
  createdAt: string
  updatedAt: string
}

interface PaymentSummary {
  totalPatients: number
  totalRevenue: number
  pendingPayments: number
  completedPayments: number
  partialPayments: number
}

// Payment modal types
interface PaymentModalData {
  patient: PatientWithAppointments
  selectedAppointments: string[]
  paymentType: "single" | "partial" | "full"
  customAmount?: number
}

// Image Modal Component
const ImageModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
  type: "photo" | "certificate"
}> = ({ isOpen, onClose, imageUrl, title, type }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === "photo" ? (
              <User className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image Container */}
        <div className="p-6 flex justify-center items-center bg-gray-50 min-h-[400px]">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=400&width=400&text=Image+Not+Found"
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Patient Details Modal Component
const PatientDetailsModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
}> = ({ patient, isOpen, onClose }) => {
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    title: string
    type: "photo" | "certificate"
  } | null>(null)

  const openImageModal = (url: string, title: string, type: "photo" | "certificate") => {
    setSelectedImage({ url, title, type })
    setShowImageModal(true)
  }

  if (!isOpen) return null

  const getPatientName = (patient: PatientWithAppointments): string => {
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    return patient.fullName || patient.childName || "Unknown"
  }

  const getParentName = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.name || patient.parentName || "N/A"
  }

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "N/A"
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {patient.photo?.url ? (
                <img
                  src={patient.photo.url || "/placeholder.svg"}
                  alt="Patient"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{getPatientName(patient)}</h3>
                <p className="text-sm text-gray-600">Patient Details</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Patient Information */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Full Name:</span>
                    <p className="text-gray-900">{getPatientName(patient)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                    <p className="text-gray-900">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Age:</span>
                    <p className="text-gray-900">{calculateAge(patient.dateOfBirth || "")}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Gender:</span>
                    <p className="text-gray-900 capitalize">{patient.gender || patient.childGender || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Parent Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Parent Name:</span>
                    <p className="text-gray-900">{getParentName(patient)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Contact:</span>
                    <p className="text-gray-900">{patient.parentInfo?.phone || patient.contactNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{patient.parentInfo?.email || patient.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Address:</span>
                    <p className="text-gray-900">{patient.parentInfo?.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {
              (patient.photo?.url || patient.birthCertificate?.url) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Documents & Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Patient Photo */}
                    {patient?.photo?.url && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient Photo
                        </h5>
                        <a to={patient?.photo?.url} target="_blank" onClick={console.log("Hello")}>
                        <div className="relative group">
                          <img
                            src={patient.photo.url || "/placeholder.svg"}
                            alt="Patient Photo"
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                            onClick={() => window.open(patient.photo!.url, '_blank')}
                          />
                          
                          <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                            
                              <Eye className="w-4 h-4 text-gray-600" />
                           
                          </div>
                          
                        </div>
                         </a>
                      </div>
                    )}

                    {/* Birth Certificate */}
                    {patient?.birthCertificate?.url && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Birth Certificate
                        </h5>
                        <a a to={patient?.birthCertificate?.url}>
                                                  <div className="relative group">
                          <img
                            src={patient.birthCertificate.url || "/placeholder.svg"}
                            alt="Birth Certificate"
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-300 transition-colors"
                            onClick={() => window.open(patient.birthCertificate!.url, '_blank')}
                          />
                          {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div> */}
                          <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              )
            }




            {/* Appointment Summary */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Appointment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{patient.totalAppointments}</div>
                  <div className="text-sm text-blue-700">Total Appointments</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{patient.completedAppointments}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{patient.pendingPayments}</div>
                  <div className="text-sm text-yellow-700">Pending Payments</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">₹{patient.totalOwed}</div>
                  <div className="text-sm text-red-700">Amount Owed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false)
            setSelectedImage(null)
          }}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          type={selectedImage.type}
        />
      )}
    </>
  )
}

const PatientsEnhancedPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithAppointments[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPatients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    partialPayments: 0,
  })

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientWithAppointments | null>(null)
  const [paymentModalData, setPaymentModalData] = useState<PaymentModalData | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch patients with appointments data - FIXED API ENDPOINT
  const fetchPatientsWithAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/with-appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const apiResponse = await response.json()

      if (!apiResponse.success) {
        throw new Error("API returned unsuccessful response")
      }

      setPatients(apiResponse.data)
      calculatePaymentSummary(apiResponse.data)
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  // Calculate payment summary
  const calculatePaymentSummary = (patientsData: PatientWithAppointments[]) => {
    const summary = patientsData.reduce(
      (acc, patient) => {
        acc.totalPatients += 1
        acc.totalRevenue += patient.totalPaid
        acc.pendingPayments += patient.pendingPayments
        acc.completedPayments += patient.appointments.filter((apt) => apt.payment.status === "paid").length
        acc.partialPayments += patient.appointments.filter((apt) => apt.payment.status === "partial").length
        return acc
      },
      {
        totalPatients: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        partialPayments: 0,
      },
    )
    setPaymentSummary(summary)
  }

  // Get patient display name
  const getPatientName = (patient: PatientWithAppointments): string => {
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    return patient.fullName || patient.childName || "Unknown"
  }

  // Get parent name
  const getParentName = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.name || patient.parentName || "N/A"
  }

  // Get contact info
  const getContactInfo = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.phone || patient.contactNumber || "N/A"
  }

  // Open patient details modal
  const openPatientDetailsModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowPatientDetailsModal(true)
  }

  // Open payment modal
  const openPaymentModal = (patient: PatientWithAppointments, type: "single" | "partial" | "full" = "single") => {
    setSelectedPatient(patient)
    setPaymentModalData({
      patient,
      selectedAppointments: [],
      paymentType: type,
    })
    setShowPaymentModal(true)
  }

  // Open appointments detail modal
  const openAppointmentsModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowAppointmentsModal(true)
  }

  // Process payment - FIXED API ENDPOINT
  const processPayment = async (paymentData: {
    appointmentIds: string[]
    paymentAmount: number
    paymentMethod: string
    paymentType: "full" | "partial"
  }) => {
    if (!selectedPatient) return

    setIsProcessingPayment(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          appointmentIds: paymentData.appointmentIds,
          paymentAmount: paymentData.paymentAmount,
          paymentMethod: paymentData.paymentMethod,
          paymentType: paymentData.paymentType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process payment")
      }

      const result = await response.json()
      // Refresh data
      await fetchPatientsWithAppointments()
      // Show success message
      alert(`Payment of $${paymentData.paymentAmount} processed successfully!`)
      setShowPaymentModal(false)
      setPaymentModalData(null)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Export patient payment report
  const exportPaymentReport = () => {
    const csvContent = [
      [
        "Patient Name",
        "Parent Name",
        "Contact",
        "Total Appointments",
        "Completed",
        "Total Owed",
        "Total Paid",
        "Pending Payments",
        "Payment Status",
      ],
      ...filteredPatients.map((patient) => [
        getPatientName(patient),
        getParentName(patient),
        getContactInfo(patient),
        patient.totalAppointments.toString(),
        patient.completedAppointments.toString(),
        patient.totalOwed.toString(),
        patient.totalPaid.toString(),
        patient.pendingPayments.toString(),
        patient.pendingPayments > 0 ? "Has Pending" : "Up to Date",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `patient-payment-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      getPatientName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getParentName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContactInfo(patient).includes(searchTerm)

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && patient.pendingPayments > 0) ||
      (filterStatus === "paid" && patient.pendingPayments === 0) ||
      (filterStatus === "partial" && patient.appointments.some((apt) => apt.payment.status === "partial"))

    return matchesSearch && matchesFilter
  })

  useEffect(() => {
    fetchPatientsWithAppointments()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C83C92]" />
          <span className="text-[#1E437A]">Loading patient payment data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 font-sans max-w-[84%] mt-15 ml-70 mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Patient Data</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPatientsWithAppointments}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[84%] font-sans mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-2">Patient Payment Management</h1>
        <p className="text-gray-600">Manage patient appointments and payment status</p>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Total Patients</p>
              <p className="text-xl font-bold text-[#1E437A]">{paymentSummary.totalPatients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">₹{paymentSummary.totalRevenue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Pending Payments</p>
              <p className="text-xl font-bold text-yellow-600">{paymentSummary.pendingPayments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{paymentSummary.completedPayments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Partial Payments</p>
              <p className="text-xl font-bold text-orange-600">{paymentSummary.partialPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name, parent, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="all">All Patients</option>
            <option value="pending">Pending Payments</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Payments</option>
          </select>
          <button
            onClick={exportPaymentReport}
            className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium text-gray-800 hover:bg-[#C83C9230] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={fetchPatientsWithAppointments}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1E437A]">Patient Payment Overview ({filteredPatients.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9F9FC]">
              <tr className="text-left text-[#1E437A]">
                <th className="px-6 py-4 font-medium text-gray-800">Patient Info</th>
                <th className="px-6 py-4 font-medium text-gray-800">Appointments</th>
                <th className="px-6 py-4 font-medium text-gray-800">Payment Summary</th>
                <th className="px-6 py-4 font-medium text-gray-800">Status</th>
                <th className="px-6 py-4 font-medium text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Patient Photo */}
                      {patient.photo?.url ? (
                        <img
                          src={patient.photo.url || "/placeholder.svg"}
                          alt="Patient"
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        >
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div
                          className="font-medium text-gray-800 text-[#456696] cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        >
                          {getPatientName(patient)}
                        </div>
                        <div className="text-sm text-black text-gray-500">Parent: {getParentName(patient)}</div>
                        <div className="text-sm text-black text-gray-500">Contact: {getContactInfo(patient)}</div>
                        {/* Document indicators */}
                        <div className="flex items-center gap-2 mt-1">
                          {patient.photo?.url && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              <User className="w-3 h-3" />
                              Photo
                            </span>
                          )}
                          {patient.birthCertificate?.url && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              <FileText className="w-3 h-3" />
                              Certificate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Total:</span> {patient.totalAppointments}
                      </div>
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Completed:</span> {patient.completedAppointments}
                      </div>
                      <button
                        onClick={() => openAppointmentsModal(patient)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Owed:</span>{" "}
                        <span className="text-red-600">₹{patient.totalOwed}</span>
                      </div>
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Paid:</span>{" "}
                        <span className="text-green-600">₹{patient.totalPaid}</span>
                      </div>
                      {patient.pendingPayments > 0 && (
                        <div className="text-xs text-orange-600">
                          {patient.pendingPayments} pending payment{patient.pendingPayments > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {patient.pendingPayments === 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Up to Date
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Has Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPatientDetailsModal(patient)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </button>
                      {patient.pendingPayments > 0 && (
                        <>
                          <button
                            onClick={() => openPaymentModal(patient, "single")}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            Pay Single
                          </button>
                          <button
                            onClick={() => openPaymentModal(patient, "full")}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                          >
                            Pay All
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterStatus !== "all" ? "No patients found matching your criteria." : "No patients found."}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          isOpen={showPatientDetailsModal}
          onClose={() => {
            setShowPatientDetailsModal(false)
            setSelectedPatient(null)
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentModalData && (
        <PaymentModal
          data={paymentModalData}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentModalData(null)
          }}
          onProcessPayment={processPayment}
          isProcessing={isProcessingPayment}
        />
      )}

      {/* Appointments Detail Modal */}
      {showAppointmentsModal && selectedPatient && (
        <AppointmentsDetailModal
          patient={selectedPatient}
          isOpen={showAppointmentsModal}
          onClose={() => {
            setShowAppointmentsModal(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}

// Payment Modal Component (keeping existing implementation)
const PaymentModal: React.FC<{
  data: PaymentModalData
  isOpen: boolean
  onClose: () => void
  onProcessPayment: (paymentData: {
    appointmentIds: string[]
    paymentAmount: number
    paymentMethod: string
    paymentType: "full" | "partial"
  }) => void
  isProcessing: boolean
}> = ({ data, isOpen, onClose, onProcessPayment, isProcessing }) => {
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full")

  const pendingAppointments = data.patient.appointments.filter(
    (apt) => apt.payment.status === "pending" || apt.payment.status === "partial",
  )

  const totalOwed = pendingAppointments.reduce((sum, apt) => {
    const remaining = apt.payment.amount - (apt.payment.paidAmount || 0)
    return sum + remaining
  }, 0)

  useEffect(() => {
    if (data.paymentType === "full") {
      setSelectedAppointments(pendingAppointments.map((apt) => apt._id))
      setPaymentAmount(totalOwed)
      setPaymentType("full")
    } else if (data.paymentType === "single" && pendingAppointments.length > 0) {
      setSelectedAppointments([pendingAppointments[0]._id])
      const remaining = pendingAppointments[0].payment.amount - (pendingAppointments[0].payment.paidAmount || 0)
      setPaymentAmount(remaining)
      setPaymentType("full")
    }
  }, [data])

  const handleAppointmentToggle = (appointmentId: string) => {
    setSelectedAppointments((prev) => {
      if (prev.includes(appointmentId)) {
        return prev.filter((id) => id !== appointmentId)
      } else {
        return [...prev, appointmentId]
      }
    })
  }

  const calculateSelectedTotal = () => {
    return selectedAppointments.reduce((sum, aptId) => {
      const apt = pendingAppointments.find((a) => a._id === aptId)
      if (apt) {
        const remaining = apt.payment.amount - (apt.payment.paidAmount || 0)
        return sum + remaining
      }
      return sum
    }, 0)
  }

  const handleSubmit = () => {
    if (selectedAppointments.length === 0 || paymentAmount <= 0) {
      alert("Please select appointments and enter a valid payment amount")
      return
    }

    onProcessPayment({
      appointmentIds: selectedAppointments,
      paymentAmount,
      paymentMethod,
      paymentType,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1E437A]">Process Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Patient Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 text-[#1E437A] mb-2">Patient Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-black">
            <div>
              <span className="font-medium text-gray-800">Name:</span> {data.patient.firstName} {data.patient.lastName}
            </div>
            <div>
              <span className="font-medium text-gray-800">Parent:</span> {data.patient.parentInfo?.name}
            </div>
            <div>
              <span className="font-medium text-gray-800">Total Owed:</span>{" "}
              <span className="text-red-600 font-medium text-gray-800">₹{totalOwed}</span>
            </div>
            <div>
              <span className="font-medium text-gray-800">Pending Appointments:</span> {pendingAppointments.length}
            </div>
          </div>
        </div>

        {/* Appointment Selection */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 text-[#1E437A] mb-3">Select Appointments to Pay</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pendingAppointments.map((appointment) => {
              const remaining = appointment.payment.amount - (appointment.payment.paidAmount || 0)
              return (
                <label key={appointment._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedAppointments.includes(appointment._id)}
                    onChange={() => handleAppointmentToggle(appointment._id)}
                    className="mr-3 text-[#C83C92] focus:ring-[#C83C92]"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800 text-sm text-black">
                          {new Date(appointment.date).toLocaleDateString()} - {appointment.startTime}
                        </div>
                        <div className="text-xs text-gray-600">
                          {appointment.service.name} with {appointment.therapist.name}
                        </div>
                        {appointment.payment.status === "partial" && (
                          <div className="text-xs text-orange-600">
                            Paid: ₹{appointment.payment.paidAmount} of ₹{appointment.payment.amount}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800 text-sm text-black">₹{remaining}</div>
                        <div className="text-xs text-gray-500">remaining</div>
                      </div>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm text-black font-medium text-black text-[#1E437A] mb-2">Payment Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={paymentType === "full"}
                  onChange={(e) => {
                    setPaymentType(e.target.value as "full" | "partial")
                    if (e.target.value === "full") {
                      setPaymentAmount(calculateSelectedTotal())
                    }
                  }}
                  className="mr-2 text-[#C83C92] focus:ring-[#C83C92]"
                />
                <span style={{ color: "black" }}>Full Payment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentType"
                  value="partial"
                  checked={paymentType === "partial"}
                  onChange={(e) => setPaymentType(e.target.value as "full" | "partial")}
                  className="mr-2 text-[#C83C92] focus:ring-[#C83C92]"
                />
                <span style={{ color: "black" }}>Partial Payment</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-black font-medium text-gray-800 text-[#1E437A] mb-2">
                Payment Amount
              </label>
              <input
                type="number"
                value={paymentAmount || calculateSelectedTotal() || 0}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                max={calculateSelectedTotal()}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] text-black"
                placeholder="Enter amount"
              />
              <div className="text-xs text-gray-500 mt-1">Selected total: ₹{calculateSelectedTotal()}</div>
            </div>
            <div>
              <label className="block text-sm text-black font-medium text-gray-800 text-[#1E437A] mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] text-black"
              >
                <option value="cash">Cash</option>
                <option value="card">Upi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || selectedAppointments.length === 0}
            className="flex-1 bg-[#C83C92] text-white py-2 px-4 rounded-lg font-medium text-gray-800 hover:bg-[#B8358A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Process Payment (₹{paymentAmount})
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Appointments Detail Modal Component (keeping existing implementation)
const AppointmentsDetailModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
}> = ({ patient, isOpen, onClose }) => {
  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1E437A]">
            Appointment History - {patient.firstName} {patient.lastName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Patient Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
            <div>
              <span className="font-medium text-gray-800">Total Appointments:</span> {patient.totalAppointments}
            </div>
            <div>
              <span className="font-medium text-gray-800">Completed:</span> {patient.completedAppointments}
            </div>
            <div>
              <span className="font-medium text-gray-800">Total Paid:</span>{" "}
              <span className="text-green-600">₹{patient.totalPaid}</span>
            </div>
            <div>
              <span className="font-medium text-gray-800">Amount Owed:</span>{" "}
              <span className="text-red-600">₹{patient.totalOwed}</span>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 text-[#1E437A]">All Appointments</h4>
          {patient.appointments.map((appointment) => (
            <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-800 text-[#456696]">
                    {new Date(appointment.date).toLocaleDateString()} - {appointment.startTime} to {appointment.endTime}
                  </div>
                  <div className="text-sm text-black text-gray-600 mt-1">
                    {appointment.service.name} with {appointment.therapist.name}
                  </div>
                  <div className="text-sm text-black text-gray-600">Type: {appointment.type}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-gray-800 ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
                <div>
                  <span className="font-medium text-gray-800">Amount:</span> ₹{appointment.payment.amount}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Payment Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-gray-800 ${getPaymentStatusColor(appointment.payment.status)}`}
                  >
                    {appointment.payment.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">Method:</span> {appointment.payment.method}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Sessions:</span> {appointment.sessionsCompleted}/
                  {appointment.totalSessions}
                </div>
              </div>
              {appointment.payment.status === "partial" && (
                <div className="mt-2 text-sm text-black text-orange-600">
                  Paid: ₹{appointment.payment.paidAmount} of ₹{appointment.payment.amount}
                </div>
              )}
            </div>
          ))}
        </div>
        {patient.appointments.length === 0 && (
          <div className="text-center py-8 text-gray-500">No appointments found for this patient.</div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PatientsEnhancedPage
