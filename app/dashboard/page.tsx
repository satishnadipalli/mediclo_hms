"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Plus, Search, Clock, User, Edit3, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Stethoscope, UserCheck } from "lucide-react"

interface Appointment {
  _id: string
  date: string
  timeSlot: string
  patientId: {
    childName: string
    _id: string
  }
  doctorId: {
    firstName: string
    lastName: string
    _id: string
  }
  parentInfo: {
    contactNumber: string
  }
  status: "scheduled" | "completed" | "cancelled" | "no_show"
}

// API Response interfaces
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
}

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }

      const data = await response.json()
      setAppointments(data.data)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An unknown error occurred while fetching appointments")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update status")
      }

      toast.success("Appointment status updated")
      fetchAppointments()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An unknown error occurred while updating status")
      }
    }
  }

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment?.patientId?.childName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      appointment?.doctorId?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      appointment?.doctorId?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="p-6 max-w-[90%] mt-15 ml-70 mx-auto">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Loading appointments...</h1>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto hide-scrollbar">
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Hello, Receptionist!</h1>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients or doctors..."
            className="pl-10 pr-4 py-2 bg-white w-110 border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium"
          onClick={() => router.push("/dashboard/scheduleAppoint")}
        >
          <Calendar className="w-5 h-5" />
          Schedule an Appointment
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
          <h2 className="text-xl font-semibold text-[#1E437A] ml-5">Doctor Schedule</h2>
        </div>

        <DoctorScheduleTable />
      </div>
    </div>
  )
}

const DoctorScheduleTable: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<CalendarApiResponse["data"]>({})
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ doctor: string; time: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  })

  // Predefined time slots
  const predefinedTimeSlots = [
    "09:15 AM",
    "10:00 AM",
    "10:45 AM",
    "11:30 AM",
    "12:15 PM",
    "01:00 PM",
    "01:45 PM",
    "02:30 PM",
    "03:15 PM",
    "04:00 PM",
    "04:45 PM",
    "05:30 PM",
    "06:15 PM",
    "07:00 PM",
  ]

  // Calculate end time (45 minutes after start time)
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

  // Handle reschedule click
  const handleRescheduleClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    setRescheduleData({
      date: selectedDate,
      startTime: "",
      endTime: "",
      reason: "",
    })
    setShowRescheduleModal(true)
  }

  // Handle reschedule submission
  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment || !rescheduleData.date || !rescheduleData.startTime) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${selectedAppointment.id}/reschedule`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            date: rescheduleData.date,
            startTime: rescheduleData.startTime,
            endTime: rescheduleData.endTime,
            reason: rescheduleData.reason,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to reschedule appointment")
      }

      toast.success("Appointment rescheduled successfully")
      setShowRescheduleModal(false)
      setSelectedAppointment(null)
      setRescheduleData({ date: "", startTime: "", endTime: "", reason: "" })
      fetchCalendarData() // Refresh the calendar
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      toast.error("Failed to reschedule appointment")
    }
  }

  // Extract time slots and doctors from API response
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [doctors, setDoctors] = useState<Array<{ name: string; specialty: string; color: string }>>([])

  useEffect(() => {
    fetchCalendarData()
  }, [])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/calendar`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch calendar data")
      }

      const apiResponse: CalendarApiResponse = await response.json()

      console.log("Calendar API Response:", apiResponse)

      if (apiResponse.success) {
        setScheduleData(apiResponse.data)

        if (Object.keys(apiResponse.data).length === 0) {
          console.log("No calendar data available")
          toast.info("No appointments scheduled")
        }

        // Extract doctors and time slots from API response
        const doctorNames = Object.keys(apiResponse.data)
        const firstDoctorSlots = doctorNames.length > 0 ? Object.keys(apiResponse.data[doctorNames[0]]) : []

        setTimeSlots(firstDoctorSlots)

        // Create doctor objects with colors
        const doctorColors = ["blue", "pink", "green", "purple", "indigo", "orange", "teal"]
        const doctorsData = doctorNames.map((name, index) => ({
          name,
          specialty: getSpecialtyFromName(name),
          color: doctorColors[index % doctorColors.length],
        }))

        setDoctors(doctorsData)
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast.error("Failed to fetch calendar data")
    } finally {
      setLoading(false)
    }
  }

  const getSpecialtyFromName = (doctorName: string): string => {
    const specialtyMap: { [key: string]: string } = {
      "Dr. Abhishek Mishra": "Pediatrics",
      "Dr. Staff User": "General Medicine",
      "Dr. satish test": "Cardiology",
    }
    return specialtyMap[doctorName] || "General Medicine"
  }

  const getAppointmentTypeColor = (type?: string, doctorColor?: string) => {
    const baseColors = {
      blue: "bg-blue-100 border-blue-300 text-blue-800",
      pink: "bg-pink-100 border-pink-300 text-pink-800",
      green: "bg-green-100 border-green-300 text-green-800",
      purple: "bg-purple-100 border-purple-300 text-purple-800",
      indigo: "bg-indigo-100 border-indigo-300 text-indigo-800",
      orange: "bg-orange-100 border-orange-300 text-orange-800",
      teal: "bg-teal-100 border-teal-300 text-teal-800",
    }

    if (type === "initial assessment") {
      return "bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-200"
    }
    if (type === "therapy session") {
      return "bg-green-100 border-green-400 text-green-800 ring-2 ring-green-200"
    }

    return baseColors[doctorColor as keyof typeof baseColors] || "bg-gray-100 border-gray-300 text-gray-800"
  }

  const getDoctorHeaderColor = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600",
      orange: "from-orange-500 to-orange-600",
      teal: "from-teal-500 to-teal-600",
    }
    return colors[color as keyof typeof colors] || "from-gray-500 to-gray-600"
  }

  const handleSlotClick = async (doctor: string, time: string) => {
    setSelectedSlot({ doctor, time })

    const appointment = scheduleData[doctor]?.[time]
    if (appointment) {
      console.log("Existing appointment clicked:", appointment)
    } else {
      console.log("Empty slot clicked:", { doctor, time })
    }
  }

  const formatTime = (time: string) => {
    return time
  }

  const getAppointmentCount = (doctorName: string) => {
    return Object.values(scheduleData[doctorName] || {}).filter(Boolean).length
  }

  const handleBookAppointment = async () => {
    if (!selectedSlot) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          doctorName: selectedSlot.doctor,
          timeSlot: selectedSlot.time,
          date: selectedDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to book appointment")
      }

      toast.success("Appointment booked successfully")
      fetchCalendarData()
      setSelectedSlot(null)
    } catch (error) {
      console.error("Error booking appointment:", error)
      toast.error("Failed to book appointment")
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete appointment")
      }

      toast.success("Appointment deleted successfully")
      fetchCalendarData()
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast.error("Failed to delete appointment")
    }
  }

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="p-2 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Doctor Schedule</h1>
                <p className="text-gray-600">Daily consultation schedule by doctor</p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchCalendarData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded ring-2 ring-blue-200"></div>
              <span className="text-sm text-gray-700">Initial Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded ring-2 ring-green-200"></div>
              <span className="text-sm text-gray-700">Therapy Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded border-dashed"></div>
              <span className="text-sm text-gray-700">Available Slot</span>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="p-4 bg-gradient-to-r from-slate-600 to-slate-700 text-left sticky left-0 z-10">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Clock className="w-5 h-5" />
                      Time
                    </div>
                  </th>
                  {doctors.map((doctor) => (
                    <th key={doctor.name} className="p-4 text-center min-w-[180px]">
                      <div
                        className={`bg-gradient-to-r ${getDoctorHeaderColor(doctor.color)} rounded-lg p-3 text-white`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <UserCheck className="w-5 h-5" />
                          <span className="font-semibold text-sm">{doctor.name}</span>
                        </div>
                        <div className="text-xs opacity-90">{doctor.specialty}</div>
                        <div className="text-xs opacity-75 mt-1">{getAppointmentCount(doctor.name)} appointments</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr
                    key={time}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${timeIndex % 2 === 0 ? "bg-gray-25" : "bg-white"}`}
                  >
                    {/* Time Column */}
                    <td className="p-4 border-r border-gray-200 bg-slate-50 sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                        <span className="font-medium text-gray-700 text-sm">{formatTime(time)}</span>
                      </div>
                    </td>

                    {/* Doctor Columns */}
                    {doctors.map((doctor) => {
                      const appointment = scheduleData[doctor.name]?.[time]
                      return (
                        <td
                          key={`${doctor.name}-${time}`}
                          className="p-2 border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleSlotClick(doctor.name, time)}
                        >
                          {appointment ? (
                            <div
                              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getAppointmentTypeColor(appointment.type, doctor.color)}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <p className="font-semibold text-xs truncate">{appointment.patientName}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white bg-opacity-60 rounded-full">
                                      {appointment.type}
                                    </span>
                                    <span className="text-xs opacity-70">{appointment.duration}min</span>
                                  </div>
                                  <div className="text-xs opacity-70">Status: {appointment.status}</div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRescheduleClick(appointment)
                                    }}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteAppointment(appointment.id)
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-25 transition-all min-h-[80px] flex items-center justify-center">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Selected: {selectedSlot.doctor} at {formatTime(selectedSlot.time)}
            </h3>
            <div className="flex gap-3">
              {!scheduleData[selectedSlot.doctor]?.[selectedSlot.time] ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleBookAppointment}
                >
                  Book Appointment
                </button>
              ) : (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  View Details
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setSelectedSlot(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Doctor Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.slice(0, 4).map((doctor) => (
            <div key={doctor.name} className="p-4 bg-white rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-r ${getDoctorHeaderColor(doctor.color)} rounded-lg`}>
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{doctor.name}</p>
                  <p className="text-xl font-bold text-gray-900">{getAppointmentCount(doctor.name)} patients</p>
                  <p className="text-xs text-gray-500">{doctor.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Reschedule Appointment</h3>
                    <p className="text-blue-100 text-sm">{selectedAppointment?.patientName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Current Appointment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Appointment</h4>
                <div className="text-sm text-gray-600">
                  <p>
                    Patient: <span className="font-medium">{selectedAppointment?.patientName}</span>
                  </p>
                  <p>
                    Type: <span className="font-medium">{selectedAppointment?.type}</span>
                  </p>
                  <p>
                    Duration: <span className="font-medium">{selectedAppointment?.duration} minutes</span>
                  </p>
                </div>
              </div>

              {/* New Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time Slot <span className="text-red-500">*</span>
                </label>
                <select
                  value={rescheduleData.startTime}
                  onChange={(e) => {
                    const startTime = e.target.value
                    const endTime = calculateEndTime(startTime)
                    setRescheduleData((prev) => ({
                      ...prev,
                      startTime,
                      endTime,
                    }))
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select time slot</option>
                  {predefinedTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time Display */}
              {rescheduleData.startTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time (Auto-calculated)</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {rescheduleData.endTime}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rescheduling (Optional)
                </label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for rescheduling..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={!rescheduleData.date || !rescheduleData.startTime}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reschedule Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceptionistDashboard
