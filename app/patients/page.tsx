"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Search, FileText, Plus, UserRound, Edit, Calendar, X, CreditCard } from "lucide-react"

// Sample data - you can replace this with your actual data
const data = [
  {
    id: 1,
    name: "John Doe",
    age: 25,
    gender: "Male",
    parentName: "Jane Doe",
    contact: "+1234567890",
    lastVisit: "2024-01-15",
    upcomingAppointment: "2024-02-15",
    paymentStatus: false,
    amount: 150,
  },
  {
    id: 2,
    name: "Alice Smith",
    age: 30,
    gender: "Female",
    parentName: "Bob Smith",
    contact: "+1234567891",
    lastVisit: "2024-01-10",
    upcomingAppointment: "2024-02-10",
    paymentStatus: true,
    amount: 200,
  },
  {
    id: 3,
    name: "Mike Johnson",
    age: 28,
    gender: "Male",
    parentName: "Sarah Johnson",
    contact: "+1234567892",
    lastVisit: "2024-01-20",
    upcomingAppointment: "2024-02-20",
    paymentStatus: false,
    amount: 175,
  },
]

interface Patient {
  id: number
  name: string
  age: number
  gender: string
  parentName: string
  contact: string
  lastVisit: string
  upcomingAppointment: string
  paymentStatus: boolean
  amount: number
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(data)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false)

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
  }

  // Update payment status
  const updatePaymentStatus = () => {
    if (selectedPatient) {
      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.id === selectedPatient.id ? { ...patient, paymentStatus: paymentStatus } : patient,
        ),
      )
      closePaymentModal()
    }
  }

  // Generate receipt
  const generateReceipt = () => {
    if (selectedPatient) {
      // Here you would implement actual receipt generation logic
      alert(`Receipt generated for ${selectedPatient.name} - Amount: $${selectedPatient.amount}`)
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contact.includes(searchTerm),
  )

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
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
          className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium"
          onClick={() => console.log("Export patient list")}
        >
          <FileText className="w-5 h-5" />
          Export Patient List
        </button>

        <Link href={"/dashboard/registerPatient"}>
          <button className="cursor-pointer flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium">
            <Plus className="w-5 h-5" />
            Register New Patient
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#1E437A]">All Patients</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="">
              <tr className="text-left text-[#1E437A] bg-[#F9F9FC] h-12">
                <th className="pb-3 font-medium">Patient Name</th>
                <th className="pb-3 font-medium">Age</th>
                <th className="pb-3 font-medium">Gender</th>
                <th className="pb-3 font-medium">Parent Name</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium">Last Visit</th>
                <th className="pb-3 font-medium">Upcoming Appointment</th>
                <th className="pb-3 font-medium">Actions</th>
                <th className="pb-3 font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b">
                  <td className="py-4 text-[#456696]">{patient.name}</td>
                  <td className="py-4 text-[#456696]">{patient.age}</td>
                  <td className="py-4 text-[#456696]">{patient.gender}</td>
                  <td className="py-4 text-[#456696]">{patient.parentName}</td>
                  <td className="py-4 text-[#456696]">{patient.contact}</td>
                  <td className="py-4 text-[#456696]">{patient.lastVisit}</td>
                  <td className="py-4 text-[#456696]">{patient.upcomingAppointment}</td>
                  <td className="py-4">
                    <div className="flex gap-3">
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-md" aria-label="View patient details">
                          <UserRound className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/patients/${patient.id}/edit`}>
                        <button className="p-2 bg-purple-50 text-[#C83C92] rounded-md" aria-label="Edit patient">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/appointments/schedule/${patient.id}`}>
                        <button className="p-2 bg-green-50 text-green-600 rounded-md" aria-label="Schedule appointment">
                          <Calendar className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                  <td className="py-4 text-[#25642a]">
                    {patient.paymentStatus ? (
                      <span className="bg-green-600 p-1 text-sm rounded-2xl text-white px-3">Completed</span>
                    ) : (
                      <span className="p-1 text-sm rounded-2xl text-black">
                        <span className="font-semibold text-gray-400">Pending</span>
                        <button
                          className="ml-2 font-semibold text-fuchsia-700 hover:text-fuchsia-800 transition-colors"
                          onClick={() => openPaymentModal(patient)}
                        >
                          Update
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing 1-{filteredPatients.length} of {filteredPatients.length} patients
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
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#1E437A]">Update Payment Status</h3>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                <span className="font-medium">Amount:</span> ${selectedPatient.amount}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last Visit:</span> {selectedPatient.lastVisit}
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
                  />
                  <span className="text-gray-700">Paid</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={updatePaymentStatus}
                className="flex-1 bg-[#C83C92] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B8358A] transition-colors"
              >
                Update Status
              </button>
              <button
                onClick={generateReceipt}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Generate Receipt
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={closePaymentModal}
              className="w-full mt-3 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
