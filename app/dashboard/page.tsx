"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import logo from "@/public/SensesLogo.png";
import {
  Calendar,
  Plus,
  Clock,
  User,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  Banknote,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Phone,
  Mail,
  Download,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Stethoscope, UserCheck } from "lucide-react"

// Helper function to get shortened doctor name (same as header display)
const getShortenedDoctorName = (doctorName: string): string => {
  if (doctorName?.includes("(")) {
    const nameParts = doctorName.split("(")[0].split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1]} ${nameParts[1]?.charAt(0) || ""}`
    }
  }
  const nameParts = doctorName.split(" ")
  if (nameParts.length >= 2) {
    return `${nameParts[0]} ${nameParts[1]} ${nameParts[1]?.charAt(0) || ""}`
  }
  return doctorName
}

// SIMPLIFIED table-format CSV export - only patient names and group session names
const exportTableFormatCSV = (scheduleData: any, doctors: any[], timeSlots: string[], selectedDate: string) => {
  const tableData: string[][] = []

  // Create header row with Time as first column, then shortened doctor names
  const headerRow = ["Time Slot", ...doctors.map((doctor) => getShortenedDoctorName(doctor.name))]
  tableData.push(headerRow)

  // Create data rows for each time slot
  timeSlots.forEach((timeSlot) => {
    const row = [timeSlot]

    doctors.forEach((doctor) => {
      const appointment = scheduleData[doctor.name]?.[timeSlot]
      let cellContent = "-" // Empty slots show "-"

      if (appointment) {
        const isGroupSession = "isGroupSession" in appointment && appointment.isGroupSession

        if (isGroupSession) {
          const groupSession = appointment as GroupSession
          // Simple format: Group session name with symbol
          cellContent = `(G) ${groupSession.groupSessionName}`
        } else {
          const singleAppointment = appointment as CalendarAppointment
          // Simple format: Just patient name
          cellContent = singleAppointment.patientName
        }
      }

      row.push(cellContent)
    })

    tableData.push(row)
  })

  // Convert to CSV format
  const csvContent = tableData
    .map((row) =>
      row
        .map((cell) => (typeof cell === "string" && (cell.includes(",") || cell.includes("|")) ? `"${cell}"` : cell))
        .join(","),
    )
    .join("\n")

  return { csvContent, tableData }
}

const getBase64FromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


// FIXED PDF generation function
const addWatermark = (doc, logoBase64, pageWidth, pageHeight) => {
  doc.setGState(new doc.GState({ opacity: 0.1 }));
  const imgWidth = 100;
  const imgHeight = 100;
  const xPos = (pageWidth - imgWidth) / 2;
  const yPos = (pageHeight - imgHeight) / 2;
  doc.addImage(logoBase64, "PNG", xPos, yPos, imgWidth, imgHeight);
  doc.setGState(new doc.GState({ opacity: 1 }));
};
const generatePDF = async (tableData: string[][], selectedDate: string) => {
  try {
    if (typeof window === "undefined") {
      throw new Error("PDF generation is only available in browser environment");
    }

    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    if (tableData.length === 0) {
      throw new Error("No data to export to PDF");
    }

    const headers = tableData[0];
    const dataRows = tableData.slice(1);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;

    // Convert imported logo to base64
    const logoBase64 = await getBase64FromUrl(logo.src);

    // Add faint watermark in the center
    const imgWidth = pageWidth * 0.6;
    const imgHeight = imgWidth * 0.3;
    const xPos = (pageWidth - imgWidth) / 2;
    const yPos = (pageHeight - imgHeight) / 2;
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.addImage(logoBase64, "PNG", xPos, yPos, imgWidth, imgHeight);
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Title
    doc.setFontSize(16);
    doc.setFont("times", "bold");
    doc.text(`Doctor Schedule - ${selectedDate}`, margin, 15);

    // Dynamic column widths
    const timeColumnWidth = 25;
    const doctorColumnWidth = (usableWidth - timeColumnWidth) / (headers.length - 1);
    let fontSize = doctorColumnWidth < 20 ? 7 : 9;

    let yPosition = 25;
    const rowHeight = 8;
    const headerHeight = 10;

    // Headers
    doc.setFontSize(fontSize);
    doc.setFont("times", "bold");
    doc.rect(margin, yPosition, timeColumnWidth, headerHeight);
    doc.text("Time Slot", margin + 2, yPosition + 7);

    headers.slice(1).forEach((header, index) => {
      const colX = margin + timeColumnWidth + index * doctorColumnWidth;
      doc.rect(colX, yPosition, doctorColumnWidth, headerHeight);
      const truncatedHeader = header?.length > 14 ? header?.substring(0, 15) + "..." : header;
      doc.text(truncatedHeader, colX + 1, yPosition + 7);
    });

    yPosition += headerHeight;
    doc.setFont("times", "normal");
    doc.setFontSize(fontSize - 1);

    // Data rows
    dataRows.forEach((row) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 15;
      }

      doc.rect(margin, yPosition, timeColumnWidth, rowHeight);
      doc.text(row[0] || "", margin + 1, yPosition + 5);

      row.slice(1).forEach((cell, cellIndex) => {
        const colX = margin + timeColumnWidth + cellIndex * doctorColumnWidth;
        doc.rect(colX, yPosition, doctorColumnWidth, rowHeight);
        let displayText = cell && cell !== "-" ? cell : "-";
        if (displayText.length > 15) displayText = displayText.substring(0, 16) + "..";
        doc.text(displayText, colX + 1, yPosition + 5);
      });

      yPosition += rowHeight;
    });

    // Footer
    doc.setFontSize(8);
    doc.setFont("times", "italic");
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 5);

    doc.save(`schedule_table_${selectedDate.replace(/-/g, "_")}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
};


function formatDateToDDMMYYYY(dateString: string) {
  const [year, month, day] = dateString.split("-")
  return `${day}-${month}-${year}`
}

// Keep all your existing interfaces exactly the same
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
  payment: {
    amount: number
    status: "pending" | "paid" | "refunded"
    method: "card" | "cash" | "insurance" | "not_specified"
  }
  totalSessions: number
  sessionsPaid: number
  sessionsCompleted: number
  phone: string
  email: string
  notes?: string
  consultationMode: string
  fatherName?: string
  address?: string
  serviceInfo: {
    name: string
    price: number
    duration: number
  }
}

interface GroupSessionPatient {
  id: string
  patientId: string
  patientName: string
  phone: string
  email: string
  fatherName: string
  payment: {
    amount: number
    status: "pending" | "paid" | "refunded"
    method: "card" | "cash" | "insurance" | "not_specified"
  }
  notes: string
  address: string
  serviceInfo: {
    name: string
    price: number
    duration: number
  }
  createdAt: string
  updatedAt: string
}

interface GroupSession {
  isGroupSession: true
  groupSessionId: string
  groupSessionName: string
  doctorId: string
  totalPatients: number
  duration: number
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
  consultationMode: string
  patients: GroupSessionPatient[]
  totalRevenue: number
  serviceInfo: {
    name: string
    price: number
    duration: number
  }
}

type AppointmentOrGroup = CalendarAppointment | GroupSession

interface CalendarApiResponse {
  success: boolean
  data: {
    [doctorName: string]: {
      [timeSlot: string]: AppointmentOrGroup | null
    }
  }
}

// Enhanced Group Session View Modal - keeping your existing structure exactly
const GroupSessionViewModal: React.FC<{
  groupSession: GroupSession | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (groupSession: GroupSession) => void
  onReschedule: (groupSession: GroupSession) => void
}> = ({ groupSession, isOpen, onClose, onUpdateStatus, onReschedule }) => {
  if (!isOpen || !groupSession) return null

  const getPaidPatientsCount = () => {
    return groupSession.patients.filter((patient) => patient.payment.status === "paid").length
  }

  const getPendingPatientsCount = () => {
    return groupSession.patients.filter((patient) => patient.payment.status === "pending").length
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#C83C92] to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{groupSession.groupSessionName}</h3>
                <p className="text-purple-100 text-sm">
                  Group Session • {groupSession.totalPatients} Patients • {groupSession.duration} min
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Group Session Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{groupSession.totalPatients}</div>
                <div className="text-sm text-gray-600">Total Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getPaidPatientsCount()}</div>
                <div className="text-sm text-gray-600">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{getPendingPatientsCount()}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{groupSession.totalRevenue}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
          </div>
          {/* Session Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Session Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Session Type:</p>
                <p className="font-medium text-gray-900 capitalize">{groupSession.type}</p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-medium text-gray-900 capitalize">{groupSession.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Mode:</p>
                <p className="font-medium text-gray-900 capitalize">{groupSession.consultationMode}</p>
              </div>
              <div>
                <p className="text-gray-600">Service:</p>
                <p className="font-medium text-gray-900">{groupSession.serviceInfo.name}</p>
              </div>
            </div>
          </div>
          {/* Patients List */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Patients in Group Session</h4>
            <div className="space-y-4">
              {groupSession.patients.map((patient, index) => (
                <div
                  key={patient.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{patient.patientName}</h5>
                          <p className="text-sm text-gray-600">Father: {patient.fatherName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{patient.phone}</span>
                          </div>
                          {patient.email !== "N/A" && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{patient.email}</span>
                            </div>
                          )}
                          {patient.address && (
                            <div className="text-gray-600">
                              <span className="font-medium">Address:</span> {patient.address}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Payment:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${patient.payment.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : patient.payment.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {patient.payment.status}
                              </span>
                              <span className="font-medium">₹{patient.payment.amount}</span>
                            </div>
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Method:</span> {patient.payment.method}
                          </div>
                        </div>
                      </div>
                      {patient.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-600 mt-1">{patient.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onReschedule(groupSession)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Reschedule Group
          </button>
          <button
            onClick={() => onUpdateStatus(groupSession)}
            className="px-6 py-2 bg-gradient-to-r from-[#C83C92] to-purple-600 text-white rounded-lg hover:from-[#a21e6b] hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}

// ENHANCED Status Update Modal - keeping your exact implementation
const StatusUpdateModal: React.FC<{
  appointment: AppointmentOrGroup | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (appointmentId: string, updates: any, isGroupSession?: boolean) => void
}> = ({ appointment, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("not_specified")
  const [notes, setNotes] = useState("")
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Enhanced group session payment strategy
  const [groupPaymentStrategy, setGroupPaymentStrategy] = useState<"all-paid" | "all-pending" | "keep-current">(
    "keep-current",
  )

  const isGroupSession = appointment && "isGroupSession" in appointment && appointment.isGroupSession

  // Reset form when appointment changes or modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      if (isGroupSession) {
        const groupSession = appointment as GroupSession
        setStatus(groupSession.status || "scheduled")
        // For group sessions, calculate average payment data
        const totalAmount = groupSession.totalRevenue
        const avgAmount = Math.round(totalAmount / groupSession.totalPatients)
        setPaymentAmount(avgAmount)
        setPaymentStatus("pending") // Default for group
        setPaymentMethod("cash")
        setNotes("")
        setSessionsCompleted(0)
        setGroupPaymentStrategy("keep-current")
      } else {
        const singleAppointment = appointment as CalendarAppointment
        setStatus(singleAppointment.status || "scheduled")
        setPaymentStatus(singleAppointment.payment?.status || "pending")
        setPaymentAmount(singleAppointment.payment?.amount || 0)
        setPaymentMethod(singleAppointment.payment?.method || "not_specified")
        setNotes(singleAppointment.notes || "")
        setSessionsCompleted(singleAppointment.sessionsCompleted || 0)
      }
      setValidationErrors([])
    }
  }, [appointment, isOpen, isGroupSession])

  // Auto-increment sessions when status changes to completed
  useEffect(() => {
    if (status === "completed" && appointment && !isGroupSession) {
      const singleAppointment = appointment as CalendarAppointment
      const currentCompleted = singleAppointment.sessionsCompleted || 0
      if (sessionsCompleted <= currentCompleted) {
        const newCompleted = Math.min(currentCompleted + 1, singleAppointment.totalSessions || 0)
        setSessionsCompleted(newCompleted)
      }
      if (paymentAmount > 0 && paymentStatus === "pending") {
        setPaymentStatus("paid")
      }
    }
  }, [status, appointment, paymentAmount, paymentStatus, sessionsCompleted, isGroupSession])

  // Enhanced validation function
  const validateForm = (): boolean => {
    const errors: string[] = []
    if (!status) {
      errors.push("Status is required")
    }
    if (!isGroupSession) {
      const singleAppointment = appointment as CalendarAppointment
      if (sessionsCompleted > (singleAppointment?.totalSessions || 0)) {
        errors.push(`Sessions completed cannot exceed total sessions (${singleAppointment?.totalSessions})`)
      }
      if (sessionsCompleted < 0) {
        errors.push("Sessions completed cannot be negative")
      }
      if (status === "completed" && sessionsCompleted === 0) {
        errors.push("At least one session must be completed when marking as completed")
      }
    }
    if (paymentAmount < 0) {
      errors.push("Payment amount cannot be negative")
    }
    setValidationErrors(errors)
    return errors.length === 0
  }

  // ENHANCED update handler for group sessions
  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors")
      return
    }
    setIsUpdating(true)
    try {
      let updates: any
      if (isGroupSession) {
        // Enhanced group session updates
        const groupSession = appointment as GroupSession
        updates = {
          status,
          notes,
          groupPaymentStrategy,
          // For group sessions, we'll update all patients with the same payment info
          patientUpdates: groupSession.patients.map((patient) => ({
            patientId: patient.id,
            payment: {
              amount: paymentAmount,
              status: groupPaymentStrategy === "keep-current" ? patient.payment.status : paymentStatus,
              method: paymentMethod,
            },
            notes: notes || patient.notes,
          })),
        }
        // If completing group session, mark all patients as completed
        if (status === "completed") {
          updates.patientUpdates = updates.patientUpdates.map((update: any) => ({
            ...update,
            status: "completed",
            payment: {
              ...update.payment,
              status: groupPaymentStrategy === "all-paid" ? "paid" : update.payment.status,
            },
          }))
        }
        // If cancelling group session, handle refunds
        if (status === "cancelled") {
          updates.patientUpdates = updates.patientUpdates.map((update: any) => ({
            ...update,
            status: "cancelled",
            payment: {
              ...update.payment,
              status: update.payment.status === "paid" ? "refunded" : update.payment.status,
            },
          }))
        }
      } else {
        // Individual appointment updates (keep existing logic)
        updates = {
          status,
          payment: {
            amount: paymentAmount,
            status: paymentStatus,
            method: paymentMethod,
          },
          notes,
          sessionsCompleted,
        }
      }

      const appointmentId = isGroupSession
        ? (appointment as GroupSession).groupSessionId
        : (appointment as CalendarAppointment).id

      console.log("Sending update request:", { appointmentId, updates, isGroupSession })
      await onUpdate(appointmentId, updates, isGroupSession)
      onClose()
      // Enhanced success messages
      if (status === "completed") {
        if (isGroupSession) {
          toast.success(`Group session completed! All ${(appointment as GroupSession).totalPatients} patients updated.`)
        } else {
          const singleAppointment = appointment as CalendarAppointment
          toast.success(
            `Appointment completed! Session ${sessionsCompleted}/${singleAppointment?.totalSessions} recorded.`,
          )
        }
      } else if (status === "cancelled") {
        toast.success(isGroupSession ? "Group session cancelled successfully" : "Appointment cancelled successfully")
      } else {
        toast.success(isGroupSession ? "Group session updated successfully" : "Appointment updated successfully")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(isGroupSession ? "Failed to update group session" : "Failed to update appointment")
    } finally {
      setIsUpdating(false)
    }
  }

  // Quick complete function - enhanced for groups
  const handleQuickComplete = () => {
    setStatus("completed")
    if (!isGroupSession) {
      const singleAppointment = appointment as CalendarAppointment
      const newCompleted = Math.min(
        (singleAppointment?.sessionsCompleted || 0) + 1,
        singleAppointment?.totalSessions || 0,
      )
      setSessionsCompleted(newCompleted)
    }
    if (paymentAmount > 0) {
      setPaymentStatus("paid")
      if (isGroupSession) {
        setGroupPaymentStrategy("all-paid")
      }
    }
  }

  // Quick cancel function - enhanced for groups
  const handleQuickCancel = () => {
    setStatus("cancelled")
    setPaymentStatus("refunded")
    if (isGroupSession) {
      setGroupPaymentStrategy("keep-current") // Keep current status but will be handled in update logic
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#C83C92] to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                {isGroupSession ? (
                  <Users className="w-5 h-5 text-white" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isGroupSession ? "Update Group Session" : "Update Appointment"}
                </h3>
                <p className="text-purple-100 text-sm">
                  {isGroupSession
                    ? (appointment as GroupSession).groupSessionName
                    : (appointment as CalendarAppointment).patientName}
                </p>
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
            <h4 className="text-sm font-medium text-black mb-2">
              {isGroupSession ? "Group Session Details" : "Appointment Details"}
            </h4>
            {isGroupSession ? (
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>
                    Group: <span className="font-medium">{(appointment as GroupSession).groupSessionName}</span>
                  </p>
                  <p>
                    Patients: <span className="font-medium">{(appointment as GroupSession).totalPatients}</span>
                  </p>
                  <p>
                    Duration: <span className="font-medium">{(appointment as GroupSession).duration} min</span>
                  </p>
                </div>
                <div>
                  <p>
                    Type: <span className="font-medium">{(appointment as GroupSession).type}</span>
                  </p>
                  <p>
                    Revenue: <span className="font-medium">₹{(appointment as GroupSession).totalRevenue}</span>
                  </p>
                  <p>
                    Mode: <span className="font-medium">{(appointment as GroupSession).consultationMode}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm ">
                <div>
                  <p>
                    Patient: <span className="font-medium">{(appointment as CalendarAppointment).patientName}</span>
                  </p>
                  <p>
                    Type: <span className="font-medium">{(appointment as CalendarAppointment).type}</span>
                  </p>
                  <p>
                    Duration: <span className="font-medium">{(appointment as CalendarAppointment).duration} min</span>
                  </p>
                </div>
                <div>
                  <p>
                    Phone: <span className="font-medium">{(appointment as CalendarAppointment).phone}</span>
                  </p>
                  <p>
                    Sessions:{" "}
                    <span className="font-medium">
                      {(appointment as CalendarAppointment).sessionsCompleted}/
                      {(appointment as CalendarAppointment).totalSessions}
                    </span>
                  </p>
                  <p>
                    Paid Sessions:{" "}
                    <span className="font-medium">{(appointment as CalendarAppointment).sessionsPaid}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleQuickComplete}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              {isGroupSession ? "Complete Group Session" : "Quick Complete Session"}
            </button>
            <button
              onClick={handleQuickCancel}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              {isGroupSession ? "Cancel Group Session" : "Cancel Appointment"}
            </button>
          </div>
          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              {isGroupSession ? "Group Session Status" : "Appointment Status"} <span className="text-red-500">*</span>
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
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
          {/* Enhanced Group Payment Strategy */}
          {isGroupSession && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-black mb-3">Payment Strategy for All Patients</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupPaymentStrategy"
                    value="keep-current"
                    checked={groupPaymentStrategy === "keep-current"}
                    onChange={(e) => setGroupPaymentStrategy(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-black">Keep current payment status for each patient</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupPaymentStrategy"
                    value="all-paid"
                    checked={groupPaymentStrategy === "all-paid"}
                    onChange={(e) => setGroupPaymentStrategy(e.target.value as any)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-black">Mark all patients as PAID</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupPaymentStrategy"
                    value="all-pending"
                    checked={groupPaymentStrategy === "all-pending"}
                    onChange={(e) => setGroupPaymentStrategy(e.target.value as any)}
                    className="text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-black">Mark all patients as PENDING</span>
                </label>
              </div>
            </div>
          )}
          {/* Payment Status - only show for individual appointments or when group strategy is not keep-current */}
          {(!isGroupSession || groupPaymentStrategy !== "keep-current") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Payment Status</label>
                <select
                  style={{ color: "black" }}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isGroupSession && groupPaymentStrategy !== "keep-current"}
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
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>
          )}
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              {isGroupSession ? "Payment Amount (per patient)" : "Payment Amount"}
            </label>
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
          {/* Sessions Completed - only show for individual appointments and not cancelled */}
          {!isGroupSession && status !== "cancelled" && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">Sessions Completed</label>
              <input
                style={{ color: "black" }}
                type="number"
                value={sessionsCompleted}
                onChange={(e) => setSessionsCompleted(Number(e.target.value))}
                min="0"
                max={(appointment as CalendarAppointment)?.totalSessions || 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Number of sessions completed"
              />
            </div>
          )}
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Notes</label>
            <textarea
              style={{ color: "black" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isGroupSession ? "Add notes about the group session..." : "Add any notes about the appointment..."
              }
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
            className="px-6 py-2 bg-gradient-to-r from-[#C83C92] to-purple-600 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isGroupSession ? "Update Group Session" : "Update Appointment"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ENHANCED Reschedule Modal - keeping your exact implementation
const RescheduleModal: React.FC<{
  appointment: AppointmentOrGroup | null
  isOpen: boolean
  onClose: () => void
  onReschedule: (appointmentId: string, rescheduleData: any, isGroupSession?: boolean) => void
}> = ({ appointment, isOpen, onClose, onReschedule }) => {
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isGroupSession = appointment && "isGroupSession" in appointment && appointment.isGroupSession

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

  // ENHANCED fetch available slots function
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
      setAvailableSlots([])
    }
  }, [appointment, isOpen])

  // Fetch available slots when date changes
  useEffect(() => {
    if (rescheduleData.date && appointment) {
      const doctorId = isGroupSession
        ? (appointment as GroupSession).doctorId
        : (appointment as CalendarAppointment).doctorId
      fetchAvailableSlots(rescheduleData.date, doctorId)
    }
  }, [rescheduleData.date, appointment, isGroupSession])

  // ENHANCED reschedule submit handler
  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.startTime) {
      toast.error("Please select date and time")
      return
    }
    if (!appointment) return
    setIsSubmitting(true)
    try {
      const appointmentId = isGroupSession
        ? (appointment as GroupSession).groupSessionId
        : (appointment as CalendarAppointment).id
      const doctorId = isGroupSession
        ? (appointment as GroupSession).doctorId
        : (appointment as CalendarAppointment).doctorId

      const reschedulePayload = {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime == "06:15 PM" ? "06:00 PM" : rescheduleData?.endTime,
        therapistId: doctorId,
        reason: rescheduleData.reason,
        // Enhanced group session data
        ...(isGroupSession && {
          isGroupReschedule: true,
          groupSessionId: (appointment as GroupSession).groupSessionId,
          totalPatients: (appointment as GroupSession).totalPatients,
        }),
      }

      console.log("Dashboard reschedule - sending enhanced data:", {
        appointmentId,
        reschedulePayload,
        isGroupSession,
      })

      await onReschedule(appointmentId, reschedulePayload, isGroupSession)
      onClose()
      toast.success(isGroupSession ? "Group session rescheduled successfully" : "Appointment rescheduled successfully")
    } catch (error) {
      console.error("Error rescheduling:", error)
      toast.error(isGroupSession ? "Failed to reschedule group session" : "Failed to reschedule appointment")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !appointment) return null

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
                <h3 className="text-lg font-semibold text-white">
                  {isGroupSession ? "Reschedule Group Session" : "Reschedule Appointment"}
                </h3>
                <p className="text-purple-100 text-sm">
                  {isGroupSession
                    ? (appointment as GroupSession).groupSessionName
                    : (appointment as CalendarAppointment).patientName}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Current Appointment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-black mb-2">
              {isGroupSession ? "Current Group Session" : "Current Appointment"}
            </h4>
            {isGroupSession ? (
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <p>
                    Group: <span className="font-medium">{(appointment as GroupSession).groupSessionName}</span>
                  </p>
                  <p>
                    <span className="font-medium">{(appointment as GroupSession).type}</span>
                  </p>
                </div>
                <div className="flex justify-between mt-1">
                  <p>
                    Patients: <span className="font-medium">{(appointment as GroupSession).totalPatients}</span>
                  </p>
                  <p>
                    Status: <span className="font-medium capitalize">{(appointment as GroupSession).status}</span>
                  </p>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <span className="font-medium text-blue-800">Note:</span>
                  <span className="text-blue-700 ml-1">
                    Rescheduling will update all {(appointment as GroupSession).totalPatients} patients in this group
                    session.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <p>
                    Patient: <span className="font-medium">{(appointment as CalendarAppointment).patientName}</span>
                  </p>
                  <p>
                    <span className="font-medium">{(appointment as CalendarAppointment).type}</span>
                  </p>
                </div>
                <div className="flex justify-between mt-1">
                  <p>
                    Duration:{" "}
                    <span className="font-medium">{(appointment as CalendarAppointment).duration} minutes</span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className="font-medium capitalize">{(appointment as CalendarAppointment).status}</span>
                  </p>
                </div>
              </div>
            )}
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
                {rescheduleData?.endTime == "06:15 PM" ? "06:00 PM" : rescheduleData?.endTime}
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
              placeholder={
                isGroupSession
                  ? "Enter reason for rescheduling the group session..."
                  : "Enter reason for rescheduling..."
              }
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
                {isGroupSession ? "Reschedule Group" : "Reschedule Appointment"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component - keeping your existing structure exactly
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
    <div className="min-h-screen w-full font-sans">
      {/* Fixed container that accounts for sidebar */}
      <div className="ml-[70px] w-[calc(100vw-50px)] p-6 pt-18 overflow-hidden">
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
        <div className="bg-white rounded-lg border border-gray-200 p-2 w-full overflow-hidden">
          <DoctorScheduleTable />
        </div>
      </div>
    </div>
  )
}

// ENHANCED Doctor Schedule Table Component - keeping all your original functionality
const DoctorScheduleTable: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<CalendarApiResponse["data"]>({})
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ doctor: string; time: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentOrGroup | null>(null)
  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  // Group Session View Modal State
  const [showGroupViewModal, setShowGroupViewModal] = useState(false)
  const [selectedGroupSession, setSelectedGroupSession] = useState<GroupSession | null>(null)
  const router = useRouter()

  // Reference to the table container for scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Handle scroll left and right
  const handleScroll = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = 600
      const currentScroll = tableContainerRef.current.scrollLeft
      const newScroll = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount
      console.log(`Scrolling ${direction}, current: ${currentScroll}, new: ${newScroll}`)
      tableContainerRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      })
    } else {
      console.log("tableContainerRef.current is null")
    }
  }

  // Handle status update click
  const handleStatusClick = (appointment: AppointmentOrGroup) => {
    setSelectedAppointment(appointment)
    setShowStatusModal(true)
  }

  // Handle reschedule click
  const handleRescheduleClick = (appointment: AppointmentOrGroup) => {
    setSelectedAppointment(appointment)
    setShowRescheduleModal(true)
  }

  // Handle group session view click
  const handleGroupViewClick = (groupSession: GroupSession) => {
    setSelectedGroupSession(groupSession)
    setShowGroupViewModal(true)
  }

  // ENHANCED appointment update handler - keeping your exact logic
  const handleAppointmentUpdate = async (appointmentId: string, updates: any, isGroupSession = false) => {
    console.log("Enhanced update - processing:", { appointmentId, updates, isGroupSession })
    try {
      let endpoint: string
      let requestBody: any
      if (isGroupSession) {
        // Enhanced group session update endpoint
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/group/${appointmentId}/update`
        requestBody = {
          status: updates.status,
          notes: updates.notes,
          groupPaymentStrategy: updates.groupPaymentStrategy || "keep-current",
          // Enhanced patient updates with individual handling
          patientUpdates: updates.patientUpdates || [],
          // Global payment settings for group
          globalPayment: {
            amount: updates.payment?.amount,
            method: updates.payment?.method,
          },
        }
        console.log("Group session update payload:", requestBody)
      } else {
        // Individual appointment update (keep existing logic)
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/updateappointment/${appointmentId}`
        requestBody = updates
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update ${isGroupSession ? "group session" : "appointment"}`)
      }

      const result = await response.json()
      console.log("Update response:", result)

      // Enhanced local state update
      setScheduleData((prevData) => {
        const newData = { ...prevData }
        // Find and update the appointment in the schedule data
        Object.keys(newData).forEach((doctorName) => {
          Object.keys(newData[doctorName]).forEach((timeSlot) => {
            const appointment = newData[doctorName][timeSlot]
            if (appointment) {
              if (isGroupSession && "isGroupSession" in appointment && appointment.isGroupSession) {
                if (appointment.groupSessionId === appointmentId) {
                  // Enhanced group session update
                  newData[doctorName][timeSlot] = {
                    ...appointment,
                    status: updates.status,
                    // Update all patients in the group based on strategy
                    patients: appointment.patients.map((patient) => {
                      const patientUpdate = updates.patientUpdates?.find((pu: any) => pu.patientId === patient.id)
                      if (patientUpdate) {
                        return {
                          ...patient,
                          payment: patientUpdate.payment,
                          notes: patientUpdate.notes || patient.notes,
                        }
                      }
                      return patient
                    }),
                  }
                }
              } else if (!("isGroupSession" in appointment) && appointment.id === appointmentId) {
                // Update single appointment
                newData[doctorName][timeSlot] = {
                  ...appointment,
                  ...updates,
                  ...(result.data && {
                    status: result.data.status,
                    sessionsCompleted: result.data.sessionsCompleted,
                    payment: result.data.payment,
                    notes: result.data.notes,
                  }),
                }
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

  // ENHANCED reschedule submission handler - keeping your exact logic
  const handleRescheduleSubmit = async (appointmentId: string, rescheduleData: any, isGroupSession = false) => {
    try {
      console.log("Enhanced reschedule - processing:", {
        appointmentId,
        rescheduleData,
        isGroupSession,
      })
      let endpoint: string
      let requestBody: any
      if (isGroupSession) {
        // Enhanced group session reschedule endpoint
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/group/${appointmentId}/reschedule`
        requestBody = {
          ...rescheduleData,
          isGroupReschedule: true,
          // Additional group session specific data
          groupSessionId: appointmentId,
          totalPatients: rescheduleData.totalPatients,
        }
      } else {
        // Individual appointment reschedule
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/dashboard-reschedule`
        requestBody = rescheduleData
      }

      console.log("Reschedule API call:", { endpoint, requestBody })
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error ||
          errorData.message ||
          `Failed to reschedule ${isGroupSession ? "group session" : "appointment"}`,
        )
      }

      const result = await response.json()
      console.log("Enhanced reschedule - API response:", result)

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

  // Keeping your exact fetchCalendarData function
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
        console.log("apiresponse", apiResponse.data)
        const firstDoctorSlots = doctorNames.length > 0 ? Object.keys(apiResponse.data[doctorNames[0]]) : []
        setTimeSlots(firstDoctorSlots)
        // Enhanced doctor processing with specialty-based sorting and coloring
        const doctorsData = doctorNames.map((name) => {
          const specialty = getSpecialtyFromName(name)
          return {
            name,
            specialty,
            color: specialty, // We'll use specialty for color determination
          }
        })
        // Sort doctors by specialty priority
        const sortedDoctors = sortDoctorsBySpecialty(doctorsData)
        console.log("Sorted doctors by specialty:", sortedDoctors)
        setDoctors(sortedDoctors)
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast.error("Failed to fetch calendar data")
    } finally {
      setLoading(false)
    }
  }

  // Keeping your exact specialty functions
  const getSpecialtyFromName = (doctorName: string): string => {
    const name = doctorName.toLowerCase()
    if (name.includes("occupational therapist") || name.includes("pediatric occupational therapist")) {
      return "Occupational Therapist"
    }
    if (name.includes("speech language therapist") || name.includes("speech language pathologist")) {
      return "Speech Language Therapist"
    }
    if (name.includes("sp.ed")) {
      return "Special Education"
    }
    return "Specialist"
  }

  const getDoctorHeaderColorBySpecialty = (specialty: string) => {
    switch (specialty) {
      case "Occupational Therapist":
        return "from-blue-500 to-blue-600"
      case "Speech Language Therapist":
        return "from-yellow-400 to-orange-500"
      case "Special Education":
        return "from-purple-500 to-purple-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const sortDoctorsBySpecialty = (doctors: Array<{ name: string; specialty: string; color: string }>) => {
    const specialtyOrder = {
      "Occupational Therapist": 1,
      "Speech Language Therapist": 2,
      "Special Education": 3,
      Specialist: 4,
    }
    return doctors.sort((a, b) => {
      const orderA = specialtyOrder[a.specialty as keyof typeof specialtyOrder] || 999
      const orderB = specialtyOrder[b.specialty as keyof typeof specialtyOrder] || 999
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // If same specialty, sort alphabetically by name
      return a.name.localeCompare(b.name)
    })
  }

  const getDoctorHeaderColor = (specialty: string) => {
    return getDoctorHeaderColorBySpecialty(specialty)
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

  // ENHANCED cancel appointment function - keeping your exact logic
  const handleCancelAppointment = async (appointment: AppointmentOrGroup) => {
    const isGroupSession = "isGroupSession" in appointment && appointment.isGroupSession
    const confirmMessage = isGroupSession
      ? `Are you sure you want to cancel this group session? This will cancel appointments for all ${(appointment as GroupSession).totalPatients} patients.`
      : "Are you sure you want to cancel this appointment?"

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const updates = {
        status: "cancelled",
        payment: {
          status: "refunded",
        },
        // Enhanced group session cancellation
        ...(isGroupSession && {
          groupPaymentStrategy: "keep-current",
          patientUpdates: (appointment as GroupSession).patients.map((patient) => ({
            patientId: patient.id,
            status: "cancelled",
            payment: {
              ...patient.payment,
              status: patient.payment.status === "paid" ? "refunded" : patient.payment.status,
            },
          })),
        }),
      }

      const appointmentId = isGroupSession
        ? (appointment as GroupSession).groupSessionId
        : (appointment as CalendarAppointment).id

      await handleAppointmentUpdate(appointmentId, updates, isGroupSession)
      toast.success(isGroupSession ? "Group session cancelled successfully" : "Appointment cancelled successfully")
    } catch (error) {
      console.error("Cancel error:", error)
      toast.error(isGroupSession ? "Failed to cancel group session" : "Failed to cancel appointment")
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

  // FIXED export functions - CSV only downloads CSV, PDF only downloads PDF
  const handleExportTableFormat = async () => {
    try {
      // Sort doctors: those with appointments first, then those without
      const doctorsWithAppointments: typeof doctors = []
      const doctorsWithoutAppointments: typeof doctors = []

      doctors.forEach((doctor) => {
        const hasAppointments = getAppointmentCount(doctor.name) > 0
        if (hasAppointments) {
          doctorsWithAppointments.push(doctor)
        } else {
          doctorsWithoutAppointments.push(doctor)
        }
      })

      const sortedDoctors = [...doctorsWithAppointments, ...doctorsWithoutAppointments]

      // Generate simplified table format CSV
      const { csvContent } = exportTableFormatCSV(scheduleData, sortedDoctors, timeSlots, selectedDate)

      // Download CSV file
      const filename = `schedule_table_${selectedDate.replace(/-/g, "_")}.csv`
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`CSV exported successfully!`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export CSV")
    }
  }

  const handleExportPDF = async () => {
    try {
      // Generate simplified table format data for PDF
      const { tableData } = exportTableFormatCSV(scheduleData, doctors, timeSlots, selectedDate)

      // Generate PDF directly without downloading CSV
      await generatePDF(tableData, selectedDate)

      toast.success("PDF exported successfully!")
    } catch (error) {
      console.error("PDF export error:", error)
      if (error instanceof Error) {
        toast.error(`PDF Export Failed: ${error.message}`)
      } else {
        toast.error("Failed to export PDF. Please try again.")
      }
    }
  }

  const handleExportBoth = async () => {
    try {
      // Sort doctors: those with appointments first, then those without
      const doctorsWithAppointments: typeof doctors = []
      const doctorsWithoutAppointments: typeof doctors = []

      doctors.forEach((doctor) => {
        const hasAppointments = getAppointmentCount(doctor.name) > 0
        if (hasAppointments) {
          doctorsWithAppointments.push(doctor)
        } else {
          doctorsWithoutAppointments.push(doctor)
        }
      })

      const sortedDoctors = [...doctorsWithAppointments, ...doctorsWithoutAppointments]

      // Generate simplified table format data
      const { csvContent, tableData } = exportTableFormatCSV(scheduleData, sortedDoctors, timeSlots, selectedDate)

      // Download CSV file
      const filename = `schedule_table_${selectedDate.replace(/-/g, "_")}.csv`
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Generate PDF
      await generatePDF(tableData, selectedDate)

      toast.success("Both CSV and PDF exported successfully!")
    } catch (error) {
      console.error("Export both error:", error)
      if (error instanceof Error) {
        toast.error(`Export Failed: ${error.message}`)
      } else {
        toast.error("Failed to export files. Please try again.")
      }
    }
  }

  return (
    <div className="w-full bg-gradient-to-br font-sans from-slate-50 to-blue-50 min-h-screen overflow-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Doctor Schedule</h1>
                <p className="text-gray-600">Daily consultation schedule with simplified export format</p>
              </div>
            </div>
            {/* Enhanced Export Controls */}
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

              {/* Enhanced Export Dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {/* <button
                      onClick={handleExportTableFormat}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV Only
                    </button> */}
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export PDF Only
                    </button>
                    {/* <button
                      onClick={handleExportBoth}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Both (CSV + PDF)
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {console.log("selected slot and time", selectedSlot, selectedDate)}
        {selectedSlot && (
          <div className="mt-6 mb-4 p-4 bg-white rounded-xl shadow-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Selected: {selectedSlot.doctor} at {formatTime(selectedSlot.time)}
            </h3>
            <div className="flex gap-3">
              {!scheduleData[selectedSlot.doctor]?.[selectedSlot.time] ? (
                <Link
                  href={`/dashboard/scheduleAppointment?slot=${selectedSlot?.time}&date=${selectedDate}&doctorName=${selectedSlot?.doctor}`}
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Book Appointment
                  </button>
                </Link>
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

        {/* Schedule Table with Enhanced Horizontal Scroll - keeping your exact implementation */}
        <div className="bg-white rounded-2xl shadow-xl border -mt-3 border-gray-200 overflow-hidden w-full">
          {/* Table Container with Horizontal Scroll */}
          <div className="w-full flex flex-col">
            {/* Custom Scroll Container */}
            <div
              ref={tableContainerRef}
              className="overflow-x-auto w-full relative"
              style={{
                scrollBehavior: "smooth",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              <style jsx>{`
                .sticky-header {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  background: white;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
              `}</style>
              <table className="w-full" style={{ minWidth: "1200px" }}>
                {/* Sticky Table Header */}
                <thead className="sticky-header">
                  <tr>
                    <th className="p-4 bg-gradient-to-r from-slate-600 to-slate-700 text-left sticky left-0 z-8 min-w-[80px]">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Clock className="w-5 h-5" />
                        Time
                      </div>
                    </th>
                    {/* Keeping your exact doctor header implementation */}
                    {doctors.map((doctor) => (
                      <th key={doctor.name} className="p-2 text-center min-w-[155px] bg-white">
                        <div
                          className={`bg-gradient-to-r ${getDoctorHeaderColor(doctor.specialty)} rounded-lg p-2 text-white`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {getShortenedDoctorName(doctor.name)}
                            </span>
                          </div>
                          <div className="text-xs opacity-90">
                            {doctor?.specialty?.replace("Therapist", "").trim() +
                              " " +
                              getAppointmentCount(doctor.name)}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                {/* Table Body - keeping your exact implementation */}
                <tbody>
                  {timeSlots.map((time, timeIndex) => (
                    <tr
                      key={time}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${timeIndex % 2 === 0 ? "bg-gray-25" : "bg-white"
                        }`}
                    >
                      {/* Time Column */}
                      <td className="p-4 border-r border-gray-200 bg-slate-50 sticky left-0 z-8 min-w-[80px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black text-sm whitespace-nowrap">{formatTime(time)}</span>
                        </div>
                      </td>
                      {/* Doctor Columns */}
                      {doctors.map((doctor) => {
                        const appointment = scheduleData[doctor.name]?.[time]
                        const isGroupSession =
                          appointment && "isGroupSession" in appointment && appointment.isGroupSession
                        return (
                          <td
                            key={`${doctor.name}-${time}`}
                            className="p-1 border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors min-w-[70px]"
                            onClick={() => handleSlotClick(doctor.name, time)}
                          >
                            {appointment ? (
                              <div
                                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getAppointmentTypeColor(
                                  appointment,
                                  doctor.color,
                                )}`}
                              >
                                <div className="flex items-start flex-col justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {isGroupSession ? (
                                      // Enhanced Group Session Display
                                      <>
                                        <div className="flex items-center gap-1 mb-1">
                                          <Users className="w-3 h-3 flex-shrink-0" />
                                          <p className="font-semibold text-xs truncate">
                                            {(appointment as GroupSession).groupSessionName.split(" ").length > 2
                                              ? (appointment as GroupSession).groupSessionName.split(" ")[0] +
                                              " " +
                                              (appointment as GroupSession).groupSessionName.split(" ")[1] +
                                              ".."
                                              : (appointment as GroupSession).groupSessionName}
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      // Individual Appointment Display
                                      <>
                                        <div className="flex items-center gap-1 mb-1">
                                          <User className="w-3 h-3 flex-shrink-0" />
                                          <p className="font-semibold text-xs truncate">
                                            {(appointment as CalendarAppointment).patientName}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-row gap-1">
                                    {isGroupSession ? (
                                      // Enhanced Group Session Actions
                                      <>
                                        <button
                                          className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleGroupViewClick(appointment as GroupSession)
                                          }}
                                          title="View Group Patients"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                        <button
                                          className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStatusClick(appointment)
                                          }}
                                          title="Update Group Status"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                        </button>
                                        <button
                                          className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRescheduleClick(appointment)
                                          }}
                                          title="Reschedule Group"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCancelAppointment(appointment)
                                          }}
                                          title="Cancel Group Session"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      // Individual Appointment Actions
                                      <>
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
                                            handleCancelAppointment(appointment)
                                          }}
                                          title="Cancel Appointment"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-25 transition-all min-h-[70px] flex items-center justify-center">
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
            {/* Scroll Navigation Buttons */}
            <div className="flex justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => handleScroll("left")}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#C83C92] to-purple-600 text-white rounded-lg hover:from-[#a21e6b] hover:to-purple-700 transition-colors shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Scroll Left</span>
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#C83C92] to-purple-600 text-white rounded-lg hover:from-[#a21e6b] hover:to-purple-700 transition-colors shadow-md"
              >
                <span className="font-medium">Scroll Right</span>
                <ChevronRight className="w-5 h-5" />
              </button>
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
                <Link
                  href={`/dashboard/scheduleAppointment?slot=${selectedSlot?.time}&date=${selectedDate}&doctorName=${selectedSlot?.doctor}`}
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Book Appointment
                  </button>
                </Link>
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

        {/* Enhanced Doctor Statistics - keeping your exact implementation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors?.map((doctor) => {
            console.log(doctors, "doctosdata")
            const doctorAppointments = Object.values(scheduleData[doctor.name] || {}).filter(
              Boolean,
            ) as AppointmentOrGroup[]
            const completedCount = doctorAppointments.filter((apt) => apt.status === "completed").length
            // Enhanced calculation for paid count and total revenue considering both individual and group appointments
            let paidCount = 0
            let totalRevenue = 0
            let groupSessionsCount = 0
            let individualAppointmentsCount = 0

            doctorAppointments.forEach((apt) => {
              if ("isGroupSession" in apt && apt.isGroupSession) {
                // Group session
                groupSessionsCount += 1
                const groupSession = apt as GroupSession
                const paidPatients = groupSession.patients.filter((p) => p.payment.status === "paid")
                paidCount += paidPatients.length
                totalRevenue += paidPatients.reduce((sum, p) => sum + p.payment.amount, 0)
              } else {
                // Individual appointment
                individualAppointmentsCount += 1
                const singleApt = apt as CalendarAppointment
                if (singleApt.payment?.status === "paid") {
                  paidCount += 1
                  totalRevenue += singleApt.payment.amount
                }
              }
            })

            return (
              <div key={doctor.name} className="p-4 bg-white rounded-xl shadow-sm border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-gradient-to-r ${getDoctorHeaderColor(doctor.specialty)} rounded-lg`}>
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
                    <span className="text-gray-600">Individual:</span>
                    <span className="font-semibold text-blue-600">{individualAppointmentsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Groups:</span>
                    <span className="font-semibold text-purple-600">{groupSessionsCount}</span>
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

      {/* Enhanced Group Session View Modal */}
      <GroupSessionViewModal
        groupSession={selectedGroupSession}
        isOpen={showGroupViewModal}
        onClose={() => {
          setShowGroupViewModal(false)
          setSelectedGroupSession(null)
        }}
        onUpdateStatus={(groupSession) => {
          setShowGroupViewModal(false)
          setSelectedAppointment(groupSession)
          setShowStatusModal(true)
        }}
        onReschedule={(groupSession) => {
          setShowGroupViewModal(false)
          setSelectedAppointment(groupSession)
          setShowRescheduleModal(true)
        }}
      />

      {/* Enhanced Status Update Modal */}
      <StatusUpdateModal
        appointment={selectedAppointment}
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false)
          setSelectedAppointment(null)
        }}
        onUpdate={handleAppointmentUpdate}
      />

      {/* Enhanced Reschedule Modal */}
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

// Add this function to determine appointment type color
const getAppointmentTypeColor = (appointment: AppointmentOrGroup, doctorColor: string) => {
  if ("isGroupSession" in appointment && appointment.isGroupSession) {
    return "border-l-4 border-l-purple-500 bg-purple-200 text-purple-900"
  }
  switch (appointment.type) {
    case "initial assessment":
      return "bg-blue-200 border-blue-400 text-blue-900"
    case "therapy session":
      return "bg-orange-200 border-orange-400 text-orange-900"
    case "follow-up":
      return "bg-green-200 border-green-400 text-green-900"
    default:
      return "bg-gray-200 border-gray-400 text-gray-900"
  }
}

export default ReceptionistDashboard
