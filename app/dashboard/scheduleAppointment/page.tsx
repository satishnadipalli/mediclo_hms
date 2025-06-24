"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ImageIcon, Search } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

// Types for calendar API response
interface CalendarAppointment {
  id: string
  patientId: string
  doctorId: string
  patientName: string
  type: "initial assessment" | "therapy session"
  status: "scheduled"
  duration: number
}

interface CalendarApiResponse {
  success: boolean
  data: {
    [doctorName: string]: {
      [timeSlot: string]: CalendarAppointment | null
    }
  }
  patients: Patient[]
}

interface Patient {
  _id: string
  id: string
  // Handle both old and new formats
  childName?: string
  fullName?: string
  parentName?: string
  contactNumber?: string
  email: string
  address?: string
  childDOB?: string
  childGender?: string
  parentInfo?: {
    name?: string
    phone?: string
    email?: string
    relationship: string
    address?: string
  }
  status: string
}

const AppointmentSchedulingPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calendarData, setCalendarData] = useState<CalendarApiResponse["data"]>({})
  const [availableDoctors, setAvailableDoctors] = useState<string[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])

  const [formData, setFormData] = useState({
    doctor: "",
    appointmentDate: "",
    timeSlot: "",
    primaryConcern: "",
    patientName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    serviceId: "", // You might need to fetch services too
    paymentAmount: 0,
    paymentMethod: "cash",
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])

  // Update the fetchCalendarData function
  const fetchCalendarData = async (selectedDate: string) => {
    if (!selectedDate) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/by-date?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch calendar data")
      }

      const apiResponse: CalendarApiResponse = await response.json()
      console.log("api-Response",apiResponse);

      if (apiResponse.success) {
        setCalendarData(apiResponse.data)
        setAvailableDoctors(Object.keys(apiResponse.data))

        // Set patients data and initialize filtered patients
        if (apiResponse.patients) {
          setPatients(apiResponse.patients)
          setFilteredPatients(apiResponse.patients)
        }
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast.error("Failed to fetch available doctors")
    }
  }

  // Update useEffect to fetch data when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      fetchCalendarData(formData.appointmentDate)
      // Reset doctor and time slot when date changes
      setFormData((prev) => ({
        ...prev,
        doctor: "",
        timeSlot: "",
      }))
    }
  }, [formData.appointmentDate])

  useEffect(() => {
    if (patientSearchTerm.trim() === "") {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter((patient) => {
        const childName = patient.childName || patient.fullName || ""
        const parentName = patient.parentName || patient.parentInfo?.name || ""
        const phone = patient.contactNumber || patient.parentInfo?.phone || ""
        const patientId = patient._id || patient.id || ""

        return (
          childName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
          parentName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
          phone.includes(patientSearchTerm) ||
          patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
        )
      })
      setFilteredPatients(filtered)
    }
  }, [patientSearchTerm, patients])

  // Update the existing useEffect for time slots
  useEffect(() => {
    if (formData.doctor && calendarData[formData.doctor]) {
      const doctorSlots = calendarData[formData.doctor]
      const availableSlots = Object.keys(doctorSlots).filter((timeSlot) => doctorSlots[timeSlot] === null)
      setAvailableTimeSlots(availableSlots)
    } else {
      setAvailableTimeSlots([])
    }
  }, [formData.doctor, calendarData])

  // Remove the initial fetchCalendarData call from component mount
  // useEffect(() => {
  //   fetchCalendarData()
  // }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Update the date input handler to trigger data fetch
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const calculateEndTime = (startTime: string): string => {
    const [time, period] = startTime.split(" ")
    const [hours, minutes] = time.split(":").map(Number)

    let totalMinutes = hours * 60 + minutes + 45 // 45 minutes duration
    if (period === "PM" && hours !== 12) totalMinutes += 12 * 60
    if (period === "AM" && hours === 12) totalMinutes -= 12 * 60

    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    const endPeriod = endHours >= 12 ? "PM" : "AM"
    const displayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours

    return `${displayHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")} ${endPeriod}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const endTime = calculateEndTime(formData.timeSlot)

      const appointmentData = {
        patientName: formData.patientName,
        email: formData.email,
        phone: formData.phone,
        serviceId: formData.serviceId || "default_service_id",
        therapistId: null,
        date: formData.appointmentDate,
        startTime: formData.timeSlot,
        endTime: endTime,
        type: "initial assessment",
        notes: formData.notes,
        address: formData.address,
        paymentAmount: formData.paymentAmount,
        paymentMethod: formData.paymentMethod,
        // Add patient ID if existing patient is selected
        ...(selectedPatient && { patientId: selectedPatient._id }),
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create appointment")
      }

      const result = await response.json()
      toast.success("Appointment scheduled successfully!")

      // Redirect back to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to schedule appointment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="-mb-10">
        <div className="flex items-center text-[#1E437A] mb-2">
          <ChevronLeft className="w-5 h-5" />
          <a href="#" className="font-medium" onClick={() => router.back()}>
            Back
          </a>
        </div>
        <h1 className="text-2xl font-bold text-[#245BA7]">Schedule an Appointment</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span className="text-[#1E437A]">Dashboard</span>
          <span className="mx-2">›</span>
          <span className="text-[#1E437A]">Register New Patient</span>
          <span className="mx-2">›</span>
          <span>Schedule an Appointment</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mb-6">
        <button
          className="flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Calendar className="w-5 h-5" />
          {loading ? "Scheduling..." : "Schedule & Send Notification"}
        </button>
      </div>


              {/* Appointment Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Appointment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="appointmentDate">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                  placeholder="Select appointment date"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="doctor">
                Select Doctor *
              </label>
              <div className="relative">
                <select
                  id="doctor"
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                  required
                  disabled={!formData.appointmentDate}
                >
                  <option value="">{!formData.appointmentDate ? "Select date first" : "Select doctor"}</option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="timeSlot">
                Available Time Slots *
              </label>
              <div className="relative">
                <select
                  id="timeSlot"
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                  disabled={!formData.doctor}
                  required
                >
                  <option value="">{!formData.doctor ? "Select doctor first" : "Select time slot"}</option>
                  {availableTimeSlots.map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {formData.doctor && availableTimeSlots.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No available slots for selected doctor</p>
              )}
            </div>
          </div>
        </div>


      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Patient Selection Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Select Patient</h2>

          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2">Choose Existing Patient or Add New</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowPatientSearch(!showPatientSearch)}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {showPatientSearch ? "Hide" : "Select Existing Patient"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null)
                  setShowPatientSearch(false)
                  setPatientSearchTerm("")
                  // Clear form
                  setFormData({
                    ...formData,
                    patientName: "",
                    email: "",
                    phone: "",
                    address: "",
                  })
                }}
                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                Add New Patient
              </button>
            </div>
          </div>

          {showPatientSearch && (
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by Patient ID, Name, or Phone Number..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Patient List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => {
                        setSelectedPatient(patient)
                        const childName = patient.childName || patient.fullName || ""
                        const parentName = patient.parentName || patient.parentInfo?.name || ""
                        const email = patient.email || patient.parentInfo?.email || ""
                        const phone = patient.contactNumber || patient.parentInfo?.phone || ""
                        const address = patient.address || patient.parentInfo?.address || ""

                        setFormData({
                          ...formData,
                          patientName: childName,
                          email: email,
                          phone: phone,
                          address: address,
                        })
                        setShowPatientSearch(false)
                        setPatientSearchTerm("")
                      }}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{patient.childName || patient.fullName}</div>
                          <div className="text-sm text-gray-600">
                            Parent: {patient.parentName || patient.parentInfo?.name} | Phone:{" "}
                            {patient.contactNumber || patient.parentInfo?.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {patient._id} | Gender: {patient.childGender || "Not specified"}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{patient.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {patientSearchTerm ? "No patients found matching your search" : "No patients available"}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedPatient && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                ✓ Selected: <strong>{selectedPatient.childName || selectedPatient.fullName}</strong>
                <div className="text-xs mt-1">
                  Parent: {selectedPatient.parentName || selectedPatient.parentInfo?.name} | Phone:{" "}
                  {selectedPatient.contactNumber || selectedPatient.parentInfo?.phone}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Patient Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="patientName">
                Patient Name *
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter patient name"
                required
              />
            </div>

            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="phone">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="email">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter email address"
                required
              />
            </div>

            {selectedPatient && (
              <div>
                <label className="block text-[#1E437A] mb-2">Parent/Guardian Name</label>
                <input
                  type="text"
                  value={selectedPatient.parentName || selectedPatient.parentInfo?.name || ""}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
              placeholder="Enter address"
              rows={3}
            />
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Medical Information</h2>

          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="primaryConcern">
              Primary Concern
            </label>
            <div className="relative">
              <select
                id="primaryConcern"
                name="primaryConcern"
                value={formData.primaryConcern}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
              >
                <option value="">Select the primary concern</option>
                <option value="developmental">Developmental Assessment</option>
                <option value="behavioral">Behavioral Issues</option>
                <option value="speech">Speech Therapy</option>
                <option value="physical">Physical Therapy</option>
                <option value="checkup">Regular Check-up</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="notes">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
              placeholder="Enter any additional notes..."
              rows={4}
            />
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Media</h2>

          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2">Upload Files (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-gray-500 mb-4">Upload any Medical Records, Home Play Videos, etc.</p>
                <button type="button" className="bg-blue-100 text-blue-500 px-6 py-2 rounded-lg font-medium">
                  Add Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AppointmentSchedulingPage
