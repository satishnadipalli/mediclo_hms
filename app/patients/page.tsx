"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, FileText, Plus, UserRound, Edit, Calendar, X, CreditCard, Loader2 } from "lucide-react"

// API Response Types
interface ApiPatient {
  _id: string
  parentId?: string
  // Name variations
  firstName?: string
  lastName?: string
  fullName?: string
  childName?: string
  // Date of birth variations
  dateOfBirth?: string
  childDOB?: string
  // Gender variations
  gender?: string
  childGender?: string
  // Parent info variations
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
  // Emergency contact
  emergencyContact?: {
    name: string
    relation: string
    phone: string
  }
  // Appointment info
  latestAppointment?: {
    id: string
    appointmentDate: string
    appointmentSlot: string
    paymentStatus: string
  } | null
  lastVisit?: string | null
  age?: number | null
  // Additional fields
  allergies?: string[]
  medicalRecords?: any[]
  therapistNotes?: any[]
  assessments?: any[]
  status?: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  count: number
  data: ApiPatient[]
}

// Update Payment API Response
interface UpdatePaymentResponse {
  success: boolean
  message: string
  data: {
    appointment: any
    patient: ApiPatient // Updated patient data
  }
}

// Normalized Patient interface for display
interface Patient {
  id: string
  name: string
  age: number | null
  gender: string
  parentName: string
  contact: string
  email: string
  lastVisit: string | null
  upcomingAppointment: string | null
  appointmentSlot: string | null
  paymentStatus: boolean
  paymentStatusText: string
  rawData: ApiPatient
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<boolean>(false)

  // Normalize API data to display format
  const normalizePatientData = (apiPatient: ApiPatient): Patient => {
    // Handle different name field variations
    let name = ""
    if (apiPatient.firstName && apiPatient.lastName) {
      name = `${apiPatient.firstName} ${apiPatient.lastName}`
    } else if (apiPatient.fullName) {
      name = apiPatient.fullName
    } else if (apiPatient.childName) {
      name = apiPatient.childName
    } else {
      name = "Unknown"
    }

    // Handle gender variations
    const gender = apiPatient.gender || apiPatient.childGender || "not_specified"

    // Handle parent info variations
    let parentName = ""
    let contact = ""
    let email = ""

    if (apiPatient.parentInfo) {
      parentName = apiPatient.parentInfo.name
      contact = apiPatient.parentInfo.phone
      email = apiPatient.parentInfo.email
    } else if (apiPatient.parentName) {
      parentName = apiPatient.parentName
      contact = apiPatient.contactNumber || ""
      email = apiPatient.email || ""
    } else if (apiPatient.emergencyContact) {
      parentName = apiPatient.emergencyContact.name
      contact = apiPatient.emergencyContact.phone
    }

    // Handle appointment info
    let upcomingAppointment = null
    let appointmentSlot = null
    let paymentStatusText = "No appointment"
    let paymentStatus = false

    if (apiPatient.latestAppointment) {
      const appointmentDate = new Date(apiPatient.latestAppointment.appointmentDate)
      upcomingAppointment = appointmentDate.toLocaleDateString()
      appointmentSlot = apiPatient.latestAppointment.appointmentSlot
      paymentStatusText = apiPatient.latestAppointment.paymentStatus
      paymentStatus =
        apiPatient.latestAppointment.paymentStatus === "completed" ||
        apiPatient.latestAppointment.paymentStatus === "paid"
    }

    // Handle last visit
    let lastVisit = null
    if (apiPatient.lastVisit) {
      lastVisit = new Date(apiPatient.lastVisit).toLocaleDateString()
    }

    // Calculate age if not provided
    let age = apiPatient.age
    if (!age && (apiPatient.dateOfBirth || apiPatient.childDOB)) {
      const birthDate = new Date(apiPatient.dateOfBirth || apiPatient.childDOB!)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    return {
      id: apiPatient._id,
      name,
      age,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1).replace("_", " "),
      parentName,
      contact,
      email,
      lastVisit,
      upcomingAppointment,
      appointmentSlot,
      paymentStatus,
      paymentStatusText,
      rawData: apiPatient,
    }
  }

  // Fetch patients data from API
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      // Replace with your actual API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const apiResponse: ApiResponse = await response.json()

      if (!apiResponse.success) {
        throw new Error("API returned unsuccessful response")
      }

      const normalizedPatients = apiResponse.data.map(normalizePatientData)
      setPatients(normalizedPatients)
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchPatients()
  }, [])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value)
  }

  // Open payment modal
  const openPaymentModal = (patient: Patient) => {
    setSelectedPatient(patient)
    setPaymentStatus(patient.paymentStatus)
    setIsModalOpen(true)
  }

  // Close payment modal
  const closePaymentModal = () => {
    setIsModalOpen(false)
    setSelectedPatient(null)
    setIsUpdatingPayment(false)
  }

  // Update payment status
  const updatePaymentStatus = async () => {
    if (!selectedPatient) return

    console.log("Updating payment for:", selectedPatient)

    try {
      setIsUpdatingPayment(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${selectedPatient.rawData.latestAppointment?.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment: {
              amount: selectedPatient.rawData.latestAppointment?.amount,
              status: paymentStatus ? "paid" : "pending",
              method: selectedPatient.rawData.latestAppointment?.method,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updateResponse: UpdatePaymentResponse = await response.json()

      if (!updateResponse.success) {
        throw new Error(updateResponse.message || "Failed to update payment status")
      }

      console.log("Payment update response:", updateResponse)

      // 🎯 KEY FIX: Use the updated patient data from the API response
      if (updateResponse.data && updateResponse.data.patient) {
        const updatedPatientData = normalizePatientData(updateResponse.data.patient)

        // Update the patients list with the fresh data from the server
        setPatients((prevPatients) =>
          prevPatients.map((patient) => (patient.id === selectedPatient.id ? updatedPatientData : patient)),
        )

        console.log("Updated patient data:", updatedPatientData)
      } else {
        // Fallback: Update locally if no patient data in response
        setPatients((prevPatients) =>
          prevPatients.map((patient) =>
            patient.id === selectedPatient.id
              ? {
                  ...patient,
                  paymentStatus: paymentStatus,
                  paymentStatusText: paymentStatus ? "paid" : "pending",
                  rawData: {
                    ...patient.rawData,
                    latestAppointment: patient.rawData.latestAppointment
                      ? {
                          ...patient.rawData.latestAppointment,
                          paymentStatus: paymentStatus ? "paid" : "pending",
                        }
                      : null,
                  },
                }
              : patient,
          ),
        )
      }

      // Show success message
      alert(`Payment status updated successfully to ${paymentStatus ? "Paid" : "Pending"}`)

      closePaymentModal()
    } catch (err) {
      console.error("Error updating payment status:", err)
      alert(`Failed to update payment status: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  // Generate receipt
  const generateReceipt = () => {
    if (selectedPatient) {
      // Here you would implement actual receipt generation logic
      alert(`Receipt generated for ${selectedPatient.name}`)
    }
  }

  // Export patient list
  const exportPatientList = () => {
    const csvContent = [
      [
        "Name",
        "Age",
        "Gender",
        "Parent Name",
        "Contact",
        "Email",
        "Last Visit",
        "Upcoming Appointment",
        "Payment Status",
      ],
      ...filteredPatients.map((patient) => [
        patient.name,
        patient.age?.toString() || "",
        patient.gender,
        patient.parentName,
        patient.contact,
        patient.email,
        patient.lastVisit || "",
        patient.upcomingAppointment || "",
        patient.paymentStatusText,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patients-list.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contact.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C83C92]" />
          <span className="text-[#1E437A]">Loading patients...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 font-sans max-w-[84%] mt-15 ml-70 mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Patients</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPatients}
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
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Patient Records</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a patient..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium hover:bg-[#C83C9230] transition-colors"
          onClick={exportPatientList}
        >
          <FileText className="w-5 h-5" />
          Export Patient List
        </button>

        <Link href={"/dashboard/registerPatient"}>
          <button className="cursor-pointer flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#B8358A] transition-colors">
            <Plus className="w-5 h-5" />
            Register New Patient
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#1E437A]">All Patients ({filteredPatients.length})</h2>
          <button onClick={fetchPatients} className="text-sm text-[#C83C92] hover:text-[#B8358A] transition-colors">
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="">
              <tr className="text-left text-[#1E437A] bg-[#F9F9FC] h-12">
                <th className="pb-3 font-medium px-2">Patient Name</th>
                <th className="pb-3 font-medium px-2">Age</th>
                <th className="pb-3 font-medium px-2">Gender</th>
                <th className="pb-3 font-medium px-2">Parent Name</th>
                <th className="pb-3 font-medium px-2">Contact</th>
                <th className="pb-3 font-medium px-2">Last Visit</th>
                <th className="pb-3 font-medium px-2">Upcoming Appointment</th>
                <th className="pb-3 font-medium px-2">Actions</th>
                <th className="pb-3 font-medium px-2">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-2 text-[#456696] font-medium">{patient.name}</td>
                  <td className="py-4 px-2 text-[#456696]">{patient.age || "N/A"}</td>
                  <td className="py-4 px-2 text-[#456696]">{patient.gender}</td>
                  <td className="py-4 px-2 text-[#456696]">{patient.parentName}</td>
                  <td className="py-4 px-2 text-[#456696]">{patient.contact}</td>
                  <td className="py-4 px-2 text-[#456696]">{patient.lastVisit || "No visits"}</td>
                  <td className="py-4 px-2 text-[#456696]">
                    {patient.upcomingAppointment ? (
                      <div>
                        <div>{patient.upcomingAppointment}</div>
                        {patient.appointmentSlot && (
                          <div className="text-xs text-gray-500">{patient.appointmentSlot}</div>
                        )}
                      </div>
                    ) : (
                      "No appointment"
                    )}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <button
                          className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          aria-label="View patient details"
                        >
                          <UserRound className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/patients/${patient.id}/edit`}>
                        <button
                          className="p-2 bg-purple-50 text-[#C83C92] rounded-md hover:bg-purple-100 transition-colors"
                          aria-label="Edit patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/appointments/schedule/${patient.id}`}>
                        <button
                          className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                          aria-label="Schedule appointment"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    {patient?.upcomingAppointment ? (
                      patient?.rawData?.latestAppointment?.paymentStatus === "pending" ? (
                        <span className="p-1 text-sm rounded-2xl text-black">
                          <span className="font-semibold text-gray-400">Pending</span>
                          <button
                            className="ml-2 font-semibold text-fuchsia-700 hover:text-fuchsia-800 transition-colors"
                            onClick={() => openPaymentModal(patient)}
                          >
                            Update
                          </button>
                        </span>
                      ) : (
                        <span className="bg-green-600 p-1 text-sm rounded-2xl text-white px-3">Completed</span>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm">No appointment</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No patients found matching your search." : "No patients found."}
          </div>
        )}

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 border rounded-md text-gray-400" aria-label="Previous page">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#1E437A] text-white rounded-md" aria-label="Page 1">
              1
            </button>
            <button disabled className="px-3 py-1 border rounded-md text-gray-400" aria-label="Next page">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Payment Update Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#1E437A]">Update Payment Status</h3>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUpdatingPayment}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Patient Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-[#1E437A] mb-2">Patient Details</h4>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {selectedPatient.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Parent:</span> {selectedPatient.parentName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Appointment:</span> {selectedPatient.upcomingAppointment}{" "}
                {selectedPatient.appointmentSlot}
              </p>
            </div>

            {/* Payment Status Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1E437A] mb-3">Payment Status</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentStatus"
                    checked={!paymentStatus}
                    onChange={() => setPaymentStatus(false)}
                    className="mr-3 text-[#C83C92] focus:ring-[#C83C92]"
                    disabled={isUpdatingPayment}
                  />
                  <span className="text-gray-700">Pending</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentStatus"
                    checked={paymentStatus}
                    onChange={() => setPaymentStatus(true)}
                    className="mr-3 text-[#C83C92] focus:ring-[#C83C92]"
                    disabled={isUpdatingPayment}
                  />
                  <span className="text-gray-700">Completed</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={updatePaymentStatus}
                disabled={isUpdatingPayment}
                className="flex-1 bg-[#C83C92] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B8358A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </button>
              <button
                onClick={generateReceipt}
                disabled={isUpdatingPayment}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                Receipt
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={closePaymentModal}
              disabled={isUpdatingPayment}
              className="w-full mt-3 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientsPage
