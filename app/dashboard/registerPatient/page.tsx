"use client"

import type React from "react"
import { useState, useRef, createContext, useCallback } from "react"
import { ChevronLeft, Upload, Calendar, X } from "lucide-react"
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

// Main component
const PatientRegistrationForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  // File previews
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(null)
  const [parentPhotoPreview, setParentPhotoPreview] = useState<string | null>(null)
  const [birthCertificatePreview, setBirthCertificatePreview] = useState<string | null>(null)
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Child's Information
    childName: "",
    lastName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    childPhoto: "",
    birthCertificate: "",
    parentId: "",
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        switch (fileType) {
          case "childPhoto":
            setChildPhotoPreview(result)
            setFormData((prev) => ({ ...prev, childPhoto: result }))
            break
          case "birthCertificate":
            setBirthCertificatePreview(result)
            setFormData((prev) => ({ ...prev, birthCertificate: result }))
            break
          case "parentPhoto":
            setParentPhotoPreview(result)
            setFormData((prev) => ({
              ...prev,
              parentInfo: { ...prev.parentInfo, photo: result },
            }))
            break
          case "aadharCard":
            setAadharCardPreview(result)
            setFormData((prev) => ({
              ...prev,
              parentInfo: { ...prev.parentInfo, aadharCard: result },
            }))
            break
        }
      }
      reader.readAsDataURL(file)
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

  const submitRegistration = async (redirectPath: string) => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
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
          fullName: `${formData.childName} ${formData.lastName}`,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          childPhoto: formData.childPhoto,
          birthCertificate: formData.birthCertificate,
          parentInfo: {
            name: formData.parentInfo.name,
            phone: formData.parentInfo.phone,
            email: formData.parentInfo.email,
            relationship: formData.parentInfo.relationship,
            address: formData.parentInfo.address,
            photo: formData.parentInfo.photo,
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
      console.log("Registered successfully", response)

      addToast({
        type: "success",
        title: "Registration Successful!",
        description: "Patient has been registered successfully.",
        duration: 3000,
      })

      router.push(redirectPath)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitRegistration("/dashboard/scheduleAppointment")
  }

  const handleRegisterLater = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    await submitRegistration("/dashboard")
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <div className="p-6 mw-[85%] ml-[300px] mx-auto bg-gray-50 min-h-screen">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Child Photo</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 cursor-pointer font-medium">
                    <Upload className="w-4 h-4" />
                    Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "childPhoto")}
                      className="hidden"
                    />
                  </label>
                  {childPhotoPreview && (
                    <div className="mt-2">
                      <img
                        src={childPhotoPreview || "/placeholder.svg"}
                        alt="Child"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Birth Certificate</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 cursor-pointer font-medium">
                    <Upload className="w-4 h-4" />
                    Birth certificate
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "birthCertificate")}
                      className="hidden"
                    />
                  </label>
                  {birthCertificatePreview && <div className="mt-2 text-xs text-green-600">✓ File uploaded</div>}
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
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 disabled:opacity-50 font-medium"
                >
                  <span className="text-lg">+</span>
                  Register for Later
                </button>
                <button
                  type="submit"
                  disabled={loading}
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
