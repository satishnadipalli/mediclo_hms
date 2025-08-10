"use client"

import type React from "react"
import { useState, useRef, createContext, useCallback } from "react"
import { ChevronLeft, Upload, Calendar, X, CheckCircle, Loader2, Search, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

// Toast functionality
interface Toast {
  id: string
  title?: string
  description?: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
}

const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Child Symptoms Data
const CHILD_SYMPTOMS = [
  "Autism spectrum disorder",
  "Attention deficit hyperactivity disorder",
  "Down's syndrome",
  "Developmental delayed disorder",
  "Cerebral palsy",
  "Seizure disorders",
  "Hypoxic-Ischemic Encephalopathy",
  "Hemiparalysis",
  "Learning difficulties",
  "Slow learner",
  "Fine motor skills difficulties",
  "Attention deficit disorder",
  "Sensory processing disorders",
  "Swallowing and feeding issues",
  "Speech language delays",
  "Stammering",
  "Articulations issues",
  "Slurred speech",
  "Visual processing difficulties",
  "Behavioural issues",
  "Handwriting difficulties",
  "Brachial plexus injury",
  "Hand functions dysfunction",
  "Spina bifida",
  "Developmental disorders",
  "Genetic disorders",
  "Others",
]

// Multi-Select Symptoms Component
const SymptomsMultiSelect: React.FC<{
  selectedSymptoms: string[]
  onSymptomsChange: (symptoms: string[]) => void
}> = ({ selectedSymptoms, onSymptomsChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredSymptoms = CHILD_SYMPTOMS.filter(
    (symptom) => symptom.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedSymptoms.includes(symptom),
  )

  const handleSymptomSelect = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      onSymptomsChange([...selectedSymptoms, symptom])
    }
    setSearchTerm("")
  }

  const handleSymptomRemove = (symptomToRemove: string) => {
    onSymptomsChange(selectedSymptoms.filter((symptom) => symptom !== symptomToRemove))
  }

  const handleClickOutside = (e: React.MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Symptoms as Chips */}
      {selectedSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedSymptoms.map((symptom, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 text-black bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
            >
              <span className="">{symptom}</span>
              <button
                type="button"
                onClick={() => handleSymptomRemove(symptom)}
                className="hover:bg-pink-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div
        className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedSymptoms.length > 0 ? "text-gray-900" : "text-gray-500"}>
            {selectedSymptoms.length > 0
              ? `${selectedSymptoms.length} symptom${selectedSymptoms.length > 1 ? "s" : ""} selected`
              : "Select child symptoms"}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Symptoms List */}
          <div className="max-h-40 overflow-y-auto">
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-50 text-black cursor-pointer text-sm"
                  onClick={() => handleSymptomSelect(symptom)}
                >
                  {symptom}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? "No symptoms found" : "All symptoms selected"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  patientName: string
  isRegisterLater: boolean
}> = ({ isOpen, onClose, patientName, isRegisterLater }) => {
  if (!isOpen) return null

  return (
    <div className="fixed font-sans inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Body */}
        <div className="p-6 text-center font-sans">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {patientName} has been successfully registered!
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isRegisterLater
                ? "The patient information has been saved. You can schedule an appointment later from the dashboard."
                : "The patient has been registered successfully. You will now be redirected to schedule an appointment."}
            </p>
          </div>
          {/* Registration Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Patient Name:</span>
              <span className="font-medium text-gray-900">{patientName}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Registration Date:</span>
              <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </span>
            </div>
          </div>
        </div>
        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-center">
          <button
            onClick={onClose}
            className="px-14 py-3 bg-gradient-to-r bg-pink-500 text-white rounded-lg hover:from-green-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex rounded-4xl items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isRegisterLater && "Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main component
const PatientRegistrationForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Upload loading states
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingBirthCert, setUploadingBirthCert] = useState(false)

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isRegisterLater, setIsRegisterLater] = useState(false)
  const [registeredPatientName, setRegisteredPatientName] = useState("")

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Refs for form fields to focus on validation errors
  const fieldRefs = {
    childName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    dateOfBirth: useRef<HTMLInputElement>(null),
    gender: useRef<HTMLSelectElement>(null),
    parentName: useRef<HTMLInputElement>(null),
    parentPhone: useRef<HTMLInputElement>(null),
    motherName: useRef<HTMLInputElement>(null),
    motherPhone: useRef<HTMLInputElement>(null),
    address: useRef<HTMLTextAreaElement>(null),
  }

  // File previews and URLs
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(null)
  const [childPhotoUrl, setChildPhotoUrl] = useState<string>("")
  const [childPhotoPublicId, setChildPhotoPublicId] = useState<string>("")
  const [birthCertificatePreview, setBirthCertificatePreview] = useState<string | null>(null)
  const [birthCertificateUrl, setBirthCertificateUrl] = useState<string>("")
  const [birthCertificatePublicId, setBirthCertificatePublicId] = useState<string>("")

  const [formData, setFormData] = useState({
    // Child's Information
    childName: "",
    lastName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    parentId: "",
    // Child Symptoms and Notes - NEW FIELDS
    childSymptoms: [] as string[],
    notes: "",
    // Parent's Information
    parentInfo: {
      name: "",
      phone: "",
      email: "",
      photo: "",
      aadharCard: "",
      address: "",
      relationship: "Guardian",
      motherName: "",
      motherPhone: "",
    },
    // Emergency Contact Information
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
  })

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File, folder = "patients") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "my_unsigned_preset") // Replace with your unsigned preset name

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dxbdamfae/image/upload`, // Replace YOUR_CLOUD_NAME
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      return {
        url: data.secure_url,
        public_id: data.public_id,
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      throw error
    }
  }

  // Calculate age when date of birth changes
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return ""
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.startsWith("parentInfo.")) {
      const field = name.split(".")[1]
      setFormData({
        ...formData,
        parentInfo: {
          ...formData.parentInfo,
          [field]: value,
        },
      })
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1]
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact,
          [field]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })

      // Auto-calculate age when date of birth changes
      if (name === "dateOfBirth") {
        const calculatedAge = calculateAge(value)
        setFormData((prev) => ({
          ...prev,
          dateOfBirth: value,
          age: calculatedAge,
        }))
      }
    }
  }

  // Handle symptoms change
  const handleSymptomsChange = (symptoms: string[]) => {
    setFormData({
      ...formData,
      childSymptoms: symptoms,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "File Too Large",
        description: "Please select a file smaller than 5MB.",
        duration: 4000,
      })
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: "error",
        title: "Invalid File Type",
        description: `Please select a valid ${fileType === "birthCertificate" ? "image or PDF" : "image"} file.`,
        duration: 4000,
      })
      return
    }

    try {
      // Set loading state
      if (fileType === "childPhoto") {
        setUploadingPhoto(true)
      } else if (fileType === "birthCertificate") {
        setUploadingBirthCert(true)
      }

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          if (fileType === "childPhoto") {
            setChildPhotoPreview(result)
          } else if (fileType === "birthCertificate") {
            setBirthCertificatePreview(result)
          }
        }
        reader.readAsDataURL(file)
      }

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file,
        fileType === "childPhoto" ? "patients/photos" : "patients/certificates",
      )

      // Store the URLs and public IDs
      if (fileType === "childPhoto") {
        setChildPhotoUrl(uploadResult.url)
        setChildPhotoPublicId(uploadResult.public_id)
        addToast({
          type: "success",
          title: "Photo Uploaded",
          description: "Child photo uploaded successfully!",
          duration: 3000,
        })
      } else if (fileType === "birthCertificate") {
        setBirthCertificateUrl(uploadResult.url)
        setBirthCertificatePublicId(uploadResult.public_id)
        addToast({
          type: "success",
          title: "Certificate Uploaded",
          description: "Birth certificate uploaded successfully!",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      addToast({
        type: "error",
        title: "Upload Failed",
        description: `Failed to upload ${fileType === "childPhoto" ? "photo" : "birth certificate"}. Please try again.`,
        duration: 5000,
      })
    } finally {
      // Reset loading state
      if (fileType === "childPhoto") {
        setUploadingPhoto(false)
      } else if (fileType === "birthCertificate") {
        setUploadingBirthCert(false)
      }
    }
  }

  // Validation function
  const validateForm = () => {
    const requiredFields = [
      { value: formData.childName, ref: fieldRefs.childName, name: "Child's First Name" },
      { value: formData.lastName, ref: fieldRefs.lastName, name: "Child's Last Name" },
      { value: formData.dateOfBirth, ref: fieldRefs.dateOfBirth, name: "Date of Birth" },
      { value: formData.gender, ref: fieldRefs.gender, name: "Gender" },
      { value: formData.parentInfo.name, ref: fieldRefs.parentName, name: "Father's Name" },
      { value: formData.parentInfo.phone, ref: fieldRefs.parentPhone, name: "Father's Contact Number" },
      { value: formData.parentInfo.motherName, ref: fieldRefs.motherName, name: "Mother's Name" },
      { value: formData.parentInfo.motherPhone, ref: fieldRefs.motherPhone, name: "Mother's Contact Number" },
      { value: formData.parentInfo.address, ref: fieldRefs.address, name: "Address" },
    ]

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        addToast({
          type: "error",
          title: "Required Field Missing",
          description: `Please fill in the ${field.name} field.`,
          duration: 4000,
        })
        // Focus on the first invalid field
        if (field.ref.current) {
          field.ref.current.focus()
          field.ref.current.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        return false
      }
    }

    return true
  }

  const submitRegistration = async (isLater: boolean) => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setIsRegisterLater(isLater)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({
          firstName: formData.childName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          // NEW FIELDS - Child Symptoms and Notes
          childSymptoms: formData.childSymptoms,
          notes: formData.notes,
          // Send photo data with URL and public_id
          photo: childPhotoUrl
            ? {
                url: childPhotoUrl,
                public_id: childPhotoPublicId,
              }
            : undefined,
          // Send birth certificate data with URL and public_id
          birthCertificate: birthCertificateUrl
            ? {
                url: birthCertificateUrl,
                public_id: birthCertificatePublicId,
              }
            : undefined,
          parentInfo: {
            name: formData.parentInfo.name,
            phone: formData.parentInfo.phone,
            email: formData.parentInfo.email,
            relationship: formData.parentInfo.relationship,
            address: formData.parentInfo.address,
            motherName: formData.parentInfo.motherName,
            motherphone: formData.parentInfo.motherPhone,
          },
          emergencyContact: {
            name: formData.emergencyContact.name,
            relation: formData.emergencyContact.relation,
            phone: formData.emergencyContact.phone,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to register patient")
      }

      const result = await response.json()
      console.log("Registered successfully", result)

      // Set patient name and show success modal
      setRegisteredPatientName(`${formData.childName} ${formData.lastName}`)
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Registration error:", error)
      addToast({
        type: "error",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register patient. Please try again.",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    if (isRegisterLater) {
      // Stay on the same page and reset form
      setFormData({
        childName: "",
        lastName: "",
        dateOfBirth: "",
        age: "",
        gender: "",
        parentId: "",
        childSymptoms: [],
        notes: "",
        parentInfo: {
          name: "",
          phone: "",
          email: "",
          photo: "",
          aadharCard: "",
          address: "",
          relationship: "Guardian",
          motherName: "",
          motherPhone: "",
        },
        emergencyContact: {
          name: "",
          relation: "",
          phone: "",
        },
      })
      // Reset file previews and URLs
      setChildPhotoPreview(null)
      setChildPhotoUrl("")
      setChildPhotoPublicId("")
      setBirthCertificatePreview(null)
      setBirthCertificateUrl("")
      setBirthCertificatePublicId("")
    } else {
      // Redirect to schedule appointment
      router.push("/dashboard/scheduleAppointment")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitRegistration(false)
  }

  const handleRegisterLater = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    await submitRegistration(true)
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <div className="p-6 mw-[85%] font-sans ml-[150px] mx-auto bg-gray-50 min-h-screen">
        {/* Toast container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 transform translate-x-0",
                {
                  "bg-green-50 border-green-200 text-green-800": toast.type === "success",
                  "bg-red-50 border-red-200 text-red-800": toast.type === "error",
                  "bg-yellow-50 border-yellow-200 text-yellow-800": toast.type === "warning",
                  "bg-blue-50 border-blue-200 text-blue-800": toast.type === "info",
                }[toast.type] || "bg-gray-50 border-gray-200 text-gray-800",
              )}
            >
              <div className="flex-1">
                {toast.title && <div className="font-medium text-sm">{toast.title}</div>}
                {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-current opacity-50 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
          patientName={registeredPatientName}
          isRegisterLater={isRegisterLater}
        />

        {/* Header */}
        <div className="mb-6 pt-24 w-[95%]">
          <div className="flex items-center text-blue-600 mb-3 cursor-pointer" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Back</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
            <div className="flex gap-3">
              <button
                onClick={handleRegisterLater}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 disabled:opacity-50 font-medium"
              >
                <span className="text-lg">+</span>
                Register for Later
              </button>
              <button
                type="submit"
                form="patient-form"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 font-medium"
              >
                <Calendar className="w-4 h-4" />
                {loading ? "Registering..." : "Register & Schedule an Appointment"}
              </button>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-blue-600">Dashboard</span>
            <span className="mx-2">›</span>
            <span>Register New Patient</span>
          </div>
        </div>

        {/* Form */}
        <form id="patient-form" onSubmit={handleSubmit} className="space-y-6 w-[95%]">
          {/* Child's Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Child's Information</h2>
            <div className="space-y-6">
              {/* Child's Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's First Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fieldRefs.childName}
                  type="text"
                  name="childName"
                  value={formData.childName}
                  onChange={handleInputChange}
                  placeholder="Enter child's first name here"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Child's Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fieldRefs.lastName}
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter child's last name here"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Date of Birth and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={fieldRefs.dateOfBirth}
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    placeholder="Auto-calculated"
                    readOnly
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Gender and Upload Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    ref={fieldRefs.gender}
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Select child's gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Child Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Child Photo {"(Image -jpg/jpeg, png)"}
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer font-medium transition-colors ${
                      uploadingPhoto ? "bg-gray-400 cursor-not-allowed" : "bg-pink-500 hover:bg-pink-600"
                    } text-white`}
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Photo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "childPhoto")}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  {childPhotoPreview && (
                    <div className="mt-2">
                      <img
                        src={childPhotoPreview || "/placeholder.svg"}
                        alt="Child"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                      />
                      <div className="text-xs text-green-600 mt-1">✓ Photo uploaded</div>
                    </div>
                  )}
                </div>

                {/* Birth Certificate Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document {"(Image -jpg/jpeg, png)"}
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer font-medium transition-colors ${
                      uploadingBirthCert ? "bg-gray-400 cursor-not-allowed" : "bg-pink-500 hover:bg-pink-600"
                    } text-white`}
                  >
                    {uploadingBirthCert ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Document
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "birthCertificate")}
                      disabled={uploadingBirthCert}
                      className="hidden"
                    />
                  </label>
                  {birthCertificatePreview && (
                    <div className="mt-2">
                      <img
                        src={birthCertificatePreview || "/placeholder.svg"}
                        alt="Birth Certificate"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                      />
                      <div className="text-xs text-green-600 mt-1">✓ Certificate uploaded</div>
                    </div>
                  )}
                  {birthCertificateUrl && !birthCertificatePreview && (
                    <div className="mt-2 text-xs text-green-600">✓ PDF uploaded successfully</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parent's Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Parent's Information</h2>
            <div className="space-y-6">
              {/* Father's Information */}
              <div className="border-b border-gray-200 pb-6">
                {/* Father's Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fieldRefs.parentName}
                    type="text"
                    name="parentInfo.name"
                    value={formData.parentInfo.name}
                    onChange={handleInputChange}
                    placeholder="Enter father's full name here"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                {/* Father's Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fieldRefs.parentPhone}
                    type="tel"
                    name="parentInfo.phone"
                    value={formData.parentInfo.phone}
                    onChange={handleInputChange}
                    placeholder="Enter father's contact number here"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Mother's Information */}
              <div className="border-b border-gray-200 pb-6">
                {/* Mother's Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fieldRefs.motherName}
                    type="text"
                    name="parentInfo.motherName"
                    value={formData.parentInfo.motherName}
                    onChange={handleInputChange}
                    placeholder="Enter mother's full name here"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                {/* Mother's Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fieldRefs.motherPhone}
                    type="tel"
                    name="parentInfo.motherPhone"
                    value={formData.parentInfo.motherPhone}
                    onChange={handleInputChange}
                    placeholder="Enter mother's contact number here"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Email Address <span className="text-gray-500">{"(Optional)"}</span>
                </label>
                <input
                  type="email"
                  name="parentInfo.email"
                  value={formData.parentInfo.email}
                  onChange={handleInputChange}
                  placeholder="Enter parent's email address here"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* NEW FIELDS - Child Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child Symptoms <span className="text-gray-500">{"(Optional)"}</span>
                </label>
                <SymptomsMultiSelect
                  selectedSymptoms={formData.childSymptoms}
                  onSymptomsChange={handleSymptomsChange}
                />
              </div>

              {/* NEW FIELDS - Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span className="text-gray-500">{"(Optional)"}</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes here..."
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={fieldRefs.address}
                  name="parentInfo.address"
                  value={formData.parentInfo.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address here..."
                  rows={4}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center mt-10 justify-between mb-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegisterLater}
                  disabled={loading || uploadingPhoto || uploadingBirthCert}
                  className="flex items-center gap-2 px-4 py-2 border border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 disabled:opacity-50 font-medium"
                >
                  <span className="text-lg">+</span>
                  Register for Later
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPhoto || uploadingBirthCert}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  {loading ? "Registering..." : "Register & Schedule an Appointment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ToastContext.Provider>
  )
}

export default PatientRegistrationForm
