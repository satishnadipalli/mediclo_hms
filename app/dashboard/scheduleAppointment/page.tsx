"use client"
import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { Calendar, ChevronLeft, Search, Plus, X, AlertTriangle, Clock, User, CalendarDays, Lock, Users } from 'lucide-react'
import { toast } from "react-toastify"
import { useRouter, useSearchParams } from "next/navigation"

// Better color palette - semi-transparent and professional
const CHIP_COLORS = [
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-red-100 border-red-300 text-red-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-gray-100 border-gray-300 text-gray-800",
]

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
  gender?: string
  parentInfo?: {
    name?: string
    phone?: string
    email?: string
    relationship: string
    address?: string
  }
  status: string
}

interface ScheduledAppointment {
  id: string
  date: string
  dateFormatted: string
  time: string
  therapist: any
  service: any
  colorClass: string
}

const AppointmentSchedulingLoading = () => {
  return (
    <div className="font-sans p-6 max-w-[84%] mt-15 ml-[170px] mx-auto overflow-y-auto hide-scrollbar">
      <div className="animate-pulse">
        <div className="-mb-10">
          <div className="flex items-center mb-2">
            <div className="w-5 h-5 bg-gray-300 rounded mr-2"></div>
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="w-64 h-8 bg-gray-300 rounded mb-2"></div>
          <div className="flex items-center">
            <div className="w-20 h-4 bg-gray-300 rounded"></div>
            <div className="w-4 h-4 bg-gray-300 rounded mx-2"></div>
            <div className="w-32 h-4 bg-gray-300 rounded"></div>
            <div className="w-4 h-4 bg-gray-300 rounded mx-2"></div>
            <div className="w-40 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="flex justify-end mb-6 mt-10">
          <div className="w-80 h-10 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-48 h-6 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full h-12 bg-gray-300 rounded"></div>
              <div className="w-full h-12 bg-gray-300 rounded"></div>
              <div className="w-full h-12 bg-gray-300 rounded"></div>
              <div className="w-full h-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppointmentSchedulingContent = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calendarData, setCalendarData] = useState<CalendarApiResponse["data"]>({})
  const [availableDoctors, setAvailableDoctors] = useState<Array<{ id: string; name: string }>>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [services, setServices] = useState<Array<{ _id: string; name: string; price: number }>>([])
  const [conflictingSlots, setConflictingSlots] = useState<string[]>([])
  const [patientConflicts, setPatientConflicts] = useState<{ [timeSlot: string]: string }>({})
  // NEW: Group session specific conflict tracking
  const [groupConflictingSlots, setGroupConflictingSlots] = useState<string[]>([])
  const [groupPatientConflicts, setGroupPatientConflicts] = useState<{ [timeSlot: string]: string[] }>({})

  const searchParams = useSearchParams()
  const slot = searchParams.get("slot")
  const date = searchParams.get("date")
  const doctorName = searchParams.get("doctorName")

  const autoFillExecuted = useRef(false)
  const initialDateSet = useRef(false)

  const [formData, setFormData] = useState({
    doctor: "",
    appointmentDates: [] as string[],
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
    // Group appointment fields
    isGroupSession: false,
    groupSessionName: "",
    maxCapacity: 6,
    selectedPatients: [] as Patient[],
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isMultipleAppointments, setIsMultipleAppointments] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({})
  const [showValidation, setShowValidation] = useState(false)
  const [currentDateInput, setCurrentDateInput] = useState("")
  const [scheduledAppointments, setScheduledAppointments] = useState<ScheduledAppointment[]>([])
  const [persistentDoctor, setPersistentDoctor] = useState<any>(null)
  const [persistentService, setPersistentService] = useState<any>(null)

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

  const fetchCalendarData = async (selectedDate: string, doctorId?: string) => {
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
        if (persistentDoctor && doctorId === persistentDoctor.id) {
          setFormData((prev) => ({
            ...prev,
            doctor: persistentDoctor.id,
          }))
        }
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

  const checkPatientConflicts = (patientId: string, dates: string[], timeSlot: string) => {
    if (!patientId || dates.length === 0 || !timeSlot) return []
    const conflicts: Array<{ date: string; doctor: string; doctorName: string }> = []
    dates.forEach((date) => {
      Object.keys(calendarData).forEach((doctorId) => {
        const doctorSlots = calendarData[doctorId]?.slots
        if (doctorSlots && doctorSlots[timeSlot]) {
          const appointment = doctorSlots[timeSlot]
          if (appointment && appointment.patientId === patientId) {
            conflicts.push({
              date,
              doctor: doctorId,
              doctorName: calendarData[doctorId]?.name || doctorId,
            })
          }
        }
      })
    })
    return conflicts
  }

  const getAllPatientConflicts = (patientId: string, dates: string[]) => {
    if (!patientId || dates.length === 0) return { conflictingSlots: [], conflicts: {} }
    const conflictingSlots: string[] = []
    const conflicts: { [timeSlot: string]: string } = {}
    const allTimeSlots = new Set<string>()
    Object.values(calendarData).forEach((doctorData) => {
      if (doctorData?.slots) {
        Object.keys(doctorData.slots).forEach((slot) => allTimeSlots.add(slot))
      }
    })
    allTimeSlots.forEach((timeSlot) => {
      dates.forEach((date) => {
        Object.keys(calendarData).forEach((doctorId) => {
          const doctorSlots = calendarData[doctorId]?.slots
          if (doctorSlots && doctorSlots[timeSlot]) {
            const appointment = doctorSlots[timeSlot]
            if (appointment && appointment.patientId === patientId) {
              if (!conflictingSlots.includes(timeSlot)) {
                conflictingSlots.push(timeSlot)
                conflicts[timeSlot] = `Already booked with ${calendarData[doctorId]?.name || "another doctor"}`
              }
            }
          }
        })
      })
    })
    return { conflictingSlots, conflicts }
  }

  // NEW: Function to check conflicts for multiple patients in group sessions
  const getGroupPatientConflicts = (selectedPatients: Patient[], dates: string[]) => {
    if (!selectedPatients.length || dates.length === 0) {
      return { conflictingSlots: [], conflicts: {} }
    }
    const conflictingSlots: string[] = []
    const conflicts: { [timeSlot: string]: string[] } = {}
    // Get all available time slots
    const allTimeSlots = new Set<string>()
    Object.values(calendarData).forEach((doctorData) => {
      if (doctorData?.slots) {
        Object.keys(doctorData.slots).forEach((slot) => allTimeSlots.add(slot))
      }
    })
    // Check each time slot for conflicts with any selected patient
    allTimeSlots.forEach((timeSlot) => {
      const conflictingPatients: string[] = []
      selectedPatients.forEach((patient) => {
        dates.forEach((date) => {
          Object.keys(calendarData).forEach((doctorId) => {
            const doctorSlots = calendarData[doctorId]?.slots
            if (doctorSlots && doctorSlots[timeSlot]) {
              const appointment = doctorSlots[timeSlot]
              if (appointment && appointment.patientId === patient._id) {
                const patientName =
                  patient.firstName && patient.lastName
                    ? `${patient.firstName} ${patient.lastName}`
                    : patient.fullName || patient.childName || "Unknown Patient"
                const doctorName = calendarData[doctorId]?.name || "another doctor"
                const conflictInfo = `${patientName} (with ${doctorName})`
                if (!conflictingPatients.includes(conflictInfo)) {
                  conflictingPatients.push(conflictInfo)
                }
              }
            }
          })
        })
      })
      if (conflictingPatients.length > 0) {
        conflictingSlots.push(timeSlot)
        conflicts[timeSlot] = conflictingPatients
      }
    })
    return { conflictingSlots, conflicts }
  }

  // NEW: Function to check if a specific patient has conflict at selected time slot
  const checkPatientConflictAtTimeSlot = (patient: Patient, timeSlot: string, dates: string[]) => {
    if (!timeSlot || !dates.length) return false
    
    return dates.some((date) => {
      return Object.keys(calendarData).some((doctorId) => {
        const doctorSlots = calendarData[doctorId]?.slots
        if (doctorSlots && doctorSlots[timeSlot]) {
          const appointment = doctorSlots[timeSlot]
          return appointment && appointment.patientId === patient._id
        }
        return false
      })
    })
  }

  const handlePatientToggle = (patient: Patient, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedPatients: checked
        ? [...prev.selectedPatients, patient]
        : prev.selectedPatients.filter((p) => p._id !== patient._id),
    }))
  }

  const removePatientFromGroup = (patientId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPatients: prev.selectedPatients.filter((p) => p._id !== patientId),
    }))
  }

  const addAppointmentToSchedule = () => {
    const currentDoctor = persistentDoctor ? persistentDoctor.id : formData.doctor
    const currentServiceId = persistentService ? persistentService._id : formData.serviceId
    if (!currentDoctor || !formData.appointmentDates.length || !formData.timeSlot || !currentServiceId) {
      toast.error("Please complete all selections before adding appointment")
      return
    }
    if (formData.isGroupSession) {
      if (!formData.groupSessionName.trim()) {
        toast.error("Please enter a group session name")
        return
      }
      if (formData.selectedPatients.length === 0) {
        toast.error("Please select at least one patient for the group session")
        return
      }
      if (formData.selectedPatients.length > formData.maxCapacity) {
        toast.error(`Maximum ${formData.maxCapacity} patients allowed per group session`)
        return
      }
    }
    const doctor = persistentDoctor || availableDoctors.find((d) => d.id === formData.doctor)
    const service = persistentService || services.find((s) => s._id === formData.serviceId)
    if (!doctor || !service) {
      toast.error("Invalid doctor or service selection")
      return
    }
    const exists = scheduledAppointments.some(
      (apt) => formData.appointmentDates.some((date) => apt.date === date) && apt.time === formData.timeSlot,
    )
    if (exists) {
      toast.error("This time slot is already scheduled for one of the selected dates")
      return
    }
    const newAppointments: ScheduledAppointment[] = formData.appointmentDates.map((date, index) => {
      const colorClass = CHIP_COLORS[(scheduledAppointments.length + index) % CHIP_COLORS.length]
      return {
        id: Math.random().toString(36).substr(2, 9),
        date: date,
        dateFormatted: new Date(date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        time: formData.timeSlot,
        therapist: doctor,
        service: service,
        colorClass,
      }
    })
    setScheduledAppointments((prev) => [...prev, ...newAppointments])
    if (!persistentDoctor) {
      setPersistentDoctor(doctor)
      setPersistentService(service)
      toast.success(`Doctor (${doctor.name}) and Service (${service.name}) are now locked for subsequent appointments`)
    }
    setAvailableTimeSlots((prev) => prev.filter((slot) => slot !== formData.timeSlot))
    setFormData((prev) => ({
      ...prev,
      timeSlot: "",
      appointmentDates: [],
      doctor: persistentDoctor ? persistentDoctor.id : prev.doctor,
      serviceId: persistentService ? persistentService._id : prev.serviceId,
      groupSessionName: "",
      selectedPatients: [],
    }))
    setCurrentDateInput("")
    const appointmentType = formData.isGroupSession ? "group session" : "appointment"
    toast.success(`${newAppointments.length} ${appointmentType}(s) added to schedule`)
  }

  const removeAppointmentFromSchedule = (appointmentId: string) => {
    setScheduledAppointments((prev) => {
      const updated = prev.filter((apt) => apt.id !== appointmentId)
      if (updated.length === 0) {
        setPersistentDoctor(null)
        setPersistentService(null)
        setFormData((prevForm) => ({
          ...prevForm,
          doctor: "",
          serviceId: "",
        }))
        toast.info("All appointments removed. Doctor and service unlocked.")
      }
      return updated
    })
    toast.info("Appointment removed from schedule")
  }

  const handleMultipleDateChange = (selectedDate: string) => {
    if (selectedDate && selectedDate.length === 10 && selectedDate.includes("-")) {
      const dateObj = new Date(selectedDate)
      if (!isNaN(dateObj.getTime()) && selectedDate === dateObj.toISOString().split("T")[0]) {
        if (!formData.appointmentDates.includes(selectedDate)) {
          setFormData((prev) => ({
            ...prev,
            appointmentDates: [...prev.appointmentDates, selectedDate],
          }))
          toast.success(`Date ${new Date(selectedDate).toLocaleDateString()} added`)
          setCurrentDateInput("")
        } else {
          toast.info("Date already selected")
          setCurrentDateInput("")
        }
      }
    }
  }

  useEffect(() => {
    if (date && !initialDateSet.current && formData.appointmentDates.length === 0) {
      initialDateSet.current = true
      setFormData((prev) => ({
        ...prev,
        appointmentDates: [date],
      }))
    }
  }, [date])

  useEffect(() => {
    if (formData.appointmentDates.length > 0) {
      fetchCalendarData(formData.appointmentDates[0], persistentDoctor?.id)
      if (!autoFillExecuted.current && !persistentDoctor) {
        setFormData((prev) => ({
          ...prev,
          doctor: "",
          timeSlot: "",
        }))
      }
    }
  }, [formData.appointmentDates.join(","), persistentDoctor])

  useEffect(() => {
    if (
      slot &&
      date &&
      doctorName &&
      availableDoctors.length > 0 &&
      !autoFillExecuted.current &&
      formData.appointmentDates.includes(date)
    ) {
      autoFillExecuted.current = true
      const matchingDoctor = availableDoctors.find((doctor) => {
        const doctorNameLower = doctor.name.toLowerCase()
        const searchNameLower = doctorName.toLowerCase()
        return doctorNameLower.includes(searchNameLower) || searchNameLower.includes(doctorNameLower)
      })
      if (matchingDoctor) {
        setFormData((prev) => ({
          ...prev,
          doctor: matchingDoctor.id,
          timeSlot: slot,
        }))
        toast.success(
          `Auto-filled appointment details for ${matchingDoctor.name} on ${new Date(date).toLocaleDateString()} at ${slot}`,
        )
      } else {
        setFormData((prev) => ({
          ...prev,
          timeSlot: slot,
        }))
        toast.info("Partially auto-filled appointment details. Please select the doctor manually.")
      }
    }
  }, [slot, date, doctorName, availableDoctors.length])

  useEffect(() => {
    if (patientSearchTerm.trim() === "") {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter((patient) => {
        const firstName = patient?.firstName || ""
        const lastName = patient?.lastName || ""
        const fullName = patient?.fullName || `${firstName} ${lastName}`.trim()
        const childName = patient?.childName || fullName || ""
        const parentName = patient?.parentName || patient?.parentInfo?.name || ""
        const motherName = patient?.parentInfo?.motherName || ""
        const phone = patient?.contactNumber || patient?.parentInfo?.phone || ""
        const motherPhone = patient?.parentInfo?.motherPhone || ""
        const patientId = patient?._id || patient?.id || ""
        const searchTerm = patientSearchTerm.toLowerCase()
        return (
          firstName.toLowerCase().includes(searchTerm) ||
          lastName.toLowerCase().includes(searchTerm) ||
          fullName.toLowerCase().includes(searchTerm) ||
          childName.toLowerCase().includes(searchTerm) ||
          parentName.toLowerCase().includes(searchTerm) ||
          motherName.toLowerCase().includes(searchTerm) ||
          phone.includes(patientSearchTerm) ||
          motherPhone.includes(patientSearchTerm) ||
          patientId.toLowerCase().includes(searchTerm)
        )
      })
      setFilteredPatients(filtered)
    }
  }, [patientSearchTerm, patients])

  // ENHANCED: Updated useEffect to handle group session conflicts
  useEffect(() => {
    if (formData.doctor && calendarData[formData.doctor]) {
      const doctorSlots = calendarData[formData.doctor].slots
      let availableSlots = Object.keys(doctorSlots).filter((timeSlot) => doctorSlots[timeSlot] === null)
      if (formData.appointmentDates.length > 0) {
        const scheduledSlotsForCurrentDates = scheduledAppointments
          .filter((apt) => formData.appointmentDates.includes(apt.date))
          .map((apt) => apt.time)
        availableSlots = availableSlots.filter((slot) => !scheduledSlotsForCurrentDates.includes(slot))
      }
      if (formData.isGroupSession && formData.selectedPatients.length > 0 && formData.appointmentDates.length > 0) {
        // NEW: Handle group session conflicts
        const { conflictingSlots, conflicts } = getGroupPatientConflicts(
          formData.selectedPatients,
          formData.appointmentDates,
        )
        setGroupConflictingSlots(conflictingSlots)
        setGroupPatientConflicts(conflicts)
        // Filter out slots where any selected patient has conflicts
        const nonConflictingSlots = availableSlots.filter((slot) => !conflictingSlots.includes(slot))
        setAvailableTimeSlots(nonConflictingSlots)
        // Clear individual patient conflicts for group sessions
        setConflictingSlots([])
        setPatientConflicts({})
      } else if (!formData.isGroupSession && selectedPatient && formData.appointmentDates.length > 0) {
        // Existing logic for individual appointments
        const { conflictingSlots, conflicts } = getAllPatientConflicts(selectedPatient._id, formData.appointmentDates)
        setConflictingSlots(conflictingSlots)
        setPatientConflicts(conflicts)
        const nonConflictingSlots = availableSlots.filter((slot) => !conflictingSlots.includes(slot))
        setAvailableTimeSlots(nonConflictingSlots)
        // Clear group conflicts for individual appointments
        setGroupConflictingSlots([])
        setGroupPatientConflicts({})
      } else {
        setAvailableTimeSlots(availableSlots)
        setConflictingSlots([])
        setPatientConflicts({})
        setGroupConflictingSlots([])
        setGroupPatientConflicts({})
      }
    } else {
      setAvailableTimeSlots([])
      setConflictingSlots([])
      setPatientConflicts({})
      setGroupConflictingSlots([])
      setGroupPatientConflicts({})
    }
  }, [
    formData.doctor,
    calendarData,
    selectedPatient,
    formData.appointmentDates,
    scheduledAppointments,
    formData.isGroupSession,
    formData.selectedPatients, // NEW: Added dependency for selected patients
  ])

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (persistentDoctor && persistentService) {
      setFormData((prev) => ({
        ...prev,
        doctor: persistentDoctor.id,
        serviceId: persistentService._id,
      }))
    }
  }, [persistentDoctor, persistentService])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

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
    setFieldErrors({})
    setShowValidation(false)
    const errors: { [key: string]: boolean } = {}
    console.log("=== FORM SUBMISSION DEBUG ===")
    console.log("Form Data:", formData)
    console.log("Is Group Session:", formData.isGroupSession)
    console.log("Group Session Name:", formData.groupSessionName)
    console.log("Selected Patients:", formData.selectedPatients)
    console.log("Is Multiple Appointments:", isMultipleAppointments)
    console.log("Scheduled Appointments:", scheduledAppointments)
    // Pre-submission conflict check for group sessions
    if (formData.isGroupSession && formData.selectedPatients.length > 0 && formData.appointmentDates.length > 0) {
      const { conflictingSlots } = getGroupPatientConflicts(formData.selectedPatients, formData.appointmentDates)
      if (conflictingSlots.includes(formData.timeSlot)) {
        const conflictingPatients = groupPatientConflicts[formData.timeSlot] || []
        toast.error(
          `Cannot schedule: The following patients already have appointments at this time: ${conflictingPatients.join(", ")}`,
        )
        return
      }
    }
    if (isMultipleAppointments) {
      if (scheduledAppointments.length === 0) {
        toast.error("Please add at least one appointment to the schedule")
        return
      }
    } else {
      if (!formData.doctor) errors.doctor = true
      if (!formData.appointmentDates[0]) errors.appointmentDates = true
      if (!formData.timeSlot) errors.timeSlot = true
      if (!formData.serviceId) errors.serviceId = true
    }
    if (formData.isGroupSession) {
      if (!formData.groupSessionName.trim()) {
        console.log("❌ Group session name is missing!")
        toast.error("Please enter a group session name")
        return
      }
      if (formData.selectedPatients.length === 0) {
        console.log("❌ No patients selected!")
        toast.error("Please select at least one patient for the group session")
        return
      }
      if (formData.selectedPatients.length > formData.maxCapacity) {
        console.log("❌ Too many patients selected!")
        toast.error(`Maximum ${formData.maxCapacity} patients allowed per group session`)
        return
      }
    }
    if (!formData.consultationMode) errors.consultationMode = true
    if (!formData.type) errors.type = true
    if (!formData.isGroupSession && !selectedPatient && (!formData.patientName || !formData.phone || !formData.email)) {
      if (!formData.patientName) errors.patientName = true
      if (!formData.phone) errors.phone = true
      if (!formData.email) errors.email = true
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setShowValidation(true)
      toast.error("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      let appointmentData
      if (formData.isGroupSession) {
        console.log("✅ Creating group appointment...")
        appointmentData = {
          therapistId: formData.doctor,
          serviceId: formData.serviceId,
          date: formData.appointmentDates[0],
          startTime: formData.timeSlot,
          endTime: calculateEndTime(formData.timeSlot),
          type: formData.type,
          consultationMode: formData.consultationMode,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod,
          groupSessionName: formData.groupSessionName,
          maxCapacity: formData.maxCapacity,
          patients: formData.selectedPatients.map((patient) => ({
            patientId: patient._id,
            patientName:
              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || patient.fullName || patient.childName,
            fatherName: patient.parentInfo?.name || patient.parentName || "",
            email: patient.email || patient.parentInfo?.email || "",
            phone: patient.contactNumber || patient.parentInfo?.phone || "",
          })),
        }
        console.log("Sending group appointment data:", JSON.stringify(appointmentData, null, 2))
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/group`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
          },
          body: JSON.stringify(appointmentData),
        })
        if (!response.ok) {
          let errorMessage = "Failed to create group appointment"
          try {
            const errorData = await response.json()
            console.error("Server error response:", errorData)
            // Handle different error response structures
            errorMessage = errorData.error || errorData.message || errorData.details || errorMessage
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError)
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
        const result = await response.json()
        console.log("✅ Successfully created group appointment", result)
        toast.success(
          `Group session "${formData.groupSessionName}" scheduled successfully for ${formData.selectedPatients.length} patients!`,
        )
        router.push("/dashboard")
      } else if (isMultipleAppointments && scheduledAppointments.length > 0) {
        appointmentData = {
          patientId: selectedPatient?._id,
          patientName: formData.patientName || selectedPatient?.firstName + " " + selectedPatient?.lastName,
          fatherName: formData.fatherName || formData.patientName,
          email: formData.email,
          phone: formData.phone,
          serviceId: persistentService?._id || formData.serviceId,
          therapistId: persistentDoctor?.id || scheduledAppointments[0]?.therapist?.id,
          scheduledAppointments: scheduledAppointments.map((apt) => ({
            date: apt.date,
            startTime: apt.time,
            endTime: calculateEndTime(apt.time),
          })),
          type: formData.type,
          consultationMode: formData.consultationMode,
          notes: formData.notes,
          address: formData.address,
          paymentAmount: formData.paymentAmount,
          paymentMethod: formData.paymentMethod,
          consent: formData.consent,
          totalSessions: scheduledAppointments.length,
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
          let errorMessage = "Failed to create appointments"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch (parseError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
        const result = await response.json()
        toast.success(`${scheduledAppointments.length} appointment(s) scheduled successfully!`)
        router.push("/dashboard")
      } else {
        appointmentData = {
          patientId: selectedPatient?._id,
          patientName: formData.patientName || selectedPatient?.firstName + " " + selectedPatient?.lastName,
          fatherName: formData.fatherName || formData.patientName,
          email: formData.email,
          phone: formData.phone,
          serviceId: formData.serviceId,
          therapistId: formData.doctor,
          dates: formData.appointmentDates,
          startTime: formData.timeSlot,
          endTime: calculateEndTime(formData.timeSlot),
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
          let errorMessage = "Failed to create appointments"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch (parseError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
        const result = await response.json()
        const appointmentCount = formData.appointmentDates.length
        toast.success(`${appointmentCount} appointment(s) scheduled successfully!`)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error creating appointments:", error)
      toast.error(error instanceof Error ? error.message : "Failed to schedule appointments")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-sans p-6 max-w-[84%] mt-15 ml-[150px] mx-auto overflow-y-auto hide-scrollbar">
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

      {isMultipleAppointments && scheduledAppointments.length > 0 && (
        <div className="mb-6 mt-10">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#1E437A] mb-4">
              Scheduled Appointments ({scheduledAppointments.length})
            </h3>
            {persistentDoctor && persistentService && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Locked Settings:</span>
                  <span>Doctor: {persistentDoctor.name}</span>
                  <span className="mx-2">•</span>
                  <span>
                    Service: {persistentService.name} (₹{persistentService.price})
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {scheduledAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-sm ${appointment.colorClass}`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">{appointment.dateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{appointment.therapist.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAppointmentFromSchedule(appointment.id)}
                    className="ml-2 hover:bg-black/10 rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Appointments:</span>
                  <div className="font-semibold text-lg text-gray-900">{scheduledAppointments.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Service:</span>
                  <div className="font-semibold text-gray-900">
                    {persistentService?.name || scheduledAppointments[0]?.service?.name || "Not selected"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Therapist:</span>
                  <div className="font-semibold text-gray-900">
                    {persistentDoctor?.name || scheduledAppointments[0]?.therapist?.name || "Not selected"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          className="flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Calendar className="w-5 h-5" />
          {loading
            ? "Scheduling..."
            : formData.isGroupSession
              ? `Schedule Group Session (${formData.selectedPatients.length} patients) & Send Notification`
              : isMultipleAppointments && scheduledAppointments.length > 0
                ? `Schedule ${scheduledAppointments.length} Appointments & Send Notification`
                : `Schedule ${formData.appointmentDates.length || 1} Appointment${formData.appointmentDates.length > 1 ? "s" : ""} & Send Notification`}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Appointment Information</h2>
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMultipleAppointments}
              onChange={(e) => {
                setIsMultipleAppointments(e.target.checked)
                if (!e.target.checked) {
                  setScheduledAppointments([])
                  setPersistentDoctor(null)
                  setPersistentService(null)
                  setFormData((prev) => ({
                    ...prev,
                    doctor: "",
                    timeSlot: "",
                    serviceId: "",
                    isGroupSession: false,
                    groupSessionName: "",
                    selectedPatients: [],
                  }))
                }
              }}
              className="w-4 h-4 text-[#C83C92] border-gray-300 rounded focus:ring-[#C83C92]"
            />
            <span className="text-[#1E437A] font-medium">Schedule Multiple Appointments</span>
          </label>
        </div>
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isGroupSession}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  isGroupSession: e.target.checked,
                  groupSessionName: "",
                  selectedPatients: [],
                }))
                if (e.target.checked) {
                  setSelectedPatient(null)
                }
              }}
              className="w-4 h-4 text-[#C83C92] border-gray-300 rounded focus:ring-[#C83C92]"
            />
            <span className="text-[#1E437A] font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group Session (Multiple Patients, Same Time Slot)
            </span>
          </label>
        </div>
        {/* FIXED: Add Group Session Name field for BOTH modes */}
        {formData.isGroupSession && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1E437A] mb-2 font-medium">Group Session Name *</label>
                <input
                  type="text"
                  value={formData.groupSessionName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, groupSessionName: e.target.value }))}
                  placeholder="e.g., Morning Speech Therapy Group"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[#1E437A] mb-2 font-medium">Max Capacity</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.maxCapacity || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === "" ? 6 : Number.parseInt(value) || 6
                    setFormData((prev) => ({ ...prev, maxCapacity: numValue }))
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-white text-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {isMultipleAppointments ? (
          <div className="space-y-6">
            <div className="flex justify-between gap-6">
              <div className="w-[48%]">
                <label className="block text-[#1E437A] mb-2 font-medium">
                  Select Date{formData.isGroupSession ? "" : "s"} *
                </label>
                <div className="mb-3">
                  <input
                    type="date"
                    value={currentDateInput}
                    onChange={(e) => {
                      setCurrentDateInput(e.target.value)
                      if (e.target.value) {
                        handleMultipleDateChange(e.target.value)
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                    placeholder="Select a date to add"
                  />
                </div>
                {formData.appointmentDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-[#1E437A] font-medium">
                      Selected Date{formData.appointmentDates.length > 1 ? "s" : ""} ({formData.appointmentDates.length}
                      ):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.appointmentDates.map((date, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-300"
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
              <div className="w-[48%]">
                <label className="block text-[#1E437A] mb-2 font-medium">
                  Select Doctor * {persistentDoctor && <span className="text-blue-600">(Locked)</span>}
                </label>
                <div className="relative">
                  <select
                    value={formData.doctor}
                    onChange={handleInputChange}
                    name="doctor"
                    disabled={formData.appointmentDates.length === 0 || !!persistentDoctor}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                      formData.appointmentDates.length === 0 || !!persistentDoctor
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${persistentDoctor ? "bg-blue-50 border-blue-300" : ""}`}
                    required
                  >
                    <option value="">
                      {formData.appointmentDates.length === 0
                        ? "Select dates first"
                        : persistentDoctor
                          ? persistentDoctor.name
                          : "Select doctor"}
                    </option>
                    {!persistentDoctor &&
                      availableDoctors.map((doctor) => (
                        <option key={doctor?.id} value={doctor?.id}>
                          {doctor?.name}
                        </option>
                      ))}
                  </select>
                  {persistentDoctor && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
                      <Lock className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
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
            <div className="flex justify-between gap-6">
              <div className="w-[48%]">
                <label className="block text-[#1E437A] mb-2 font-medium">Available Time Slots *</label>
                <div className="relative">
                  <select
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    name="timeSlot"
                    disabled={!formData.doctor}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                      !formData.doctor ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
                {formData.doctor && availableTimeSlots.length === 0 && !selectedPatient && !formData.isGroupSession && (
                  <p className="text-sm text-red-500 mt-1">No available slots for selected doctor</p>
                )}
                {formData.doctor &&
                  availableTimeSlots.length === 0 &&
                  formData.isGroupSession &&
                  formData.selectedPatients.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">No available slots for selected doctor</p>
                  )}
                {/* NEW: Group session conflict display */}
                {formData.isGroupSession &&
                  formData.selectedPatients.length > 0 &&
                  groupConflictingSlots.length > 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="text-yellow-800 font-medium mb-1">
                            Some patients have conflicting appointments:
                          </p>
                          <div className="text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                            {groupConflictingSlots.map((slot) => (
                              <div key={slot} className="text-xs">
                                <strong>{slot}:</strong>
                                <ul className="ml-2 mt-1">
                                  {groupPatientConflicts[slot]?.map((conflict, index) => (
                                    <li key={index} className="text-xs">
                                      • {conflict}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {!formData.isGroupSession && selectedPatient && conflictingSlots.length > 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-yellow-800 font-medium mb-1">Patient has conflicting appointments:</p>
                        <ul className="text-yellow-700 space-y-1">
                          {conflictingSlots.map((slot) => (
                            <li key={slot} className="text-xs">
                              • {slot} - {patientConflicts[slot]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-[48%]">
                <label className="block text-[#1E437A] mb-2 font-medium">
                  Select Service * {persistentService && <span className="text-blue-600">(Locked)</span>}
                </label>
                <div className="relative">
                  <select
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    name="serviceId"
                    disabled={!formData.timeSlot || !!persistentService}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                      !formData.timeSlot || !!persistentService ? "opacity-50 cursor-not-allowed" : ""
                    } ${persistentService ? "bg-blue-50 border-blue-300" : ""}`}
                    required
                  >
                    <option value="">
                      {!formData.timeSlot
                        ? "Select time slot first"
                        : persistentService
                          ? `${persistentService.name} - ₹${persistentService.price}`
                          : "Select a service"}
                    </option>
                    {!persistentService &&
                      services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.name} - ₹{service.price}
                        </option>
                      ))}
                  </select>
                  {persistentService && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
                      <Lock className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
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
            {(persistentDoctor || formData.doctor) &&
              (persistentService || formData.serviceId) &&
              formData.appointmentDates.length > 0 &&
              formData.timeSlot && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={addAppointmentToSchedule}
                    className="flex items-center gap-2 px-6 py-3 bg-[#C83C92] text-white rounded-lg hover:bg-[#B8358A] font-medium shadow-sm transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    {formData.isGroupSession ? "Add Group Session" : "Add Appointment"}
                  </button>
                </div>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="md:col-span-2">
              <label className="block text-[#1E437A] mb-2">Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.appointmentDates[0] || ""}
                  onChange={(e) => {
                    const newDate = e.target.value
                    setFormData({
                      ...formData,
                      appointmentDates: newDate ? [newDate] : [],
                    })
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] ${
                    showValidation && fieldErrors.appointmentDates
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
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
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                    showValidation && fieldErrors.doctor
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
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
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                    showValidation && fieldErrors.timeSlot
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
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
              {formData.doctor && availableTimeSlots.length === 0 && !selectedPatient && !formData.isGroupSession && (
                <p className="text-sm text-red-500 mt-1">No available slots for selected doctor</p>
              )}
              {formData.doctor &&
                availableTimeSlots.length === 0 &&
                formData.isGroupSession &&
                formData.selectedPatients.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No available slots for selected doctor</p>
                )}
              {/* NEW: Group session conflict display */}
              {formData.isGroupSession && formData.selectedPatients.length > 0 && groupConflictingSlots.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium mb-1">Some patients have conflicting appointments:</p>
                      <div className="text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                        {groupConflictingSlots.map((slot) => (
                          <div key={slot} className="text-xs">
                            <strong>{slot}:</strong>
                            <ul className="ml-2 mt-1">
                              {groupPatientConflicts[slot]?.map((conflict, index) => (
                                <li key={index} className="text-xs">
                                  • {conflict}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!formData.isGroupSession && selectedPatient && conflictingSlots.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium mb-1">Patient has conflicting appointments:</p>
                      <ul className="text-yellow-700 space-y-1">
                        {conflictingSlots.map((slot) => (
                          <li key={slot} className="text-xs">
                            • {slot} - {patientConflicts[slot]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
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
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                    showValidation && fieldErrors.serviceId
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} - ₹{service.price}
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
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="font-sans bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">
            {formData.isGroupSession ? "Select Patients for Group Session" : "Select Patient"}
          </h2>
          {formData.isGroupSession ? (
            <div className="space-y-4">
              {formData.selectedPatients.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">
                      Selected Patients ({formData.selectedPatients.length}/{formData.maxCapacity}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border border-green-300"
                      >
                        <span>
                          {patient.firstName} {patient.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePatientFromGroup(patient._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  filteredPatients.map((patient) => {
                    const isSelected = formData.selectedPatients.some((p) => p._id === patient._id)
                    const isDisabled = !isSelected && formData.selectedPatients.length >= formData.maxCapacity
                    
                    // NEW: Check if patient has conflict at selected time slot
                    const hasConflict = formData.timeSlot && formData.appointmentDates.length > 0 
                      ? checkPatientConflictAtTimeSlot(patient, formData.timeSlot, formData.appointmentDates)
                      : false
                    
                    const finalDisabled = isDisabled || hasConflict
                    
                    return (
                      <div
                        key={patient._id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isSelected 
                            ? "bg-green-50 border-green-200" 
                            : hasConflict 
                              ? "bg-red-50 border-red-200" // NEW: Pale red background for conflicts
                              : "hover:bg-gray-50"
                        } ${finalDisabled ? "opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={finalDisabled} // NEW: Disable if has conflict
                          onChange={(e) => handlePatientToggle(patient, e.target.checked)}
                          className="w-4 h-4 text-[#C83C92] border-gray-300 rounded focus:ring-[#C83C92]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {patient?.childName || patient?.fullName || patient?.firstName + " " + patient?.lastName}
                            {/* NEW: Show conflict indicator */}
                            {hasConflict && (
                              <span className="ml-2 text-xs text-red-600 font-normal">
                                (Has appointment at this time)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Parent: {patient?.parentName || patient?.parentInfo?.name} | Phone:{" "}
                            {patient?.contactNumber || patient?.parentInfo?.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {patient?._id} | Gender: {patient?.gender || "Not specified"}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {patientSearchTerm ? "No patients found matching your search" : "No patients available"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
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
                                ID: {patient?._id} | Gender: {patient?.gender || "Not specified"}
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
          )}
        </div>

        <div className="font-sans bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                    showValidation && fieldErrors.consultationMode
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
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
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none ${
                    showValidation && fieldErrors.type
                      ? "border-[#C83C92] ring-2 ring-[#C83C92] ring-opacity-50 animate-pulse"
                      : "border-gray-300"
                  }`}
                  required
                >
                  <option value="initial assessment">Initial Assessment</option>
                  <option value="follow-up">Follow-up</option>
                  {formData.isGroupSession && <option value="group therapy session">Group Therapy Session</option>}
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
                Payment Amount (₹)
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
                onWheel={(e) => e.target.blur()}
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
                : formData.isGroupSession
                  ? `Schedule Group Session (${formData.selectedPatients.length} patients) & Send Notification`
                  : isMultipleAppointments && scheduledAppointments.length > 0
                    ? `Schedule ${scheduledAppointments.length} Appointments & Send Notification`
                    : `Schedule ${formData.appointmentDates.length || 1} Appointment${formData.appointmentDates.length > 1 ? "s" : ""} & Send Notification`}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

const AppointmentSchedulingPage = () => {
  return (
    <Suspense fallback={<AppointmentSchedulingLoading />}>
      <AppointmentSchedulingContent />
    </Suspense>
  )
}

export default AppointmentSchedulingPage
