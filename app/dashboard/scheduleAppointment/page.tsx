"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, Search, Plus, X } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

// Keep existing interfaces...
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
  childName?: string
  fullName?: string
  firstName?: string
  lastname?: string
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
  const [availableDoctors, setAvailableDoctors] = useState<Array<{ id: string; name: string }>>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [services, setServices] = useState<Array<{ _id: string; name: string; price: number }>>([])

  // Updated form data to support multiple dates
  const [formData, setFormData] = useState({
    doctor: "",
    appointmentDates: [] as string[], // Changed to array
    timeSlot: "",
    primaryConcern: "",
    patientName: "",
    fatherName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    serviceId: "",
    paymentAmount: 0,
    paymentMethod: "cash",
    consultationMode: "in-person",
    type: "initial assessment",
    consent: false,
    totalSessions: 1,
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])

  // New state for multiple dates
  const [currentDateInput, setCurrentDateInput] = useState("")
  const [isMultipleAppointments, setIsMultipleAppointments] = useState(false)

  // Existing functions remain the same...
  const fetchServices = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setServices(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  const fetchCalendarData = async (selectedDate: string) => {
    if (!selectedDate) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/by-date?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch calendar data")
      }
      const apiResponse: CalendarApiResponse = await response.json()

      if (apiResponse.success) {
        setCalendarData(apiResponse.data)
        const doctorIds = Object.keys(apiResponse.data)
        const doctorDetails = doctorIds.map((id) => ({
          id,
          name: apiResponse.data[id].name,
        }))
        setAvailableDoctors(doctorDetails)

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

  // Updated useEffect for multiple dates
  useEffect(() => {
    if (formData.appointmentDates.length > 0) {
      // Fetch calendar data for the first date to get available doctors
      fetchCalendarData(formData.appointmentDates[0])
      setFormData((prev) => ({
        ...prev,
        doctor: "",
        timeSlot: "",
      }))
    }
  }, [formData.appointmentDates])

  useEffect(() => {
    if (patientSearchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((patient) => {
        // Handle different ways child name might be stored
        const firstName = patient?.firstName || "";
        const lastName = patient?.lastName || "";
        const fullName = patient?.fullName || `${firstName} ${lastName}`.trim();
        const childName = patient?.childName || fullName || "";

        // Handle parent information
        const parentName = patient?.parentName || patient?.parentInfo?.name || "";
        const motherName = patient?.parentInfo?.motherName || "";

        // Handle contact information
        const phone = patient?.contactNumber || patient?.parentInfo?.phone || "";
        const motherPhone = patient?.parentInfo?.motherPhone || "";

        // Handle patient ID
        const patientId = patient?._id || patient?.id || "";

        // Search term in lowercase for case-insensitive search
        const searchTerm = patientSearchTerm.toLowerCase();

        return (
          // Search in child names
          firstName.toLowerCase().includes(searchTerm) ||
          lastName.toLowerCase().includes(searchTerm) ||
          fullName.toLowerCase().includes(searchTerm) ||
          childName.toLowerCase().includes(searchTerm) ||

          // Search in parent names
          parentName.toLowerCase().includes(searchTerm) ||
          motherName.toLowerCase().includes(searchTerm) ||

          // Search in phone numbers
          phone.includes(patientSearchTerm) ||
          motherPhone.includes(patientSearchTerm) ||

          // Search in patient ID
          patientId.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [patientSearchTerm, patients]);

  useEffect(() => {
    if (formData.doctor && calendarData[formData.doctor]) {
      const doctorSlots = calendarData[formData.doctor].slots
      const availableSlots = Object.keys(doctorSlots).filter((timeSlot) => doctorSlots[timeSlot] === null)
      setAvailableTimeSlots(availableSlots)
    } else {
      setAvailableTimeSlots([])
    }
  }, [formData.doctor, calendarData])

  useEffect(() => {
    fetchServices()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // New function to add date
  const addDate = () => {
    if (currentDateInput && !formData.appointmentDates.includes(currentDateInput)) {
      setFormData({
        ...formData,
        appointmentDates: [...formData.appointmentDates, currentDateInput],
      })
      setCurrentDateInput("")
    }
  }

  // New function to remove date
  const removeDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      appointmentDates: formData.appointmentDates.filter((date) => date !== dateToRemove),
    })
  }

  const calculateEndTime = (startTime: string): string => {
    const [time, period] = startTime.split(" ")
    const [hours, minutes] = time.split(":").map(Number)
    let totalMinutes = hours * 60 + minutes + 45
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

    if (
      !formData.doctor ||
      formData.appointmentDates.length === 0 ||
      !formData.timeSlot ||
      !formData.serviceId
    ) {
      toast.error("Please fill in all required fields and provide consent")
      return
    }

    setLoading(true)
    try {
      const endTime = calculateEndTime(formData.timeSlot)

      // Updated appointment data to include multiple dates
      const appointmentData = {
        patientId: selectedPatient?._id,
        patientName: formData.patientName || selectedPatient?.firstName + " " + selectedPatient?.lastName,
        fatherName: formData.fatherName || formData.patientName,
        email: formData.email,
        phone: formData.phone,
        serviceId: formData.serviceId,
        therapistId: formData?.doctor,
        dates: formData.appointmentDates, // Send multiple dates
        startTime: formData.timeSlot,
        endTime: endTime,
        type: formData.type,
        consultationMode: formData.consultationMode,
        notes: formData.notes,
        address: formData.address,
        paymentAmount: formData.paymentAmount,
        paymentMethod: formData.paymentMethod,
        consent: formData.consent,
        totalSessions: formData.totalSessions,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create appointments")
      }

      const result = await response.json()
      console.log("Successfully created appointments", result)
      toast.success(`${formData.appointmentDates.length} appointments scheduled successfully!`)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating appointments:", error)
      toast.error(error instanceof Error ? error.message : "Failed to schedule appointments")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      {/* Header - same as before */}
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
          {loading
            ? "Scheduling..."
            : `Schedule ${formData.appointmentDates.length || 1} Appointment${formData.appointmentDates.length > 1 ? "s" : ""} & Send Notification`}
        </button>
      </div>

      {/* Appointment Information Section - Updated */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Appointment Information</h2>

        {/* Multiple Appointments Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMultipleAppointments}
              onChange={(e) => {
                setIsMultipleAppointments(e.target.checked)
                if (!e.target.checked) {
                  setFormData({ ...formData, appointmentDates: [] })
                }
              }}
              className="w-4 h-4 text-[#C83C92] border-gray-300 rounded focus:ring-[#C83C92]"
            />
            <span className="text-[#1E437A] font-medium">Schedule Multiple Appointments</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Date Selection - Updated */}
          <div className="md:col-span-2">
            <label className="block text-[#1E437A] mb-2">
              {isMultipleAppointments ? "Select Multiple Dates *" : "Date *"}
            </label>

            {isMultipleAppointments ? (
              <div>
                {/* Add Date Input */}
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={currentDateInput}
                      onChange={(e) => setCurrentDateInput(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addDate}
                    disabled={!currentDateInput}
                    className="px-4 py-2 bg-[#C83C92] text-white rounded-lg hover:bg-[#B8358A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Selected Dates Display */}
                {formData.appointmentDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-[#1E437A] font-medium">
                      Selected Dates ({formData.appointmentDates.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.appointmentDates.map((date, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{new Date(date).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => removeDate(date)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="date"
                  value={formData.appointmentDates[0] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentDates: e.target.value ? [e.target.value] : [],
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                  placeholder="Select appointment date"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Rest of the form remains the same */}
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
                disabled={formData.appointmentDates.length === 0}
              >
                <option value="">
                  {formData.appointmentDates.length === 0 ? "Select date first" : "Select doctor"}
                </option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor?.id} value={doctor?.id}>
                    {doctor?.name}
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

          <div>
            <label className="block text-[#1E437A] mb-2" htmlFor="serviceId">
              Select Service *
            </label>
            <div className="relative">
              <select
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                required
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} - ${service.price}
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
        </div>
      </div>

      {/* Rest of the form sections remain exactly the same */}
      <form onSubmit={handleSubmit}>
        {/* Patient Selection Section - same as before */}
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
            </div>
          </div>

          {showPatientSearch && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by Patient ID, Name, or Phone Number..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient?._id}
                      onClick={() => {
                        setSelectedPatient(patient)
                        const childName = patient?.childName || patient?.fullName || ""
                        const parentName = patient?.parentName || patient?.parentInfo?.name || ""
                        const email = patient?.email || patient?.parentInfo?.email || ""
                        const phone = patient?.contactNumber || patient?.parentInfo?.phone || ""
                        const address = patient?.address || patient?.parentInfo?.address || ""
                        setFormData({
                          ...formData,
                          patientName: childName,
                          fatherName: parentName,
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
                          <div className="font-medium text-gray-900">
                            {patient?.childName || patient?.fullName || patient?.firstName + patient?.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Parent: {patient?.parentName || patient?.parentInfo?.name} | Phone:{" "}
                            {patient?.contactNumber || patient?.parentInfo?.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {patient?._id} | Gender: {patient?.childGender || "Not specified"}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{patient?.status}</div>
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
                ✓ Selected:{" "}
                <strong>
                  {selectedPatient?.childName ||
                    selectedPatient?.fullName ||
                    selectedPatient?.firstName + " " + selectedPatient?.lastName}
                </strong>
                <div className="text-xs mt-1">
                  Parent: {selectedPatient?.parentName || selectedPatient?.parentInfo?.name} | Phone:{" "}
                  {selectedPatient?.contactNumber || selectedPatient?.parentInfo?.phone}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consultation & Session Details Section - same as before */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Consultation & Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="consultationMode">
                Consultation Mode *
              </label>
              <div className="relative">
                <select
                  id="consultationMode"
                  name="consultationMode"
                  value={formData.consultationMode}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                  required
                >
                  <option value="in-person">In-Person</option>
                  <option value="video-call">Video Call</option>
                  <option value="phone">Phone</option>
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
              <label className="block text-[#1E437A] mb-2" htmlFor="type">
                Appointment Type *
              </label>
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                  required
                >
                  <option value="initial assessment">Initial Assessment</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="therapy session">Therapy Session</option>
                  <option value="other">Other</option>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="paymentAmount">
                Payment Amount ($)
              </label>
              <input
                type="number"
                id="paymentAmount"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter payment amount"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="paymentMethod">
              Payment Method
            </label>
            <div className="relative">
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
              >
                <option value="not_specified">Not Specified</option>
                <option value="cash">Cash</option>
                <option value="upi">Upi</option>
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
          <div className="flex mt-10 justify-end mb-6">
        <button
          className="flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Calendar className="w-5 h-5" />
          {loading
            ? "Scheduling..."
            : `Schedule ${formData.appointmentDates.length || 1} Appointment${formData.appointmentDates.length > 1 ? "s" : ""} & Send Notification`}
        </button>
      </div>
        </div>

        
      </form>
    </div>
  )
}

export default AppointmentSchedulingPage
