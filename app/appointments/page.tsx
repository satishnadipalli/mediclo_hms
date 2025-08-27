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
  ChevronDown,
  ChevronRight,
  Users,
  UserCheck,
} from "lucide-react"

// Toast notification system
const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  const toast = document.createElement("div")
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
    type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  }`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.transform = "translateX(0)"
    toast.style.opacity = "1"
  }, 100)
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

// Enhanced interfaces
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
  type: "initial assessment" | "therapy session" | "follow-up" | "other" | "group therapy session"
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
  isGroupSession?: boolean
}

interface PatientInGroup {
  _id: string
  patientId: {
    _id: string
    fullName?: string
    childName?: string
  }
  patientName: string
  fatherName?: string
  email: string
  phone: string
  payment: {
    amount: number
    status: "pending" | "paid" | "refunded"
    method: string
    paidAmount?: number
  }
  status: string
  totalSessions: number
  sessionsCompleted: number
  sessionsPaid: number
  consent: boolean
  notes?: string
}

interface GroupSession {
  _id: string
  isGroupSession: true
  groupSessionId: string
  groupSessionName: string
  maxCapacity: number
  date: string
  startTime: string
  endTime: string
  therapistId: {
    _id: string
    fullName: string
  }
  serviceId: {
    name: string
    price: number
  }
  type: string
  status: string
  consultationMode: string
  notes?: string
  patients: PatientInGroup[]
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  createdAt: string
  updatedAt: string
}

type CombinedAppointmentData = AppointmentDetails | GroupSession

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
  appointmentType: string // NEW: Filter for group vs individual
}

// Enhanced Group Reschedule Modal Component
const GroupRescheduleModal: React.FC<{
  appointment: GroupSession | null
  isOpen: boolean
  onClose: () => void
  onReschedule: (appointmentId: string, rescheduleData: any) => void
}> = ({ appointment, isOpen, onClose, onReschedule }) => {
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    globalPaymentStatus: "keep-individual", // New option for group handling
  })
  const [individualPaymentStatuses, setIndividualPaymentStatuses] = useState<{ [key: string]: string }>({})
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (appointment && isOpen) {
      setRescheduleData({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
        globalPaymentStatus: "keep-individual",
      })

      // Initialize individual payment statuses based on current status
      const initialStatuses: { [key: string]: string } = {}
      appointment.patients.forEach((patient) => {
        if (patient.payment.status === "refunded") {
          initialStatuses[patient._id] = "paid"
        } else {
          initialStatuses[patient._id] = "pending"
        }
      })
      setIndividualPaymentStatuses(initialStatuses)
      setAvailableSlots([])
    }
  }, [appointment, isOpen])

  useEffect(() => {
    if (rescheduleData.date && appointment) {
      fetchAvailableSlots(rescheduleData.date, appointment.therapistId._id)
    }
  }, [rescheduleData.date, appointment])

  const handleGlobalPaymentChange = (globalStatus: string) => {
    setRescheduleData((prev) => ({ ...prev, globalPaymentStatus: globalStatus }))

    if (globalStatus === "all-paid" && appointment) {
      const allPaidStatuses: { [key: string]: string } = {}
      appointment.patients.forEach((patient) => {
        allPaidStatuses[patient._id] = "paid"
      })
      setIndividualPaymentStatuses(allPaidStatuses)
    } else if (globalStatus === "all-pending" && appointment) {
      const allPendingStatuses: { [key: string]: string } = {}
      appointment.patients.forEach((patient) => {
        allPendingStatuses[patient._id] = "pending"
      })
      setIndividualPaymentStatuses(allPendingStatuses)
    }
  }

  const handleIndividualPaymentChange = (patientId: string, status: string) => {
    setIndividualPaymentStatuses((prev) => ({
      ...prev,
      [patientId]: status,
    }))
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.startTime || !appointment) {
      showToast("Please select date and time", "error")
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare reschedule data with individual payment statuses
      const groupRescheduleData = {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        therapistId: appointment.therapistId._id,
        reason: rescheduleData.reason,
        individualPaymentStatuses: individualPaymentStatuses,
        isGroupReschedule: true,
      }

      await onReschedule(appointment._id, groupRescheduleData)
      onClose()
    } catch (error) {
      console.error("Error rescheduling group:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#C83C92] to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reschedule Group Session</h3>
                <p className="text-purple-100 text-sm">{appointment.groupSessionName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Current Group Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-2">Current Group Session</h4>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <p>
                  Group: <span className="font-medium">{appointment.groupSessionName}</span>
                </p>
                <p>
                  Patients: <span className="font-medium">{appointment.patients.length}</span>
                </p>
              </div>
              <div className="flex justify-between mt-1">
                <p>
                  Therapist: <span className="font-medium">{appointment.therapistId.fullName}</span>
                </p>
                <p>
                  Revenue: <span className="font-medium">₹{appointment.totalRevenue}</span>
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

          {/* Payment Status Options for Group */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-yellow-600" />
              Payment Status for Rescheduled Group Session
            </h4>

            {/* Global Payment Options */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="globalPaymentStatus"
                  value="keep-individual"
                  checked={rescheduleData.globalPaymentStatus === "keep-individual"}
                  onChange={(e) => handleGlobalPaymentChange(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-black">Set individual payment status for each patient</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="globalPaymentStatus"
                  value="all-paid"
                  checked={rescheduleData.globalPaymentStatus === "all-paid"}
                  onChange={(e) => handleGlobalPaymentChange(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-black">Mark all patients as PAID</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="globalPaymentStatus"
                  value="all-pending"
                  checked={rescheduleData.globalPaymentStatus === "all-pending"}
                  onChange={(e) => handleGlobalPaymentChange(e.target.value)}
                  className="text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-black">Mark all patients as PENDING</span>
              </label>
            </div>

            {/* Individual Patient Payment Status */}
            {rescheduleData.globalPaymentStatus === "keep-individual" && (
              <div className="border-t border-yellow-300 pt-4">
                <h5 className="text-sm font-medium text-black mb-3">Individual Patient Payment Status:</h5>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {appointment.patients.map((patient, index) => (
                    <div key={patient._id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-black">
                          Patient {index + 1}: {patient.patientName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Current: {patient.payment.status} | Amount: ₹{patient.payment.amount}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`payment-${patient._id}`}
                            value="paid"
                            checked={individualPaymentStatuses[patient._id] === "paid"}
                            onChange={(e) => handleIndividualPaymentChange(patient._id, e.target.value)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs text-green-600">Paid</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`payment-${patient._id}`}
                            value="pending"
                            checked={individualPaymentStatuses[patient._id] === "pending"}
                            onChange={(e) => handleIndividualPaymentChange(patient._id, e.target.value)}
                            className="text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-xs text-yellow-600">Pending</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Reason for Rescheduling (Optional)</label>
            <textarea
              style={{ color: "black" }}
              value={rescheduleData.reason}
              onChange={(e) => setRescheduleData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for rescheduling the group session..."
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
                Rescheduling Group...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Reschedule Group Session
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Regular Reschedule Modal for Individual Appointments
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
    paymentStatus: "pending",
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (appointment && isOpen) {
      let defaultPaymentStatus = "pending"
      if (appointment.payment.status === "refunded") {
        defaultPaymentStatus = "paid"
      } else if (appointment.payment.status === "pending") {
        defaultPaymentStatus = "pending"
      }

      setRescheduleData({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
        paymentStatus: defaultPaymentStatus,
      })
      setAvailableSlots([])
    }
  }, [appointment, isOpen])

  useEffect(() => {
    if (rescheduleData.date && appointment) {
      fetchAvailableSlots(rescheduleData.date, appointment.therapistId._id)
    }
  }, [rescheduleData.date, appointment])

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.startTime || !appointment) {
      showToast("Please select date and time", "error")
      return
    }

    setIsSubmitting(true)
    try {
      await onReschedule(appointment._id, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        therapistId: appointment.therapistId._id,
        reason: rescheduleData.reason,
        paymentStatus: rescheduleData.paymentStatus,
      })
      onClose()
    } catch (error) {
      console.error("Error rescheduling:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !appointment) return null

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
                <p className="text-purple-100 text-sm">{appointment.patientName}</p>
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
                  Patient: <span className="font-medium">{appointment.patientName}</span>
                </p>
                <p>
                  <span className="font-medium">{appointment.type}</span>
                </p>
              </div>
              <div className="flex justify-between mt-1">
                <p>
                  Therapist: <span className="font-medium">{appointment.therapistId.fullName}</span>
                </p>
                <p>
                  <span className="font-medium">45 minutes</span>
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
                ? "This was paid before cancellation. Choose the payment status for the rescheduled session:"
                : "This was not paid before cancellation. Choose the payment status for the rescheduled session:"}
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

// Group Session Row Component
const GroupSessionRow: React.FC<{
  groupSession: GroupSession
  onStatusUpdate: (appointmentId: string, newStatus: string) => void
  onRescheduleClick: (appointment: any) => void
  onDetailsClick: (appointment: any) => void
  formatDate: (date: string) => string
  formatTime: (time: string) => string
  getStatusColor: (status: string) => string
  getPaymentStatusColor: (status: string) => string
  handleStatusClick: (event: React.MouseEvent, appointmentId: string, currentStatus: string) => void
}> = ({
  groupSession,
  onStatusUpdate,
  onRescheduleClick,
  onDetailsClick,
  formatDate,
  formatTime,
  getStatusColor,
  getPaymentStatusColor,
  handleStatusClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getGroupPaymentSummary = () => {
    const totalPatients = groupSession.patients.length
    const paidPatients = groupSession.patients.filter((p) => p.payment.status === "paid").length
    const pendingPatients = groupSession.patients.filter((p) => p.payment.status === "pending").length

    return {
      totalPatients,
      paidPatients,
      pendingPatients,
      totalRevenue: groupSession.totalRevenue,
      paidRevenue: groupSession.paidRevenue,
      pendingRevenue: groupSession.pendingRevenue,
    }
  }

  const paymentSummary = getGroupPaymentSummary()

  return (
    <>
      {/* Main Group Row */}
      <tr className="border-b hover:bg-blue-50 transition-colors bg-blue-25">
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-[#456696]">{formatDate(groupSession.date)}</div>
            <div className="text-sm text-gray-500">
              {formatTime(groupSession.startTime)} - {formatTime(groupSession.endTime)}
            </div>
            <div className="text-xs text-gray-400 capitalize">{groupSession.consultationMode}</div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Users className="w-4 h-4" />
              <div>
                <div className="font-medium text-[#456696]">{groupSession.groupSessionName}</div>
                <div className="text-sm text-gray-500">
                  {groupSession.patients.length} / {groupSession.maxCapacity} patients
                </div>
                <div className="text-xs text-blue-600 font-medium">Group Session</div>
              </div>
            </button>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded">
              <Stethoscope className="w-3 h-3 text-blue-600" />
            </div>
            <span className="font-medium text-[#456696]">{groupSession.therapistId.fullName}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-[#456696]">{groupSession.serviceId.name}</div>
            <div className="text-xs text-gray-500">Group Session</div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:shadow-md transition-all select-none ${getStatusColor(groupSession.status)}`}
            onClick={(e) => handleStatusClick(e, groupSession._id, groupSession.status)}
            title={
              groupSession.status === "cancelled" ? "Double-click to reschedule group" : "Double-click to change status"
            }
          >
            {groupSession.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
            {groupSession.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
            {groupSession.status === "scheduled" && <Clock className="w-3 h-3 mr-1" />}
            {groupSession.status === "confirmed" && <CheckCircle className="w-3 h-3 mr-1" />}
            <Users className="w-3 h-3 mr-1" />
            {groupSession.status.charAt(0).toUpperCase() + groupSession.status.slice(1)}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">{paymentSummary.paidPatients} paid</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">{paymentSummary.pendingPatients} pending</span>
            </div>
            <div className="text-xs text-gray-500">₹{paymentSummary.totalRevenue} total</div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDetailsClick(groupSession)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="View Group Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {groupSession.status === "cancelled" && (
              <button
                onClick={() => onRescheduleClick(groupSession)}
                className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                title="Reschedule Group Session"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <div className="relative p-3 group">
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[140px]">
                {groupSession.status === "scheduled" && (
                  <button
                    onClick={() => onStatusUpdate(groupSession._id, "completed")}
                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    Complete Group
                  </button>
                )}
                {groupSession.status !== "cancelled" && (
                  <button
                    onClick={() => onStatusUpdate(groupSession._id, "cancelled")}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cancel Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Patient Rows */}
      {isExpanded &&
        groupSession.patients.map((patient, index) => (
          <tr key={patient._id} className="border-b bg-blue-50 hover:bg-blue-100 transition-colors">
            <td className="px-6 py-3 pl-12">
              <div className="text-sm text-gray-600">Patient {index + 1}</div>
            </td>
            <td className="px-6 py-3">
              <div>
                <div className="font-medium text-[#456696] text-sm">{patient.patientName}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {patient.phone}
                </div>
                {patient.email && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {patient.email}
                  </div>
                )}
              </div>
            </td>
            <td className="px-6 py-3">
              <div className="text-sm text-gray-500">{patient.fatherName || "N/A"}</div>
            </td>
            <td className="px-6 py-3">
              <div className="text-sm text-gray-500">Individual in group</div>
            </td>
            <td className="px-6 py-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}
              >
                {patient.status}
              </span>
            </td>
            <td className="px-6 py-3">
              <div className="space-y-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(patient.payment.status)}`}
                >
                  <IndianRupee className="w-3 h-3 mr-1" />
                  {patient.payment.status}
                </span>
                <div className="text-xs text-gray-500">₹{patient.payment.amount}</div>
              </div>
            </td>
            <td className="px-6 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onStatusUpdate(patient._id, patient.status === "completed" ? "scheduled" : "completed")
                  }
                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors text-xs"
                  title="Toggle Status"
                >
                  <CheckCircle className="w-3 h-3" />
                </button>
              </div>
            </td>
          </tr>
        ))}
    </>
  )
}

// Main Component - Enhanced with group session support
const AppointmentsEnhancedPage: React.FC = () => {
  const [appointments, setAppointments] = useState<CombinedAppointmentData[]>([])
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
    appointmentType: "all", // NEW: Filter for group vs individual
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
  const [selectedAppointment, setSelectedAppointment] = useState<CombinedAppointmentData | null>(null)
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
  const [showGroupRescheduleModal, setShowGroupRescheduleModal] = useState(false)
  const [rescheduleAppointment, setRescheduleAppointment] = useState<CombinedAppointmentData | null>(null)

  // Double-click tracking
  const [lastClickTime, setLastClickTime] = useState<{ [key: string]: number }>({})
  const [clickTimeouts, setClickTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({})

  // Enhanced fetch appointments to handle both individual and group sessions
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

      // Transform the data to handle both individual appointments and group sessions
      const transformedData = (apiResponse.data || []).map((item: any) => {
        if (item.isGroupSession) {
          // This is a group session
          return {
            ...item,
            id: item._id,
          } as GroupSession
        } else {
          // This is an individual appointment
          return {
            _id: item._id,
            id: item._id,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            patientName: item.patientName || item.patientId?.fullName || item.patientId?.childName || "Unknown",
            patientId: {
              _id: item.patientId?._id || item.patientId,
              fullName: item.patientId?.fullName,
              childName: item.patientId?.childName,
              parentInfo: item.patientId?.parentInfo,
            },
            therapistId: {
              _id: item.therapistId?._id || item.therapistId,
              fullName: item.therapistId?.fullName || "Unassigned",
            },
            serviceId: {
              name: item.serviceId?.name || "Unknown Service",
              price: item.serviceId?.price || 0,
            },
            type: item.type || "therapy session",
            status: item.status || "scheduled",
            consultationMode: item.consultationMode || "in-person",
            payment: {
              amount: item.payment?.amount || 0,
              status: item.payment?.status || "pending",
              method: item.payment?.method || "not_specified",
              paidAmount: item.payment?.paidAmount || 0,
            },
            totalSessions: item.totalSessions || 1,
            sessionsCompleted: item.sessionsCompleted || 0,
            sessionsPaid: item.sessionsPaid || 0,
            phone: item.phone || "N/A",
            email: item.email || "N/A",
            notes: item.notes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          } as AppointmentDetails
        }
      })

      const sortedData = transformedData.sort((a, b) => {
  // Make sure createdAt exists and is comparable
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
})

      setAppointments(sortedData)
      calculateSummary(sortedData)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch appointments"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  // Enhanced calculate summary to handle both types
  const calculateSummary = (appointmentsData: CombinedAppointmentData[]) => {
    const today = new Date().toDateString()
    const summary = appointmentsData.reduce(
      (acc, item) => {
        if ("isGroupSession" in item && item.isGroupSession) {
          // Group session
          acc.totalAppointments += 1
          if (new Date(item.date).toDateString() === today) {
            acc.todayAppointments += 1
          }
          if (item.status === "completed") {
            acc.completedAppointments += 1
          }
          if (item.status === "scheduled" || item.status === "rescheduled" || item.status === "confirmed") {
            acc.pendingAppointments += 1
          }
          if (item.status === "cancelled" || item.status === "no-show") {
            acc.cancelledAppointments += 1
          }
          acc.totalRevenue += item.paidRevenue
          if (item.pendingRevenue > 0) {
            acc.pendingPayments += 1
          }
        } else {
          // Individual appointment
          const apt = item as AppointmentDetails
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

  // Handle status click
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

  // Handle reschedule click - ENHANCED for group sessions
  const handleRescheduleClick = (appointment: CombinedAppointmentData) => {
    setRescheduleAppointment(appointment)

    // Check if it's a group session
    if ("isGroupSession" in appointment && appointment.isGroupSession) {
      setShowGroupRescheduleModal(true)
    } else {
      setShowRescheduleModal(true)
    }
  }

  // ENHANCED Handle reschedule submission for both individual and group
  const handleRescheduleSubmit = async (appointmentId: string, rescheduleData: any) => {
    try {
      setUpdating(true)
      console.log("Sending reschedule data:", rescheduleData)

      // Check if this is a group session reschedule
      if (rescheduleData.isGroupReschedule) {
        const groupSession = appointments.find(
          (apt) => "isGroupSession" in apt && apt.isGroupSession && apt._id === appointmentId,
        ) as GroupSession | undefined

        if (groupSession) {
          console.log("Rescheduling group session:", groupSession.groupSessionName)

          const reschedulePromises = groupSession.patients.map(async (patient) => {
            const individualPaymentStatus = rescheduleData.individualPaymentStatuses[patient._id] || "pending"

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${patient._id}/reschedule`,
              {
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
                  paymentStatus: individualPaymentStatus,
                }),
              },
            )

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(
                `Failed to reschedule patient ${patient.patientName}: ${errorData.error || errorData.message}`,
              )
            }

            return response.json()
          })

          // Wait for all reschedules to complete
          await Promise.all(reschedulePromises)

          showToast(
            `Group session rescheduled successfully - ${groupSession.patients.length} patients updated with individual payment statuses`,
            "success",
          )
        }
      } else {
        // This is an individual appointment
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/reschedule`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
            },
            body: JSON.stringify(rescheduleData),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || errorData.message || "Failed to reschedule appointment")
        }

        showToast("Appointment rescheduled successfully", "success")
      }

      setShowRescheduleModal(false)
      setShowGroupRescheduleModal(false)
      setRescheduleAppointment(null)

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

  // Enhanced appointment status update function to handle both individual and group operations
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(true)

      // Check if this is a group session operation
      const groupSession = appointments.find(
        (apt) => "isGroupSession" in apt && apt.isGroupSession && apt._id === appointmentId,
      ) as GroupSession | undefined

      if (groupSession) {
        // This is a group session - update all individual appointments in the group
        console.log("Updating group session:", groupSession.groupSessionName, "to status:", newStatus)

        const updatePromises = groupSession.patients.map(async (patient) => {
          const updates: any = { status: newStatus }

          // Add specific logic for different statuses
          if (newStatus === "completed") {
            updates.sessionsCompleted = Math.min((patient.sessionsCompleted || 0) + 1, patient.totalSessions)
            if (patient.payment.amount > 0 && patient.payment.status === "pending") {
              updates.payment = { ...patient.payment, status: "paid" }
            }
          } else if (newStatus === "cancelled") {
            if (patient.payment.status === "paid") {
              updates.payment = { ...patient.payment, status: "refunded" }
            }
          }

          const token = localStorage.getItem("receptionToken")
          if (!token) {
            throw new Error("Authentication token not found")
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/updateappointment/${patient._id}`,
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
            throw new Error(`Failed to update patient ${patient.patientName}: ${errorData.message}`)
          }

          return response.json()
        })

        // Wait for all updates to complete
        await Promise.all(updatePromises)

        showToast(
          `Group session ${newStatus} successfully - ${groupSession.patients.length} patients updated`,
          "success",
        )
      } else {
        // This is an individual appointment
        const appointment = appointments.find((apt) => apt._id === appointmentId) as AppointmentDetails | undefined
        if (!appointment || "isGroupSession" in appointment) {
          throw new Error("Individual appointment not found")
        }

        const updates: any = { status: newStatus }

        if (newStatus === "completed") {
          updates.sessionsCompleted = Math.min((appointment.sessionsCompleted || 0) + 1, appointment.totalSessions)
          if (appointment.payment.amount > 0 && appointment.payment.status === "pending") {
            updates.payment = { ...appointment.payment, status: "paid" }
          }
        } else if (newStatus === "cancelled") {
          if (appointment.payment.status === "paid") {
            updates.payment = { ...appointment.payment, status: "refunded" }
          }
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
      }

      // Refresh appointments to get updated data
      setTimeout(() => {
        fetchAppointments()
      }, 1000)
    } catch (error) {
      console.error("Update error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update appointment status"
      showToast(errorMessage, "error")
    } finally {
      setUpdating(false)
    }
  }

  // Utility functions
  const getPatientName = (appointment: CombinedAppointmentData): string => {
    if ("isGroupSession" in appointment && appointment.isGroupSession) {
      return appointment.groupSessionName
    } else {
      const individualAppointment = appointment as AppointmentDetails
      return (
        individualAppointment.patientName ||
        individualAppointment.patientId?.fullName ||
        individualAppointment.patientId?.childName ||
        "Unknown Patient"
      )
    }
  }

  const getContactInfo = (appointment: CombinedAppointmentData): string => {
    if ("isGroupSession" in appointment && appointment.isGroupSession) {
      return `${appointment.patients.length} patients`
    } else {
      const individualAppointment = appointment as AppointmentDetails
      return individualAppointment.phone || individualAppointment.patientId?.parentInfo?.phone || "N/A"
    }
  }

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

  const formatTime = (timeStr: string) => {
    return timeStr
  }

  const openDetailsModal = (appointment: CombinedAppointmentData) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  // Export appointments report (enhanced for group sessions)
  const exportAppointmentsReport = () => {
    try {
      const csvContent = [
        [
          "Date",
          "Time",
          "Patient/Group Name",
          "Therapist",
          "Service",
          "Type",
          "Status",
          "Payment Status",
          "Amount",
          "Contact",
          "Mode",
          "Is Group",
        ],
        ...filteredAppointments.map((item) => {
          if ("isGroupSession" in item && item.isGroupSession) {
            return [
              formatDate(item.date),
              item.startTime,
              item.groupSessionName,
              item.therapistId.fullName,
              item.serviceId.name,
              "Group Session",
              item.status,
              "Mixed",
              item.totalRevenue.toString(),
              `${item.patients.length} patients`,
              item.consultationMode,
              "Yes",
            ]
          } else {
            const apt = item as AppointmentDetails
            return [
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
              "No",
            ]
          }
        }),
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

  // ENHANCED filter appointments to handle both types + NEW appointment type filter
  const filteredAppointments = appointments.filter((item) => {
    let matchesSearch = false
    const matchesStatus = filters.status === "all" || item.status === filters.status
    const matchesTherapist = filters.therapist === "all" || item.therapistId._id === filters.therapist

    // NEW: Appointment type filter
    let matchesAppointmentType = true
    if (filters.appointmentType === "individual") {
      matchesAppointmentType = !("isGroupSession" in item && item.isGroupSession)
    } else if (filters.appointmentType === "group") {
      matchesAppointmentType = "isGroupSession" in item && item.isGroupSession
    }

    if ("isGroupSession" in item && item.isGroupSession) {
      // Group session search
      matchesSearch =
        item.groupSessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.therapistId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patients.some(
          (p) => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm),
        )
    } else {
      // Individual appointment search
      const apt = item as AppointmentDetails
      matchesSearch =
        getPatientName(apt).toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.therapistId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.serviceId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getContactInfo(apt).includes(searchTerm)

      // Additional filters for individual appointments
      const matchesPaymentStatus = filters.paymentStatus === "all" || apt.payment.status === filters.paymentStatus
      const matchesMode = filters.consultationMode === "all" || apt.consultationMode === filters.consultationMode

      // Date range filter
      let matchesDateRange = true
      if (filters.dateRange !== "all") {
        const appointmentDate = new Date(apt.date)
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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentStatus &&
        matchesTherapist &&
        matchesMode &&
        matchesDateRange &&
        matchesAppointmentType
      )
    }

    return matchesSearch && matchesStatus && matchesTherapist && matchesAppointmentType
  })

  // Get unique therapists for filter
  const uniqueTherapists = Array.from(new Set(appointments.map((item) => item.therapistId._id))).map((id) => {
    const therapist = appointments.find((item) => item.therapistId._id === id)?.therapistId
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
      <div className="p-6 max-w-[84%] mt-15 ml-[170px] mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C83C92] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#1E437A]">Loading appointments...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 font-sans max-w-[84%] mt-15 ml-[170px] mx-auto">
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
    <div className="p-6 max-w-[84%] font-sans mt-15 ml-[170px] mx-auto custom-scrollbar h-[95vh] mt-10">
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
        <p className="text-gray-600">Manage individual appointments and group sessions</p>
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
            placeholder="Search by patient name, group name, therapist, or contact..."
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

      {/* ENHANCED Filters Panel with NEW appointment type filter */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
            {/* NEW: Appointment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.appointmentType}
                onChange={(e) => setFilters({ ...filters, appointmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual Only</option>
                <option value="group">Group Sessions Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Appointments Table */}
      <div className="bg-white rounded-lg border pb-10 border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1E437A]">
            Appointments & Group Sessions ({filteredAppointments.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on group sessions to expand patient details • Double-click on status to update • Double-click on
            cancelled appointments to reschedule
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9F9FC]">
              <tr className="text-left text-[#1E437A]">
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Patient / Group</th>
                <th className="px-6 py-4 font-medium">Therapist</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((item) => {
                if ("isGroupSession" in item && item.isGroupSession) {
                  // Render Group Session Row
                  return (
                    <GroupSessionRow
                      key={item._id}
                      groupSession={item}
                      onStatusUpdate={updateAppointmentStatus}
                      onRescheduleClick={handleRescheduleClick}
                      onDetailsClick={openDetailsModal}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusColor={getStatusColor}
                      getPaymentStatusColor={getPaymentStatusColor}
                      handleStatusClick={handleStatusClick}
                    />
                  )
                } else {
                  // Render Individual Appointment Row
                  const appointment = item as AppointmentDetails
                  return (
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
                  )
                }
              })}
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

      {/* Individual Reschedule Modal */}
      <RescheduleModal
        appointment={
          rescheduleAppointment && !("isGroupSession" in rescheduleAppointment && rescheduleAppointment.isGroupSession)
            ? (rescheduleAppointment as AppointmentDetails)
            : null
        }
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false)
          setRescheduleAppointment(null)
        }}
        onReschedule={handleRescheduleSubmit}
      />

      {/* Group Reschedule Modal */}
      <GroupRescheduleModal
        appointment={
          rescheduleAppointment && "isGroupSession" in rescheduleAppointment && rescheduleAppointment.isGroupSession
            ? (rescheduleAppointment as GroupSession)
            : null
        }
        isOpen={showGroupRescheduleModal}
        onClose={() => {
          setShowGroupRescheduleModal(false)
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

// Enhanced Appointment Details Modal Component
const AppointmentDetailsModal: React.FC<{
  appointment: CombinedAppointmentData
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

  // Check if it's a group session
  const isGroupSession = "isGroupSession" in appointment && appointment.isGroupSession

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1E437A]">
            {isGroupSession ? "Group Session Details" : "Appointment Details"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {isGroupSession ? (
          // Group Session Details
          <div className="space-y-6">
            {/* Group Session Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Session Name</label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-[#456696] font-medium">{appointment.groupSessionName}</span>
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
                  <div className="text-sm text-gray-500">₹{appointment.serviceId.price} per patient</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-[#456696] font-medium">
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-[#456696]">
                      {appointment.startTime} - {appointment.endTime}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <div className="text-[#456696]">
                    {appointment.patients.length} / {appointment.maxCapacity} patients
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Payment Summary */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Summary</label>
                <div className="space-y-1">
                  <div className="text-sm">Total Revenue: ₹{appointment.totalRevenue}</div>
                  <div className="text-sm text-green-600">Paid: ₹{appointment.paidRevenue}</div>
                  <div className="text-sm text-yellow-600">Pending: ₹{appointment.pendingRevenue}</div>
                </div>
              </div>
            </div>

            {/* Patients List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Patients in Group Session</label>
              <div className="space-y-3">
                {appointment.patients.map((patient, index) => (
                  <div key={patient._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium text-[#456696]">Patient {index + 1}</div>
                        <div className="text-sm text-gray-600">{patient.patientName}</div>
                        <div className="text-xs text-gray-500">{patient.fatherName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          <Phone className="w-3 h-3 inline mr-1" />
                          {patient.phone}
                        </div>
                        {patient.email && (
                          <div className="text-sm text-gray-600">
                            <Mail className="w-3 h-3 inline mr-1" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(patient.payment.status)}`}
                        >
                          <IndianRupee className="w-3 h-3 mr-1" />
                          {patient.payment.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">₹{patient.payment.amount}</div>
                      </div>
                    </div>
                  </div>
                ))}
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
        ) : (
          // Individual Appointment Details
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
                    <span className="text-[#456696] font-medium">
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
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
        )}

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
              {isGroupSession ? "Complete Group Session" : "Mark Complete"}
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
              {isGroupSession ? "Cancel Group Session" : "Cancel"}
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




// Enhanced function to determine appointment type color based on doctor specialty
// const getAppointmentTypeColor = (appointment: AppointmentOrGroup, doctorColor: string) => {
//   // Get the doctor from the doctors array to determine specialty
//   const doctorName = Object.keys(scheduleData).find(
//     (name) => scheduleData[name] && Object.values(scheduleData[name]).some((apt) => apt === appointment),
//   )

//   const doctor = doctors.find((d) => d.name === doctorName)
//   const specialty = doctor?.specialty || "Specialist"

//   if ("isGroupSession" in appointment && appointment.isGroupSession) {
//     // Group sessions get specialty color with purple accent
//     switch (specialty) {
//       case "Occupational Therapist":
//         return "bg-blue-200 border-blue-400 border-l-4 border-l-purple-600 text-blue-900"
//       case "Speech Language Therapist":
//         return "bg-orange-200 border-orange-400 border-l-4 border-l-purple-600 text-orange-900"
//       case "Special Education":
//         return "bg-purple-200 border-purple-400 border-l-4 border-l-purple-600 text-purple-900"
//       default:
//         return "bg-gray-200 border-gray-400 border-l-4 border-l-purple-600 text-gray-900"
//     }
//   }

//   // Individual appointments get specialty-based colors
//   switch (specialty) {
//     case "Occupational Therapist":
//       return "bg-blue-200 border-blue-400 text-blue-900"
//     case "Speech Language Therapist":
//       return "bg-orange-200 border-orange-400 text-orange-900"
//     case "Special Education":
//       return "bg-purple-200 border-purple-400 text-purple-900"
//     default:
//       return "bg-gray-200 border-gray-400 text-gray-900"
//   }
// }