"use client"
import type React from "react"
import { useState, useEffect } from "react"
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
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  CalendarDays,
  Stethoscope,
  Plus,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"

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
  status: "scheduled" | "completed" | "cancelled" | "no-show" | "rescheduled"
  consultationMode: "in-person" | "video-call" | "phone"
  payment: {
    amount: number
    status: "pending" | "paid" | "partial" | "refunded"
    method: "cash" | "card" | "insurance" | "not_specified"
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

const AppointmentsEnhancedPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentDetails[]>([])
  const [loading, setLoading] = useState<boolean>(true)
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

  // Fetch appointments data
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
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
      console.log(apiResponse);
      
      if (!apiResponse.success) {
        throw new Error("API returned unsuccessful response")
      }

      // Transform the data to match our interface
      const transformedAppointments = apiResponse.data.map((apt: any) => ({
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
      setError(err instanceof Error ? err.message : "Failed to fetch appointments")
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
        if (apt.status === "scheduled" || apt.status === "rescheduled") {
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
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
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

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update appointment status")
      }

      // Refresh appointments
      await fetchAppointments()
      alert("Appointment status updated successfully!")
    } catch (error) {
      console.error("Error updating appointment status:", error)
      alert("Failed to update appointment status")
    }
  }

  // Export appointments report
  const exportAppointmentsReport = () => {
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
    a.click()
    window.URL.revokeObjectURL(url)
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
              <DollarSign className="w-5 h-5 text-yellow-600" />
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
          >
            <RefreshCw className="w-4 h-4" />
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
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
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
                <option value="partial">Partial</option>
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1E437A]">
            Appointments Overview ({filteredAppointments.length})
          </h2>
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
                {/* <th className="px-6 py-4 font-medium">Sessions</th> */}
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
                      <div className="text-sm text-gray-500">₹{appointment.serviceId.price}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                      {appointment.status === "scheduled" && <Clock className="w-3 h-3 mr-1" />}
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment.status)}`}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        {appointment.payment.status}
                      </span>
                      <div className="text-xs text-gray-500">
                        ₹
                        {appointment.payment.status === "partial"
                          ? appointment.payment.paidAmount
                          : appointment.payment.amount}
                        {appointment.payment.status === "partial" && ` / $${appointment.payment.amount}`}
                      </div>
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
                      {/* <button
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit Appointment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button> */}
                      <div className="relative group">
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
                          {/* <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                            Reschedule
                          </button> */}
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
                <DollarSign className="w-3 h-3 mr-1" />
                {appointment.payment.status}
              </span>
              <div className="text-sm text-gray-500 mt-1">
                Amount: ₹{appointment.payment.amount} | Method: {appointment.payment.method}
                {appointment.payment.status === "partial" && <div>Paid: ₹{appointment.payment.paidAmount}</div>}
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
