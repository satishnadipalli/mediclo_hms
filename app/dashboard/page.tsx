"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Plus, Clock, User, Edit3, Trash2, X, CheckCircle, Banknote, AlertCircle } from "lucide-react"
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

// Enhanced API Response interfaces
interface CalendarAppointment {
  id: string
  patientId: string
  doctorId: string
  patientName: string
  type: "initial assessment" | "therapy session" | "follow-up" | "other"
  status:
    | "scheduled"
    | "rescheduled"
    | "cancelled"
    | "no-show"
    | "pending-assignment"
    | "pending_confirmation"
    | "converted"
    | "completed"
  duration: number
  // Payment information
  payment: {
    amount: number
    status: "pending" | "paid" | "refunded"
    method: "card" | "cash" | "insurance" | "not_specified"
  }
  // Session information
  totalSessions: number
  sessionsPaid: number
  sessionsCompleted: number
  // Additional fields
  phone: string
  email: string
  notes?: string
}

interface CalendarApiResponse {
  success: boolean
  data: {
    [doctorName: string]: {
      [timeSlot: string]: CalendarAppointment | null
    }
  }
}

// Enhanced Status Update Modal Component
const StatusUpdateModal: React.FC<{
  appointment: CalendarAppointment
  isOpen: boolean
  onClose: () => void
  onUpdate: (appointmentId: string, updates: any) => void
}> = ({ appointment, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState(appointment?.status || "scheduled")
  const [paymentStatus, setPaymentStatus] = useState(appointment?.payment?.status || "pending")
  const [paymentAmount, setPaymentAmount] = useState(appointment?.payment?.amount || 0)
  const [paymentMethod, setPaymentMethod] = useState(appointment?.payment?.method || "not_specified")
  const [notes, setNotes] = useState(appointment?.notes || "")
  const [sessionsCompleted, setSessionsCompleted] = useState(appointment?.sessionsCompleted || 0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Reset form when appointment changes or modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      setStatus(appointment.status || "scheduled")
      setPaymentStatus(appointment.payment?.status || "pending")
      setPaymentAmount(appointment.payment?.amount || 0)
      setPaymentMethod(appointment.payment?.method || "not_specified")
      setNotes(appointment.notes || "")
      setSessionsCompleted(appointment.sessionsCompleted || 0)
      setValidationErrors([])
    }
  }, [appointment, isOpen])

  // Auto-increment sessions when status changes to completed
  useEffect(() => {
    if (status === "completed" && appointment) {
      // Only auto-increment if current sessionsCompleted is less than what we're setting
      const currentCompleted = appointment.sessionsCompleted || 0
      if (sessionsCompleted <= currentCompleted) {
        const newCompleted = Math.min(currentCompleted + 1, appointment.totalSessions || 0)
        setSessionsCompleted(newCompleted)
      }
      // Auto-set payment to paid if amount is greater than 0 and status is pending
      if (paymentAmount > 0 && paymentStatus === "pending") {
        setPaymentStatus("paid")
      }
    }
  }, [status, appointment, paymentAmount, paymentStatus, sessionsCompleted])

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = []
    if (!status) {
      errors.push("Status is required")
    }
    if (sessionsCompleted > (appointment?.totalSessions || 0)) {
      errors.push(`Sessions completed cannot exceed total sessions (${appointment?.totalSessions})`)
    }
    if (sessionsCompleted < 0) {
      errors.push("Sessions completed cannot be negative")
    }
    if (paymentAmount < 0) {
      errors.push("Payment amount cannot be negative")
    }
    // If marking as completed, ensure at least one session is completed
    if (status === "completed" && sessionsCompleted === 0) {
      errors.push("At least one session must be completed when marking as completed")
    }
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors")
      return
    }
    setIsUpdating(true)
    try {
      const updates = {
        status,
        payment: {
          amount: paymentAmount,
          status: paymentStatus,
          method: paymentMethod,
        },
        notes,
        sessionsCompleted,
      }
      await onUpdate(appointment?.id, updates)
      onClose()
      // Show success message based on status
      if (status === "completed") {
        toast.success(`Appointment completed! Session ${sessionsCompleted}/${appointment?.totalSessions} recorded.`)
      } else {
        toast.success("Appointment updated successfully")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update appointment")
    } finally {
      setIsUpdating(false)
    }
  }

  // Quick complete function
  const handleQuickComplete = () => {
    setStatus("completed")
    const newCompleted = Math.min((appointment?.sessionsCompleted || 0) + 1, appointment?.totalSessions || 0)
    setSessionsCompleted(newCompleted)
    if (paymentAmount > 0) {
      setPaymentStatus("paid")
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r bg-[#C83C92] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Update Appointment</h3>
                <p className="text-purple-100 text-sm">{appointment?.patientName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-2">Appointment Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p>
                  Patient: <span className="font-medium">{appointment?.patientName}</span>
                </p>
                <p>
                  Type: <span className="font-medium">{appointment?.type}</span>
                </p>
                <p>
                  Duration: <span className="font-medium">{appointment?.duration} min</span>
                </p>
              </div>
              <div>
                <p>
                  Phone: <span className="font-medium">{appointment?.phone}</span>
                </p>
                <p>
                  Sessions:{" "}
                  <span className="font-medium">
                    {appointment?.sessionsCompleted}/{appointment?.totalSessions}
                  </span>
                </p>
                <p>
                  Paid Sessions: <span className="font-medium">{appointment?.sessionsPaid}</span>
                </p>
              </div>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleQuickComplete}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              Quick Complete Session
            </button>
            <button
              onClick={() => {
                setStatus("cancelled")
                setPaymentStatus("refunded")
              }}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Cancel Appointment
            </button>
          </div>
          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Appointment Status <span className="text-red-500">*</span>
            </label>
            <select
              style={{ color: "black" }}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
          {/* Payment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Payment Status</label>
              <select
                style={{ color: "black" }}
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Payment Method</label>
              <select
                style={{ color: "black" }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="not_specified">Not Specified</option>
                <option value="cash">Cash</option>
                <option value="upi">Upi</option>
              </select>
            </div>
          </div>
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Payment Amount</label>
            <input
              style={{ color: "black" }}
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter amount"
            />
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Notes</label>
            <textarea
              style={{ color: "black" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the appointment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        </div>
        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating || validationErrors.length > 0}
            className="px-6 py-2 bg-gradient-to-r bg-[#C83C92] text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Update Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Reschedule Modal with availability checking
const RescheduleModal: React.FC<{
  appointment: CalendarAppointment | null
  isOpen: boolean
  onClose: () => void
  onReschedule: (appointmentId: string, rescheduleData: any) => void
}> = ({ appointment, isOpen, onClose, onReschedule }) => {
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")

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

  // Fetch available slots when date changes
  const fetchAvailableSlots = async (selectedDate: string, doctorId: string) => {
    if (!selectedDate || !doctorId) return
    setLoadingSlots(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/by-date?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch availability")
      }
      const apiResponse = await response.json()
      if (apiResponse.success && apiResponse.data[doctorId]) {
        const doctorSlots = apiResponse.data[doctorId].slots
        const availableSlots = Object.keys(doctorSlots).filter((timeSlot) => doctorSlots[timeSlot] === null)
        setAvailableSlots(availableSlots)
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("Error fetching available slots:", error)
      toast.error("Failed to fetch available slots")
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      setRescheduleData({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
      })
      setSelectedDoctorId(appointment.doctorId)
      setAvailableSlots([])
    }
  }, [appointment, isOpen])

  // Fetch available slots when date or doctor changes
  useEffect(() => {
    if (rescheduleData.date && selectedDoctorId) {
      fetchAvailableSlots(rescheduleData.date, selectedDoctorId)
    }
  }, [rescheduleData.date, selectedDoctorId])

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.startTime) {
      toast.error("Please select date and time")
      return
    }
    if (!appointment) return
    try {
      await onReschedule(appointment.id, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        therapistId: selectedDoctorId,
        reason: rescheduleData.reason,
      })
      onClose()
      toast.success("Appointment rescheduled successfully")
    } catch (error) {
      console.error("Error rescheduling:", error)
      toast.error("Failed to reschedule appointment")
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r bg-[#C83C92] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reschedule Appointment</h3>
                <p className="text-blue-100 text-sm">{appointment?.patientName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6 space-y-3 -mt-3">
          {/* Current Appointment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-2">Current Appointment</h4>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <p>
                  Patient: <span className="font-medium">{appointment?.patientName}</span>
                </p>
                <p>
                  <span className="font-medium">{appointment?.type}</span>
                </p>
                <p>
                  <span className="font-medium">{appointment?.duration} minutes</span>
                </p>
              </div>
            </div>
          </div>
          {/* New Date Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              New Date <span className="text-red-500">*</span>
            </label>
            <input
              style={{ color: "black" }}
              type="date"
              value={rescheduleData.date}
              onChange={(e) => {
                setRescheduleData((prev) => ({ ...prev, date: e.target.value, startTime: "", endTime: "" }))
              }}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Available Time Slots <span className="text-red-500">*</span>
            </label>
            {loadingSlots ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600">Loading available slots...</span>
              </div>
            ) : (
              <select
                style={{ color: "black" }}
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
                disabled={!rescheduleData.date}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">{!rescheduleData.date ? "Select date first" : "Select available time slot"}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            )}
            {rescheduleData.date && availableSlots.length === 0 && !loadingSlots && (
              <p className="text-sm text-red-500 mt-1">No available slots for selected date</p>
            )}
          </div>
          {/* End Time Display */}
          {rescheduleData.startTime && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">End Time (Auto-calculated)</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black">
                {rescheduleData.endTime}
              </div>
            </div>
          )}
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Reason for Rescheduling (Optional)</label>
            <textarea
              style={{ color: "black" }}
              value={rescheduleData.reason}
              onChange={(e) => setRescheduleData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder=""
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRescheduleSubmit}
            disabled={!rescheduleData.date || !rescheduleData.startTime || loadingSlots}
            className="px-6 py-2 bg-gradient-to-r bg-[#C83C92] text-white rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reschedule Appointment
          </button>
        </div>
      </div>
    </div>
  )
}

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("receptionToken")
    if (!token) {
      router.push("/login")
      return
    }
  }, [])

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    console.log("zymy")
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update status")
      }
      toast.success("Appointment status updated")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An unknown error occurred while updating status")
      }
    }
  }

  return (
    <div className="min-h-screen w-full">
      {/* Fixed container that accounts for sidebar */}
      <div className="ml-[300px]  w-[calc(100vw-300px)] p-6 pt-22 overflow-hidden">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Hello, Receptionist!</h1>
        <div className="flex gap-4 mb-6">
          <button
            className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium"
            onClick={() => router.push("/dashboard/scheduleAppointment")}
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#1E437A] ml-5">Doctor Schedule</h2>
          </div>
          <DoctorScheduleTable />
        </div>
      </div>
    </div>
  )
}

const DoctorScheduleTable: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<CalendarApiResponse["data"]>({})
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ doctor: string; time: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

  // Handle status update click
  const handleStatusClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    setShowStatusModal(true)
  }

  // Handle reschedule click
  const handleRescheduleClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    setShowRescheduleModal(true)
  }

  // Enhanced appointment update handler - SINGLE APPOINTMENT UPDATE
  const handleAppointmentUpdate = async (appointmentId: string, updates: any) => {
    console.log("sfkj")
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/updateappointment/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
          },
          body: JSON.stringify(updates),
        },
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update appointment")
      }
      const result = await response.json()
      // Update local state with the updated appointment data
      setScheduleData((prevData) => {
        const newData = { ...prevData }
        // Find and update the appointment in the schedule data
        Object.keys(newData).forEach((doctorName) => {
          Object.keys(newData[doctorName]).forEach((timeSlot) => {
            const appointment = newData[doctorName][timeSlot]
            if (appointment && appointment?.id === appointmentId) {
              // Update the appointment with new data from server response
              newData[doctorName][timeSlot] = {
                ...appointment,
                ...updates,
                // Use server response data if available
                ...(result.data && {
                  status: result.data.status,
                  sessionsCompleted: result.data.sessionsCompleted,
                  payment: result.data.payment,
                  notes: result.data.notes,
                }),
              }
            }
          })
        })
        return newData
      })
      // Refresh the calendar to get latest data
      setTimeout(() => {
        fetchCalendarData()
      }, 1000)
    } catch (error) {
      console.error("Error updating appointment:", error)
      throw error
    }
  }

  // Handle reschedule submission with availability checking
  const handleRescheduleSubmit = async (appointmentId: string, rescheduleData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify(rescheduleData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to reschedule appointment")
      }
      setShowRescheduleModal(false)
      setSelectedAppointment(null)
      fetchCalendarData() // Refresh the calendar
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      throw error
    }
  }

  // Extract time slots and doctors from API response
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [doctors, setDoctors] = useState<Array<{ name: string; specialty: string; color: string }>>([])

  useEffect(() => {
    fetchCalendarData()
  }, [selectedDate])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/calendar?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
          },
        },
      )
      if (!response.ok) {
        throw new Error("Failed to fetch calendar data")
      }
      const apiResponse: CalendarApiResponse = await response.json()
      if (apiResponse.success) {
        setScheduleData(apiResponse.data)
        if (Object.keys(apiResponse.data).length === 0) {
          console.log("No calendar data available")
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
    return specialtyMap[doctorName]
  }

  // Enhanced appointment styling with status and payment indicators
  const getAppointmentTypeColor = (appointment: CalendarAppointment, doctorColor?: string) => {
    const baseColors = {
      blue: "bg-blue-100 border-blue-300 text-blue-800",
      pink: "bg-pink-100 border-pink-300 text-pink-800",
      green: "bg-green-100 border-green-300 text-green-800",
      purple: "bg-purple-100 border-purple-300 text-purple-800",
      indigo: "bg-indigo-100 border-indigo-300 text-indigo-800",
      orange: "bg-orange-100 border-orange-300 text-orange-800",
      teal: "bg-teal-100 border-teal-300 text-teal-800",
    }
    // Status-based styling
    if (appointment?.status === "completed") {
      return "bg-green-100 border-green-400 text-green-800 ring-2 ring-green-200"
    }
    if (appointment?.status === "cancelled") {
      return "bg-red-100 border-red-400 text-red-800 ring-2 ring-red-200"
    }
    if (appointment?.status === "no-show") {
      return "bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-200"
    }
    // Type-based styling for scheduled appointments
    if (appointment?.type === "initial assessment") {
      return "bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-200"
    }
    if (appointment?.type === "therapy session") {
      return "bg-purple-100 border-purple-400 text-purple-800 ring-2 ring-purple-200"
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

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
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

  // Get payment status icon
  const getPaymentStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Banknote className="w-3 h-3 text-green-600" />
      case "pending":
        return <AlertCircle className="w-3 h-3 text-yellow-600" />
      case "refunded":
        return <Banknote className="w-3 h-3 text-red-600" />
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case "cancelled":
        return <X className="w-3 h-3 text-red-600" />
      case "no-show":
        return <AlertCircle className="w-3 h-3 text-orange-600" />
      default:
        return <Clock className="w-3 h-3 text-blue-600" />
    }
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
    <div className="w-full bg-gradient-to-br font-sans from-slate-50 to-blue-50 min-h-screen overflow-hidden">
      <div className="w-full p-2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Doctor Schedule</h1>
                <p className="text-gray-600">Daily consultation schedule with status & payment tracking</p>
              </div>
            </div>
            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <input
                type="date"
                style={{ color: "black" }}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchCalendarData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          {/* Enhanced Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded ring-2 ring-blue-200"></div>
              <span className="text-sm text-black">Initial Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded ring-2 ring-purple-200"></div>
              <span className="text-sm text-black">Therapy Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded ring-2 ring-green-200"></div>
              <span className="text-sm text-black">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-600" />
              <span className="text-sm text-black">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-black">Payment Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded border-dashed"></div>
              <span className="text-sm text-black">Available Slot</span>
            </div>
          </div>
        </div>
        {/* Schedule Table with Enhanced Horizontal Scroll */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full">
          {/* Custom Scroll Container with Enhanced Styling */}
          <div
            className="overflow-x-auto scrollbar-smooth w-full"
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "thin",
              scrollbarColor: "#C83C92 #f1f5f9",
            }}
          >
            <style jsx>{`
              .scrollbar-smooth::-webkit-scrollbar {
                height: 12px;
              }
              .scrollbar-smooth::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 6px;
                margin: 0 10px;
              }
              .scrollbar-smooth::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, #C83C92, #9333ea);
                border-radius: 6px;
                border: 2px solid #f1f5f9;
              }
              .scrollbar-smooth::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, #a21e6b, #7c3aed);
              }
              .scrollbar-smooth::-webkit-scrollbar-corner {
                background: #f1f5f9;
              }
            `}</style>
            <table className="w-full min-w-max">
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="p-4 bg-gradient-to-r from-slate-600 to-slate-700 text-left sticky left-0 z-10 min-w-[120px]">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Clock className="w-5 h-5" />
                      Time
                    </div>
                  </th>
                  {doctors.map((doctor) => (
                    <th key={doctor.name} className="p-4 text-center min-w-[200px]">
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
                    <td className="p-4 border-r border-gray-200 bg-slate-50 sticky left-0 z-10 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                        <span className="font-medium text-black text-sm">{formatTime(time)}</span>
                      </div>
                    </td>
                    {/* Doctor Columns */}
                    {doctors.map((doctor) => {
                      const appointment = scheduleData[doctor.name]?.[time]
                      return (
                        <td
                          key={`${doctor.name}-${time}`}
                          className="p-2 border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors min-w-[200px]"
                          onClick={() => handleSlotClick(doctor.name, time)}
                        >
                          {appointment ? (
                            <div
                              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getAppointmentTypeColor(appointment, doctor.color)}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <p className="font-semibold text-xs truncate">{appointment?.patientName}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white bg-opacity-60 rounded-full">
                                      {appointment?.type?.substring(0, 8)}
                                    </span>
                                    <span className="text-xs opacity-70">{appointment?.duration}min</span>
                                  </div>
                                  {/* Status and Payment Row */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(appointment?.status)}
                                      <span className="text-xs font-medium capitalize">{appointment?.status}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {getPaymentStatusIcon(appointment?.payment?.status)}
                                      <span className="text-xs">₹{appointment?.payment?.amount}</span>
                                    </div>
                                  </div>
                                  {/* Sessions Progress */}
                                  <div className="text-xs opacity-70">
                                    Sessions: {appointment?.sessionsCompleted}/{appointment?.totalSessions}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusClick(appointment)
                                    }}
                                    title="Update Status & Payment"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRescheduleClick(appointment)
                                    }}
                                    title="Reschedule"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteAppointment(appointment?.id)
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-25 transition-all min-h-[100px] flex items-center justify-center">
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
          {/* Scroll Indicator */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>← Scroll horizontally to view all doctors →</span>
            </div>
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Book Appointment
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => {
                    const appointment = scheduleData[selectedSlot.doctor]?.[selectedSlot.time]
                    if (appointment) handleStatusClick(appointment)
                  }}
                >
                  Update Status
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setSelectedSlot(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* Enhanced Doctor Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.slice(0, 4).map((doctor) => {
            const doctorAppointments = Object.values(scheduleData[doctor.name] || {}).filter(
              Boolean,
            ) as CalendarAppointment[]
            const completedCount = doctorAppointments.filter((apt) => apt.status === "completed").length
            const paidCount = doctorAppointments.filter((apt) => apt.payment?.status === "paid").length
            const totalRevenue = doctorAppointments
              .filter((apt) => apt.payment?.status === "paid")
              .reduce((sum, apt) => sum + apt.payment?.amount, 0)
            return (
              <div key={doctor.name} className="p-4 bg-white rounded-xl shadow-sm border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-gradient-to-r ${getDoctorHeaderColor(doctor.color)} rounded-lg`}>
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{doctor.name}</p>
                    <p className="text-xs text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{getAppointmentCount(doctor.name)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-green-600">{completedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-blue-600">{paidCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-green-600">₹{totalRevenue}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Status Update Modal */}
      <StatusUpdateModal
        appointment={selectedAppointment!}
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false)
          setSelectedAppointment(null)
        }}
        onUpdate={handleAppointmentUpdate}
      />
      {/* Enhanced Reschedule Modal with Availability Checking */}
      <RescheduleModal
        appointment={selectedAppointment}
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false)
          setSelectedAppointment(null)
        }}
        onReschedule={handleRescheduleSubmit}
      />
    </div>
  )
}

export default ReceptionistDashboard
