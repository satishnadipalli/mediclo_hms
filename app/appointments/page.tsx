"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  CalendarDays,
  Stethoscope,
  MoreHorizontal,
  X,
  Edit3,
} from "lucide-react"

// Toast notification system (simple implementation)
const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  // Create toast element
  const toast = document.createElement("div")
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
    type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  }`
  toast.textContent = message
  // Add to DOM
  document.body.appendChild(toast)
  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateX(0)"
    toast.style.opacity = "1"
  }, 100)
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(100%)"
    toast.style.opacity = "0"
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// Enhanced interfaces for comprehensive appointment management
interface AppointmentDetails {
  _id: string
  id: string
  date: string
  startTime: string
  endTime: string
  patientName: string
  patientId: {
    _id: string
    fullName?: string
    childName?: string
    parentInfo?: {
      name: string
      phone: string
      email: string
    }
  }
  therapistId: {
    _id: string
    fullName: string
  }
  serviceId: {
    name: string
    price: number
  }
  type: "initial assessment" | "therapy session" | "follow-up" | "other"
  status: "scheduled" | "completed" | "cancelled" | "no-show" | "rescheduled" | "confirmed"
  consultationMode: "in-person" | "video-call" | "phone"
  payment: {
    amount: number
    status: "pending" | "paid" | "refunded"
    method: "cash" | "card" | "insurance" | "not_specified" | "upi"
    paidAmount?: number
  }
  totalSessions: number
  sessionsCompleted: number
  sessionsPaid: number
  phone: string
  email: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface AppointmentSummary {
  totalAppointments: number
  todayAppointments: number
  completedAppointments: number
  pendingAppointments: number
  cancelledAppointments: number
  totalRevenue: number
  pendingPayments: number
}

interface FilterOptions {
  status: string
  dateRange: string
  therapist: string
  paymentStatus: string
  consultationMode: string
}

// Enhanced Reschedule Modal Component with Payment Status Selection
const RescheduleModal: React.FC<{
  appointment: AppointmentDetails | null
  isOpen: boolean
  onClose: () => void
  onReschedule: (appointmentId: string, rescheduleData: any) => void
}> = ({ appointment, isOpen, onClose, onReschedule }) => {
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    paymentStatus: "pending", // New field for payment status
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      showToast("Failed to fetch available slots", "error")
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      // Determine default payment status based on original appointment
      let defaultPaymentStatus = "pending"
      if (appointment.payment.status === "refunded") {
        // If it was refunded (meaning it was paid before cancellation), default to paid
        defaultPaymentStatus = "paid"
      } else if (appointment.payment.status === "pending") {
        // If it was pending when cancelled, keep it pending
        defaultPaymentStatus = "pending"
      }

      setRescheduleData({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
        paymentStatus: defaultPaymentStatus,
      })
      setSelectedDoctorId(appointment.therapistId._id)
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
      showToast("Please select date and time", "error")
      return
    }
    if (!appointment) return

    console.log("Modal reschedule data:", rescheduleData) // Debug log

    setIsSubmitting(true)
    try {
      await onReschedule(appointment._id, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        therapistId: selectedDoctorId,
        reason: rescheduleData.reason,
        paymentStatus: rescheduleData.paymentStatus, // Make sure this is included
      })
      onClose()
    } catch (error) {
      console.error("Error rescheduling:", error)
      // Don't show toast here as it's handled in the parent function
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !appointment) return null

  // Check if the appointment was originally paid (now refunded)
  const wasOriginallyPaid = appointment.payment.status === "refunded"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#C83C92] to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reschedule Appointment</h3>
                <p className="text-purple-100 text-sm">{appointment?.patientName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
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
              </div>
              <div className="flex justify-between mt-1">
                <p>
                  Therapist: <span className="font-medium">{appointment?.therapistId.fullName}</span>
                </p>
                <p>
                  <span className="font-medium">45 minutes</span>
                </p>
              </div>
              <div className="flex justify-between mt-1">
                <p>
                  Payment:{" "}
                  <span
                    className={`font-medium ${appointment?.payment.status === "refunded" ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {appointment?.payment.status} (₹{appointment?.payment.amount})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status Selection */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-2 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-yellow-600" />
              Payment Status for Rescheduled Appointment
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              {wasOriginallyPaid
                ? "This appointment was paid before cancellation. Choose the payment status for the rescheduled appointment:"
                : "This appointment was not paid before cancellation. Choose the payment status for the rescheduled appointment:"}
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="paid"
                  checked={rescheduleData.paymentStatus === "paid"}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-black">
                  Paid - {wasOriginallyPaid ? "Keep as paid (refund was processed)" : "Mark as paid"}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="pending"
                  checked={rescheduleData.paymentStatus === "pending"}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                  className="text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-black">
                  Pending - {wasOriginallyPaid ? "Require new payment" : "Keep as pending"}
                </span>
              </label>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Available Time Slots <span className="text-red-500">*</span>
            </label>
            {loadingSlots ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
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
              placeholder="Enter reason for rescheduling..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRescheduleSubmit}
            disabled={!rescheduleData.date || !rescheduleData.startTime || loadingSlots || isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-[#C83C92] to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Rescheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Reschedule Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Status dropdown component
const StatusDropdown: React.FC<{
  currentStatus: string
  appointmentId: string
  onStatusUpdate: (appointmentId: string, newStatus: string) => void
  onClose: () => void
  position: { x: number; y: number }
}> = ({ currentStatus, appointmentId, onStatusUpdate, onClose, position }) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const statusOptions = [
    { value: "scheduled", label: "Scheduled", color: "text-blue-600", icon: Clock },
    { value: "confirmed", label: "Confirmed", color: "text-green-600", icon: CheckCircle },
    { value: "completed", label: "Completed", color: "text-green-700", icon: CheckCircle },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusUpdate(appointmentId, newStatus)
    }
    onClose()
  }

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[160px] animate-in fade-in duration-200"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 180)}px`,
        top: `${Math.min(position.y, window.innerHeight - 250)}px`,
      }}
    >
      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">Update Status</div>
      {statusOptions.map((option) => {
        const IconComponent = option.icon
        return (
          <button
            key={option.value}
            onClick={() => handleStatusSelect(option.value)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
              option.value === currentStatus ? "bg-blue-50 font-medium" : ""
            } ${option.color}`}
          >
            <IconComponent className="w-3 h-3" />
            <span className="flex-1">{option.label}</span>
            {option.value === currentStatus && <CheckCircle className="w-3 h-3 text-blue-600" />}
          </button>
        )
      })}
    </div>
  )
}

const AppointmentsEnhancedPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetails[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updating, setUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    dateRange: "all",
    therapist: "all",
    paymentStatus: "all",
    consultationMode: "all",
  })
  const [summary, setSummary] = useState<AppointmentSummary>({
    totalAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetails | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Status dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [statusDropdownData, setStatusDropdownData] = useState<{
    appointmentId: string
    currentStatus: string
    position: { x: number; y: number }
  } | null>(null)

  // Reschedule modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleAppointment, setRescheduleAppointment] = useState<AppointmentDetails | null>(null)

  // Double-click tracking
  const [lastClickTime, setLastClickTime] = useState<{ [key: string]: number }>({})
  const [clickTimeouts, setClickTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({})

  // Fetch appointments data
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("receptionToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.")
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const apiResponse = await response.json()
      console.log("API Response:", apiResponse)
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || "API returned unsuccessful response")
      }
      // Transform the data to match our interface
      const transformedAppointments = (apiResponse.data || []).map((apt: any) => ({
        _id: apt._id,
        id: apt._id,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        patientName: apt.patientName || apt.patientId?.fullName || apt.patientId?.childName || "Unknown",
        patientId: {
          _id: apt.patientId?._id || apt.patientId,
          fullName: apt.patientId?.fullName,
          childName: apt.patientId?.childName,
          parentInfo: apt.patientId?.parentInfo,
        },
        therapistId: {
          _id: apt.therapistId?._id || apt.therapistId,
          fullName: apt.therapistId?.fullName || "Unassigned",
        },
        serviceId: {
          name: apt.serviceId?.name || "Unknown Service",
          price: apt.serviceId?.price || 0,
        },
        type: apt.type || "therapy session",
        status: apt.status || "scheduled",
        consultationMode: apt.consultationMode || "in-person",
        payment: {
          amount: apt.payment?.amount || 0,
          status: apt.payment?.status || "pending",
          method: apt.payment?.method || "not_specified",
          paidAmount: apt.payment?.paidAmount || 0,
        },
        totalSessions: apt.totalSessions || 1,
        sessionsCompleted: apt.sessionsCompleted || 0,
        sessionsPaid: apt.sessionsPaid || 0,
        phone: apt.phone || "N/A",
        email: apt.email || "N/A",
        notes: apt.notes,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
      }))
      setAppointments(transformedAppointments)
      calculateSummary(transformedAppointments)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch appointments"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary statistics
  const calculateSummary = (appointmentsData: AppointmentDetails[]) => {
    const today = new Date().toDateString()
    const summary = appointmentsData.reduce(
      (acc, apt) => {
        acc.totalAppointments += 1
        if (new Date(apt.date).toDateString() === today) {
          acc.todayAppointments += 1
        }
        if (apt.status === "completed") {
          acc.completedAppointments += 1
        }
        if (apt.status === "scheduled" || apt.status === "rescheduled" || apt.status === "confirmed") {
          acc.pendingAppointments += 1
        }
        if (apt.status === "cancelled" || apt.status === "no-show") {
          acc.cancelledAppointments += 1
        }
        if (apt.payment.status === "paid") {
          acc.totalRevenue += apt.payment.amount
        } else if (apt.payment.status === "partial") {
          acc.totalRevenue += apt.payment.paidAmount || 0
        }
        if (apt.payment.status === "pending" || apt.payment.status === "partial") {
          acc.pendingPayments += 1
        }
        return acc
      },
      {
        totalAppointments: 0,
        todayAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        pendingPayments: 0,
      },
    )
    setSummary(summary)
  }

  // Handle status click (double-click detection)
  const handleStatusClick = (event: React.MouseEvent, appointmentId: string, currentStatus: string) => {
    event.preventDefault()
    event.stopPropagation()

    // If appointment is cancelled, handle reschedule instead
    if (currentStatus === "cancelled") {
      const appointment = appointments.find((apt) => apt._id === appointmentId)
      if (appointment) {
        handleRescheduleClick(appointment)
      }
      return
    }

    const now = Date.now()
    const lastClick = lastClickTime[appointmentId] || 0
    const timeDiff = now - lastClick

    // Clear any existing timeout for this appointment
    if (clickTimeouts[appointmentId]) {
      clearTimeout(clickTimeouts[appointmentId])
    }

    if (timeDiff < 400) {
      // Double click detected
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setStatusDropdownData({
        appointmentId,
        currentStatus,
        position: {
          x: rect.left,
          y: rect.bottom + 5,
        },
      })
      setShowStatusDropdown(true)
      setLastClickTime({ ...lastClickTime, [appointmentId]: 0 }) // Reset
    } else {
      // Single click - set timeout to reset if no second click
      setLastClickTime({ ...lastClickTime, [appointmentId]: now })
      const timeout = setTimeout(() => {
        setLastClickTime((prev) => ({ ...prev, [appointmentId]: 0 }))
      }, 400)
      setClickTimeouts({ ...clickTimeouts, [appointmentId]: timeout })
    }
  }

  // Handle reschedule click
  const handleRescheduleClick = (appointment: AppointmentDetails) => {
    setRescheduleAppointment(appointment)
    setShowRescheduleModal(true)
  }

  // Handle reschedule submission
  const handleRescheduleSubmit = async (appointmentId: string, rescheduleData: any) => {
    try {
      setUpdating(true)

      console.log("Sending reschedule data:", {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        therapistId: rescheduleData.therapistId,
        reason: rescheduleData.reason,
        paymentStatus: rescheduleData.paymentStatus, // Make sure this is included
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({
          date: rescheduleData.date,
          startTime: rescheduleData.startTime,
          endTime: rescheduleData.endTime,
          therapistId: rescheduleData.therapistId,
          reason: rescheduleData.reason,
          paymentStatus: rescheduleData.paymentStatus, // Explicitly send payment status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to reschedule appointment")
      }

      const result = await response.json()
      console.log("Reschedule response:", result)

      // Update local state immediately with the returned data
      if (result.success && result.data) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((apt) =>
            apt._id === appointmentId
              ? {
                  ...apt,
                  date: result.data.date,
                  startTime: result.data.startTime,
                  endTime: result.data.endTime,
                  status: result.data.status as any,
                  payment: {
                    ...apt.payment,
                    status: result.data.payment.status as any, // Use the status from server response
                  },
                  therapistId: {
                    ...apt.therapistId,
                    _id: result.data.therapistId._id || result.data.therapistId,
                  },
                  notes: result.data.notes,
                }
              : apt,
          ),
        )
      }

      setShowRescheduleModal(false)
      setRescheduleAppointment(null)

      showToast("Appointment rescheduled successfully", "success")

      // Refresh appointments after a short delay to ensure consistency
      setTimeout(() => {
        fetchAppointments()
      }, 1500)
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      showToast(error instanceof Error ? error.message : "Failed to reschedule appointment", "error")
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // Enhanced appointment status update function
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(true)
      const appointment = appointments.find((apt) => apt._id === appointmentId)
      if (!appointment) {
        throw new Error("Appointment not found")
      }

      // Prepare updates based on status
      const updates: any = {
        status: newStatus,
      }

      // Add specific logic for different statuses
      if (newStatus === "completed") {
        updates.sessionsCompleted = Math.min((appointment.sessionsCompleted || 0) + 1, appointment.totalSessions)
        // Auto-set payment to paid if amount > 0 and currently pending
        if (appointment.payment.amount > 0 && appointment.payment.status === "pending") {
          updates.payment = {
            ...appointment.payment,
            status: "paid",
          }
        }
      } else if (newStatus === "cancelled") {
        // Handle payment status based on current payment status
        if (appointment.payment.status === "paid") {
          updates.payment = {
            ...appointment.payment,
            status: "refunded",
          }
        }
        // If payment was pending, keep it as pending (don't change to refunded)
      }

      const token = localStorage.getItem("receptionToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/updateappointment/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update appointment status")
      }

      // Update local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((apt) =>
          apt._id === appointmentId
            ? {
                ...apt,
                status: newStatus as any,
                ...(updates.sessionsCompleted && { sessionsCompleted: updates.sessionsCompleted }),
                ...(updates.payment && { payment: { ...apt.payment, ...updates.payment } }),
              }
            : apt,
        ),
      )

      // Show success message based on status
      const statusMessages = {
        completed: "Appointment marked as completed!",
        cancelled: "Appointment cancelled successfully",
        confirmed: "Appointment confirmed",
        scheduled: "Appointment rescheduled",
        "no-show": "Appointment marked as no-show",
        rescheduled: "Appointment marked for rescheduling",
      }

      showToast(
        statusMessages[newStatus as keyof typeof statusMessages] || "Appointment updated successfully",
        "success",
      )

      // Recalculate summary
      const updatedAppointments = appointments.map((apt) =>
        apt._id === appointmentId ? { ...apt, status: newStatus as any } : apt,
      )
      calculateSummary(updatedAppointments)
    } catch (error) {
      console.error("Update error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update appointment status"
      showToast(errorMessage, "error")
    } finally {
      setUpdating(false)
    }
  }

  // Get patient display name
  const getPatientName = (appointment: AppointmentDetails): string => {
    return (
      appointment.patientName ||
      appointment.patientId?.fullName ||
      appointment.patientId?.childName ||
      "Unknown Patient"
    )
  }

  // Get contact info
  const getContactInfo = (appointment: AppointmentDetails): string => {
    return appointment.phone || appointment.patientId?.parentInfo?.phone || "N/A"
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "no-show":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  // Format time
  const formatTime = (timeStr: string) => {
    return timeStr
  }

  // Open appointment details modal
  const openDetailsModal = (appointment: AppointmentDetails) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  // Export appointments report
  const exportAppointmentsReport = () => {
    try {
      const csvContent = [
        [
          "Date",
          "Time",
          "Patient Name",
          "Therapist",
          "Service",
          "Type",
          "Status",
          "Payment Status",
          "Amount",
          "Contact",
          "Mode",
        ],
        ...filteredAppointments.map((apt) => [
          formatDate(apt.date),
          apt.startTime,
          getPatientName(apt),
          apt.therapistId.fullName,
          apt.serviceId.name,
          apt.type,
          apt.status,
          apt.payment.status,
          apt.payment.amount.toString(),
          getContactInfo(apt),
          apt.consultationMode,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `appointments-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast("Report exported successfully", "success")
    } catch (error) {
      console.error("Error exporting report:", error)
      showToast("Failed to export report", "error")
    }
  }

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      getPatientName(appointment).toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.therapistId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.serviceId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContactInfo(appointment).includes(searchTerm)

    const matchesStatus = filters.status === "all" || appointment.status === filters.status
    const matchesPaymentStatus = filters.paymentStatus === "all" || appointment.payment.status === filters.paymentStatus
    const matchesTherapist = filters.therapist === "all" || appointment.therapistId._id === filters.therapist
    const matchesMode = filters.consultationMode === "all" || appointment.consultationMode === filters.consultationMode

    // Date range filter
    let matchesDateRange = true
    if (filters.dateRange !== "all") {
      const appointmentDate = new Date(appointment.date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)

      switch (filters.dateRange) {
        case "today":
          matchesDateRange = appointmentDate.toDateString() === today.toDateString()
          break
        case "tomorrow":
          matchesDateRange = appointmentDate.toDateString() === tomorrow.toDateString()
          break
        case "week":
          matchesDateRange = appointmentDate >= today && appointmentDate <= weekFromNow
          break
        case "past":
          matchesDateRange = appointmentDate < today
          break
      }
    }

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesTherapist && matchesMode && matchesDateRange
  })

  // Get unique therapists for filter
  const uniqueTherapists = Array.from(new Set(appointments.map((apt) => apt.therapistId._id))).map((id) => {
    const therapist = appointments.find((apt) => apt.therapistId._id === id)?.therapistId
    return { id, name: therapist?.fullName || "Unknown" }
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showStatusDropdown) {
        setShowStatusDropdown(false)
        setStatusDropdownData(null)
      }
    }
    if (showStatusDropdown) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [showStatusDropdown])

  if (loading) {
    return (
      <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C83C92] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#1E437A]">Loading appointments...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 font-sans max-w-[84%] mt-15 ml-70 mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Appointments</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAppointments}
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
      {/* Loading overlay */}
      {updating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-2 border-[#C83C92] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#1E437A]">Updating appointment...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-2">Appointments Management</h1>
        <p className="text-gray-600">Manage and track all patient appointments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-[#1E437A]">{summary.totalAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-xl font-bold text-orange-600">{summary.todayAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{summary.completedAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-blue-600">{summary.pendingAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-xl font-bold text-red-600">{summary.cancelledAppointments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-xl font-bold text-green-600">₹{summary.totalRevenue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Pay</p>
              <p className="text-xl font-bold text-yellow-600">{summary.pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by patient name, therapist, service, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportAppointmentsReport}
            className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium hover:bg-[#C83C9230] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="past">Past Appointments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Therapist</label>
              <select
                value={filters.therapist}
                onChange={(e) => setFilters({ ...filters, therapist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Therapists</option>
                {uniqueTherapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                value={filters.consultationMode}
                onChange={(e) => setFilters({ ...filters, consultationMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Modes</option>
                <option value="in-person">In-Person</option>
                <option value="video-call">Video Call</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white rounded-lg border pb-10 border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1E437A]">
            Appointments Overview ({filteredAppointments.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Double-click on status to update • Double-click on cancelled appointments to reschedule
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9F9FC]">
              <tr className="text-left text-[#1E437A]">
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Therapist</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-[#456696]">{formatDate(appointment.date)}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{appointment.consultationMode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-[#456696]">{getPatientName(appointment)}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {getContactInfo(appointment)}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{appointment.type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-100 rounded">
                        <Stethoscope className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="font-medium text-[#456696]">{appointment.therapistId.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-[#456696]">{appointment.serviceId.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:shadow-md transition-all select-none ${getStatusColor(appointment.status)}`}
                      onClick={(e) => handleStatusClick(e, appointment._id, appointment.status)}
                      title={
                        appointment.status === "cancelled"
                          ? "Double-click to reschedule"
                          : "Double-click to change status"
                      }
                    >
                      {appointment.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "scheduled" && <Clock className="w-3 h-3 mr-1" />}
                      {appointment.status === "confirmed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "no-show" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "rescheduled" && <Calendar className="w-3 h-3 mr-1" />}
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment.status)}`}
                      >
                        <IndianRupee className="w-3 h-3 mr-1" />
                        {appointment.payment.status}
                      </span>
                      <div className="text-xs text-gray-500">₹{appointment.payment.amount}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(appointment)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {appointment.status === "cancelled" && (
                        <button
                          onClick={() => handleRescheduleClick(appointment)}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                          title="Reschedule Appointment"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="relative group p-3">
                        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[120px]">
                          {appointment.status === "scheduled" && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, "completed")}
                              className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              Mark Complete
                            </button>
                          )}
                          {appointment.status !== "cancelled" && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, "cancelled")}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAppointments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || Object.values(filters).some((f) => f !== "all")
              ? "No appointments found matching your criteria."
              : "No appointments found."}
          </div>
        )}
      </div>

      {/* Status Dropdown */}
      {showStatusDropdown && statusDropdownData && (
        <StatusDropdown
          currentStatus={statusDropdownData.currentStatus}
          appointmentId={statusDropdownData.appointmentId}
          onStatusUpdate={updateAppointmentStatus}
          onClose={() => {
            setShowStatusDropdown(false)
            setStatusDropdownData(null)
          }}
          position={statusDropdownData.position}
        />
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={rescheduleAppointment}
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false)
          setRescheduleAppointment(null)
        }}
        onReschedule={handleRescheduleSubmit}
      />

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
          onStatusUpdate={updateAppointmentStatus}
        />
      )}
    </div>
  )
}

// Appointment Details Modal Component
const AppointmentDetailsModal: React.FC<{
  appointment: AppointmentDetails
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (appointmentId: string, status: string) => void
}> = ({ appointment, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-emerald-100 text-emerald-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-orange-100 text-orange-800"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800"
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
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1E437A]">Appointment Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Appointment Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696] font-medium">
                    {appointment.patientName || appointment.patientId?.fullName || "Unknown"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696] font-medium">{appointment.therapistId.fullName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <div className="text-[#456696] font-medium">{appointment.serviceId.name}</div>
                <div className="text-sm text-gray-500">₹{appointment.serviceId.price}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696] font-medium">{new Date(appointment.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696]">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696]">{appointment.phone}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-[#456696]">{appointment.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}
              >
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(appointment.payment.status)}`}
              >
                <IndianRupee className="w-3 h-3 mr-1" />
                {appointment.payment.status}
              </span>
              <div className="text-sm text-gray-500 mt-1">
                Amount: ₹{appointment.payment.amount} | Method: {appointment.payment.method}
              </div>
            </div>
          </div>

          {/* Sessions Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Progress</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-[#1E437A]">{appointment.totalSessions}</div>
                <div className="text-xs text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{appointment.sessionsCompleted}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{appointment.sessionsPaid}</div>
                <div className="text-xs text-gray-600">Paid</div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <span className="text-[#456696] capitalize">{appointment.type}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Mode</label>
              <span className="text-[#456696] capitalize">{appointment.consultationMode}</span>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <div className="p-3 bg-gray-50 rounded-lg text-[#456696]">{appointment.notes}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {appointment.status === "scheduled" && (
            <button
              onClick={() => {
                onStatusUpdate(appointment._id, "completed")
                onClose()
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </button>
          )}
          {appointment.status !== "cancelled" && (
            <button
              onClick={() => {
                onStatusUpdate(appointment._id, "cancelled")
                onClose()
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppointmentsEnhancedPage
