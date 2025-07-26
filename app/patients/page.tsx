"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  X,
  CreditCard,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  User,
  FileText,
  Edit,
  Save,
  ChevronDown,
  Upload,
  Trash2,
} from "lucide-react"

// Enhanced interfaces for comprehensive appointment and payment management
interface AppointmentDetails {
  _id: string
  date: string
  startTime: string
  endTime: string
  type: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  payment: {
    amount: number
    status: "pending" | "paid" | "partial" | "refunded"
    method: "cash" | "card" | "insurance" | "not_specified"
    paidAmount?: number
  }
  service: {
    name: string
    price: number
  }
  therapist: {
    name: string
    _id: string
  }
  totalSessions: number
  sessionsCompleted: number
  sessionsPaid: number
}

interface PatientWithAppointments {
  _id: string
  firstName?: string
  lastName?: string
  fullName?: string
  childName?: string
  dateOfBirth?: string
  childDOB?: string
  gender?: string
  childGender?: string
  // Added photo and birth certificate fields
  photo?: {
    url: string
    public_id: string
  } | null
  birthCertificate?: {
    url: string
    public_id: string
  } | null
  // NEW FIELDS - Child Symptoms and Notes
  childSymptoms?: string[]
  notes?: string
  parentInfo?: {
    name: string
    phone: string
    email: string
    relationship?: string
    address?: string
    motherName?: string
    motherphone?: string
  }
  parentName?: string
  contactNumber?: string
  email?: string
  appointments: AppointmentDetails[]
  totalAppointments: number
  completedAppointments: number
  pendingPayments: number
  totalOwed: number
  totalPaid: number
  status?: string
  createdAt: string
  updatedAt: string
}

interface PaymentSummary {
  totalPatients: number
  totalRevenue: number
  pendingPayments: number
  completedPayments: number
  partialPayments: number
}

// Payment modal types
interface PaymentModalData {
  patient: PatientWithAppointments
  selectedAppointments: string[]
  paymentType: "single" | "partial" | "full"
  customAmount?: number
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

// NEW COMPONENT - Delete Confirmation Modal
const DeleteConfirmationModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}> = ({ patient, isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null

  const getPatientName = (patient: PatientWithAppointments): string => {
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    return patient.fullName || patient.childName || "Unknown"
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Delete Patient</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">Are you sure you want to delete the patient record for:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-800">{getPatientName(patient)}</p>
              <p className="text-sm text-red-600">Parent: {patient.parentInfo?.name || patient.parentName || "N/A"}</p>
              <p className="text-sm text-red-600">Total Appointments: {patient.totalAppointments}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. All patient data, appointments, and payment history will be permanently
                  deleted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Patient
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Multi-Select Symptoms Component for Edit Modal
const SymptomsMultiSelect: React.FC<{
  selectedSymptoms: string[]
  onSymptomsChange: (symptoms: string[]) => void
}> = ({ selectedSymptoms, onSymptomsChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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

  return (
    <div className="relative">
      {/* Selected Symptoms as Chips */}
      {selectedSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedSymptoms.map((symptom, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
            >
              <span>{symptom}</span>
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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500"
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
                style={{ color: "black" }}
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
              <div className="px-3 py-2 text-sm text-black">
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

// Edit Patient Modal Component
const EditPatientModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPatient: Partial<PatientWithAppointments>) => void
}> = ({ patient, isOpen, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: patient.firstName || "",
    lastName: patient.lastName || "",
    dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
    gender: patient.gender || patient.childGender || "",
    childSymptoms: patient.childSymptoms || [],
    notes: patient.notes || "",
    parentInfo: {
      name: patient.parentInfo?.name || patient.parentName || "",
      phone: patient.parentInfo?.phone || patient.contactNumber || "",
      email: patient.parentInfo?.email || patient.email || "",
      motherName: patient.parentInfo?.motherName || "",
      motherphone: patient.parentInfo?.motherphone || "",
      relationship: patient.parentInfo?.relationship || "Guardian",
      address: patient.parentInfo?.address || "",
    },
  })

  // Add these new state variables after the existing formData state:
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingBirthCert, setUploadingBirthCert] = useState(false)
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(patient.photo?.url || null)
  const [childPhotoUrl, setChildPhotoUrl] = useState<string>(patient.photo?.url || "")
  const [childPhotoPublicId, setChildPhotoPublicId] = useState<string>(patient.photo?.public_id || "")
  const [birthCertificatePreview, setBirthCertificatePreview] = useState<string | null>(
    patient.birthCertificate?.url || null,
  )
  const [birthCertificateUrl, setBirthCertificateUrl] = useState<string>(patient.birthCertificate?.url || "")
  const [birthCertificatePublicId, setBirthCertificatePublicId] = useState<string>(
    patient.birthCertificate?.public_id || "",
  )

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("parentInfo.")) {
      const parentField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        parentInfo: {
          ...prev.parentInfo,
          [parentField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  // Add the Cloudinary upload function after the handleInputChange function:
  const uploadToCloudinary = async (file: File, folder = "patients") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "my_unsigned_preset") // Replace with your unsigned preset name

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dlehbizfp/image/upload`, // Replace YOUR_CLOUD_NAME
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

  // Add the file upload handler after the uploadToCloudinary function:
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select a file smaller than 5MB.")
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert(`Please select a valid ${fileType === "birthCertificate" ? "image or PDF" : "image"} file.`)
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
        alert("Child photo uploaded successfully!")
      } else if (fileType === "birthCertificate") {
        setBirthCertificateUrl(uploadResult.url)
        setBirthCertificatePublicId(uploadResult.public_id)
        alert("Birth certificate uploaded successfully!")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert(`Failed to upload ${fileType === "childPhoto" ? "photo" : "birth certificate"}. Please try again.`)
    } finally {
      // Reset loading state
      if (fileType === "childPhoto") {
        setUploadingPhoto(false)
      } else if (fileType === "birthCertificate") {
        setUploadingBirthCert(false)
      }
    }
  }

  // Update the handleSave function to include the uploaded files:
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        ...formData,
        // Include photo data if uploaded
        photo: childPhotoUrl
          ? {
              url: childPhotoUrl,
              public_id: childPhotoPublicId,
            }
          : patient.photo, // Keep existing photo if no new upload
        // Include birth certificate data if uploaded
        birthCertificate: birthCertificateUrl
          ? {
              url: birthCertificateUrl,
              public_id: birthCertificatePublicId,
            }
          : patient.birthCertificate, // Keep existing certificate if no new upload
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${patient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update patient")
      }

      const result = await response.json()
      onSave(result.data)
      onClose()
    } catch (error) {
      console.error("Error updating patient:", error)
      alert("Failed to update patient. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Edit className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Edit Patient Details</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Child Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Child Information</h4>
            {/* Replace the existing gender field div with this expanded version: */}
            <div className="grid grid-cols-1  md:grid-cols-3 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  style={{ color: "black" }}
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Child Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Photo {"(Image -jpg/jpeg, png)"}
                </label>
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors ${
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
                    style={{ color: "black" }}
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
                    <div className="text-xs text-green-600 mt-1">✓ Photo ready</div>
                  </div>
                )}
              </div>

              {/* Birth Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Document {"(Image -jpg/jpeg, png)"}
                </label>
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors ${
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
                    style={{ color: "black" }}
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
                    <div className="text-xs text-green-600 mt-1">✓ Certificate ready</div>
                  </div>
                )}
                {birthCertificateUrl && !birthCertificatePreview && (
                  <div className="mt-2 text-xs text-green-600">✓ PDF ready for upload</div>
                )}
              </div>
            </div>
          </div>

          {/* Current Documents Section */}
          {(patient.photo?.url || patient.birthCertificate?.url) && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Current Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Patient Photo */}
                {patient.photo?.url && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Current Patient Photo
                    </h5>
                    <div className="relative group">
                      <img
                        src={patient.photo.url || "/placeholder.svg"}
                        alt="Current Patient Photo"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                        <Eye className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Upload a new photo above to replace this one</p>
                  </div>
                )}

                {/* Current Birth Certificate */}
                {patient.birthCertificate?.url && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Current Birth Certificate
                    </h5>
                    <div className="relative group">
                      <img
                        src={patient.birthCertificate.url || "/placeholder.svg"}
                        alt="Current Birth Certificate"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                        <Eye className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Upload a new document above to replace this one</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parent Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Parent Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name *</label>
                <input
                  style={{ color: "black" }}
                  type="text"
                  value={formData.parentInfo.name}
                  onChange={(e) => handleInputChange("parentInfo.name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father's Phone *</label>
                <input
                  style={{ color: "black" }}
                  type="tel"
                  value={formData.parentInfo.phone}
                  onChange={(e) => handleInputChange("parentInfo.phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name *</label>
                <input
                  style={{ color: "black" }}
                  type="text"
                  value={formData.parentInfo.motherName}
                  onChange={(e) => handleInputChange("parentInfo.motherName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Phone *</label>
                <input
                  style={{ color: "black" }}
                  type="tel"
                  value={formData.parentInfo.motherphone}
                  onChange={(e) => handleInputChange("parentInfo.motherphone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                <input
                  style={{ color: "black" }}
                  type="email"
                  value={formData.parentInfo.email}
                  onChange={(e) => handleInputChange("parentInfo.email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  style={{ color: "black" }}
                  value={formData.parentInfo.relationship}
                  onChange={(e) => handleInputChange("parentInfo.relationship", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Child Symptoms */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Child Symptoms</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child Symptoms <span className="text-gray-500">(Optional)</span>
              </label>
              <SymptomsMultiSelect
                selectedSymptoms={formData.childSymptoms}
                onSymptomsChange={(symptoms) => handleInputChange("childSymptoms", symptoms)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                style={{ color: "black" }}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Address</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                style={{ color: "black" }}
                value={formData.parentInfo.address}
                onChange={(e) => handleInputChange("parentInfo.address", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                placeholder="Enter full address..."
                required
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {/* Update the Save button to show upload status: */}
          <button
            onClick={handleSave}
            disabled={isLoading || uploadingPhoto || uploadingBirthCert}
            className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : uploadingPhoto || uploadingBirthCert ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Image Modal Component
const ImageModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
  type: "photo" | "certificate"
}> = ({ isOpen, onClose, imageUrl, title, type }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === "photo" ? (
              <User className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image Container */}
        <div className="p-6 flex justify-center items-center bg-gray-50 min-h-[400px]">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=400&width=400&text=Image+Not+Found"
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Patient Details Modal Component
const PatientDetailsModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
  onEdit: (patient: PatientWithAppointments) => void
}> = ({ patient, isOpen, onClose, onEdit }) => {
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    title: string
    type: "photo" | "certificate"
  } | null>(null)

  const openImageModal = (url: string, title: string, type: "photo" | "certificate") => {
    setSelectedImage({ url, title, type })
    setShowImageModal(true)
  }

  if (!isOpen) return null

  const getPatientName = (patient: PatientWithAppointments): string => {
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    return patient.fullName || patient.childName || "Unknown"
  }

  const getParentName = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.name || patient.parentName || "N/A"
  }

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "N/A"
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {patient.photo?.url ? (
                <img
                  src={patient.photo.url || "/placeholder.svg"}
                  alt="Patient"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{getPatientName(patient)}</h3>
                <p className="text-sm text-gray-600">Patient Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(patient)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Full Name:</span>
                    <p className="text-gray-900">{getPatientName(patient)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                    <p className="text-gray-900">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Age:</span>
                    <p className="text-gray-900">{calculateAge(patient.dateOfBirth || "")}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Gender:</span>
                    <p className="text-gray-900 capitalize">{patient.gender || patient.childGender || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Parent Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Father's Name:</span>
                    <p className="text-gray-900">{getParentName(patient)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Father's Contact:</span>
                    <p className="text-gray-900">{patient.parentInfo?.phone || patient.contactNumber || "N/A"}</p>
                  </div>
                  {patient.parentInfo?.motherName && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mother's Name:</span>
                      <p className="text-gray-900">{patient.parentInfo.motherName}</p>
                    </div>
                  )}
                  {patient.parentInfo?.motherphone && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mother's Contact:</span>
                      <p className="text-gray-900">{patient.parentInfo.motherphone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{patient.parentInfo?.email || patient.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Address:</span>
                    <p className="text-gray-900">{patient.parentInfo?.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW SECTION - Child Symptoms */}
            {patient.childSymptoms && patient.childSymptoms.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Child Symptoms</h4>
                <div className="flex flex-wrap gap-2">
                  {patient.childSymptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* NEW SECTION - Notes */}
            {patient.notes && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{patient.notes}</p>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {(patient.photo?.url || patient.birthCertificate?.url) && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Documents & Photos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Photo */}
                  {patient?.photo?.url && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Patient Photo
                      </h5>
                      <div className="relative group">
                        <img
                          src={patient.photo.url || "/placeholder.svg"}
                          alt="Patient Photo"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                          onClick={() => window.open(patient.photo!.url, "_blank")}
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Birth Certificate */}
                  {patient?.birthCertificate?.url && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Birth Certificate
                      </h5>
                      <div className="relative group">
                        <img
                          src={patient.birthCertificate.url || "/placeholder.svg"}
                          alt="Birth Certificate"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-300 transition-colors"
                          onClick={() => window.open(patient.birthCertificate!.url, "_blank")}
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appointment Summary */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Appointment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{patient.totalAppointments}</div>
                  <div className="text-sm text-blue-700">Total Appointments</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{patient.completedAppointments}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{patient.pendingPayments}</div>
                  <div className="text-sm text-yellow-700">Pending Payments</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">₹{patient.totalOwed}</div>
                  <div className="text-sm text-red-700">Payment to be received</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false)
            setSelectedImage(null)
          }}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          type={selectedImage.type}
        />
      )}
    </>
  )
}

const PatientsEnhancedPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithAppointments[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPatients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    partialPayments: 0,
  })

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)
  const [showEditPatientModal, setShowEditPatientModal] = useState(false)
  // NEW STATE - Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState<PatientWithAppointments | null>(null)
  const [paymentModalData, setPaymentModalData] = useState<PaymentModalData | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch patients with appointments data - FIXED API ENDPOINT
  const fetchPatientsWithAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/with-appointments`, {
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
      if (!apiResponse.success) {
        throw new Error("API returned unsuccessful response")
      }

      setPatients(apiResponse.data)
      calculatePaymentSummary(apiResponse.data)
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  // Calculate payment summary
  const calculatePaymentSummary = (patientsData: PatientWithAppointments[]) => {
    const summary = patientsData.reduce(
      (acc, patient) => {
        acc.totalPatients += 1
        acc.totalRevenue += patient.totalPaid
        acc.pendingPayments += patient.pendingPayments
        acc.completedPayments += patient.appointments.filter((apt) => apt.payment.status === "paid").length
        acc.partialPayments += patient.appointments.filter((apt) => apt.payment.status === "partial").length
        return acc
      },
      {
        totalPatients: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        partialPayments: 0,
      },
    )

    setPaymentSummary(summary)
  }

  // Get patient display name
  const getPatientName = (patient: PatientWithAppointments): string => {
    if (patient.firstName && patient.lastName) {
      return `${patient.firstName} ${patient.lastName}`
    }
    return patient.fullName || patient.childName || "Unknown"
  }

  // Get parent name
  const getParentName = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.name || patient.parentName || "N/A"
  }

  // Get contact info
  const getContactInfo = (patient: PatientWithAppointments): string => {
    return patient.parentInfo?.phone || patient.contactNumber || "N/A"
  }

  // Open patient details modal
  const openPatientDetailsModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowPatientDetailsModal(true)
  }

  // Open edit patient modal
  const openEditPatientModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowEditPatientModal(true)
    setShowPatientDetailsModal(false) // Close details modal if open
  }

  // NEW FUNCTION - Open delete confirmation modal
  const openDeleteModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowDeleteModal(true)
  }

  // NEW FUNCTION - Handle patient deletion
  const handleDeletePatient = async () => {
    if (!selectedPatient) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${selectedPatient._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete patient")
      }

      const result = await response.json()

      if (result.success) {
        // Remove patient from local state
        setPatients((prevPatients) => prevPatients.filter((patient) => patient._id !== selectedPatient._id))

        // Recalculate payment summary
        const updatedPatients = patients.filter((patient) => patient._id !== selectedPatient._id)
        calculatePaymentSummary(updatedPatients)

        // Show success message
        alert(`Patient ${getPatientName(selectedPatient)} has been successfully deleted.`)

        // Close modal and reset state
        setShowDeleteModal(false)
        setSelectedPatient(null)
      } else {
        throw new Error(result.error || "Failed to delete patient")
      }
    } catch (error) {
      console.error("Error deleting patient:", error)
      alert("Failed to delete patient. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle patient update
  const handlePatientUpdate = (updatedPatient: Partial<PatientWithAppointments>) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) => (patient._id === updatedPatient._id ? { ...patient, ...updatedPatient } : patient)),
    )
    // Refresh the data to get the latest information
    fetchPatientsWithAppointments()
  }

  // Open payment modal
  const openPaymentModal = (patient: PatientWithAppointments, type: "single" | "partial" | "full" = "single") => {
    setSelectedPatient(patient)
    setPaymentModalData({
      patient,
      selectedAppointments: [],
      paymentType: type,
    })
    setShowPaymentModal(true)
  }

  // Open appointments detail modal
  const openAppointmentsModal = (patient: PatientWithAppointments) => {
    setSelectedPatient(patient)
    setShowAppointmentsModal(true)
  }

  // Process payment - FIXED API ENDPOINT
  const processPayment = async (paymentData: {
    appointmentIds: string[]
    paymentAmount: number
    paymentMethod: string
    paymentType: "full" | "partial"
  }) => {
    if (!selectedPatient) return

    setIsProcessingPayment(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("receptionToken")}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          appointmentIds: paymentData.appointmentIds,
          paymentAmount: paymentData.paymentAmount,
          paymentMethod: paymentData.paymentMethod,
          paymentType: paymentData.paymentType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process payment")
      }

      const result = await response.json()
      // Refresh data
      await fetchPatientsWithAppointments()
      // Show success message
      alert(`Payment of ₹${paymentData.paymentAmount} processed successfully!`)
      setShowPaymentModal(false)
      setPaymentModalData(null)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Export patient payment report
  const exportPaymentReport = () => {
    const csvContent = [
      [
        "Patient Name",
        "Parent Name",
        "Contact",
        "Total Appointments",
        "Completed",
        "Total Owed",
        "Total Paid",
        "Pending Payments",
        "Payment Status",
        "Symptoms",
        "Notes",
      ],
      ...filteredPatients.map((patient) => [
        getPatientName(patient),
        getParentName(patient),
        getContactInfo(patient),
        patient.totalAppointments.toString(),
        patient.completedAppointments.toString(),
        patient.totalOwed.toString(),
        patient.totalPaid.toString(),
        patient.pendingPayments.toString(),
        patient.pendingPayments > 0 ? "Has Pending" : "Up to Date",
        patient.childSymptoms?.join("; ") || "None",
        patient.notes || "None",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `patient-payment-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      getPatientName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getParentName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContactInfo(patient).includes(searchTerm) ||
      (patient.childSymptoms &&
        patient.childSymptoms.some((symptom) => symptom.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (patient.notes && patient.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && patient.pendingPayments > 0) ||
      (filterStatus === "paid" && patient.pendingPayments === 0) ||
      (filterStatus === "partial" && patient.appointments.some((apt) => apt.payment.status === "partial"))

    return matchesSearch && matchesFilter
  })

  useEffect(() => {
    fetchPatientsWithAppointments()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C83C92]" />
          <span className="text-[#1E437A]">Loading patient payment data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 font-sans max-w-[84%] mt-15 ml-70 mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Patient Data</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPatientsWithAppointments}
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
        <h1 className="text-2xl font-bold text-[#1E437A] mb-2">Patient Payment Management</h1>
        <p className="text-gray-600">Manage patient appointments and payment status</p>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Total Patients</p>
              <p className="text-xl font-bold text-[#1E437A]">{paymentSummary.totalPatients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">₹{paymentSummary.totalRevenue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Pending Payments</p>
              <p className="text-xl font-bold text-yellow-600">{paymentSummary.pendingPayments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{paymentSummary.completedPayments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-black text-gray-600">Partial Payments</p>
              <p className="text-xl font-bold text-orange-600">{paymentSummary.partialPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            style={{ color: "black" }}
            type="text"
            placeholder="Search patients by name, parent, contact, symptoms, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            style={{ color: "black" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="all">All Patients</option>
            <option value="pending">Pending Payments</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Payments</option>
          </select>
          <button
            onClick={exportPaymentReport}
            className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium text-gray-800 hover:bg-[#C83C9230] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={fetchPatientsWithAppointments}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1E437A]">Patient Payment Overview ({filteredPatients.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9F9FC]">
              <tr className="text-left text-[#1E437A]">
                <th className="px-6 py-4 font-medium text-gray-800">Patient Info</th>
                <th className="px-6 py-4 font-medium text-gray-800">Appointments</th>
                <th className="px-6 py-4 font-medium text-gray-800">Payment Summary</th>
                <th className="px-6 py-4 font-medium text-gray-800">Status</th>
                <th className="px-6 py-4 font-medium text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Patient Photo */}
                      {patient.photo?.url ? (
                        <img
                          src={patient.photo.url || "/placeholder.svg"}
                          alt="Patient"
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        >
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div
                          className="font-medium text-gray-800 text-[#456696] cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => openPatientDetailsModal(patient)}
                        >
                          {getPatientName(patient)}
                        </div>
                        <div className="text-sm text-black text-gray-500">Parent: {getParentName(patient)}</div>
                        <div className="text-sm text-black text-gray-500">Contact: {getContactInfo(patient)}</div>
                        {/* Document indicators */}
                        <div className="flex items-center gap-2 mt-1">
                          {patient.photo?.url && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              <User className="w-3 h-3" />
                              Photo
                            </span>
                          )}
                          {patient.birthCertificate?.url && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              <FileText className="w-3 h-3" />
                              Certificate
                            </span>
                          )}
                          {patient.childSymptoms && patient.childSymptoms.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              {patient.childSymptoms.length} Symptom{patient.childSymptoms.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {patient.notes && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                              Notes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Total:</span> {patient.totalAppointments}
                      </div>
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Completed:</span> {patient.completedAppointments}
                      </div>
                      <button
                        onClick={() => openAppointmentsModal(patient)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Amount Due:</span>{" "}
                        <span className="text-red-600">₹{patient.totalOwed}</span>
                      </div>
                      <div className="text-sm text-black">
                        <span className="font-medium text-gray-800">Paid:</span>{" "}
                        <span className="text-green-600">₹{patient.totalPaid}</span>
                      </div>
                      {patient.pendingPayments > 0 && (
                        <div className="text-xs text-orange-600">
                          {patient.pendingPayments} pending payment{patient.pendingPayments > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {patient.totalAppointments === 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        No Appointments
                      </span>
                    ) : patient.pendingPayments === 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Payment Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Has Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openPatientDetailsModal(patient)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openEditPatientModal(patient)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        Edit
                      </button>
                      {/* NEW BUTTON - Delete Patient */}
                      <button
                        onClick={() => openDeleteModal(patient)}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                      {patient.totalAppointments > 0 && patient.pendingPayments > 0 && (
                        <>
                          <button
                            onClick={() => openPaymentModal(patient, "single")}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            Pay Single
                          </button>
                          <button
                            onClick={() => openPaymentModal(patient, "full")}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                          >
                            Pay All
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterStatus !== "all" ? "No patients found matching your criteria." : "No patients found."}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientDetailsModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          isOpen={showPatientDetailsModal}
          onClose={() => {
            setShowPatientDetailsModal(false)
            setSelectedPatient(null)
          }}
          onEdit={openEditPatientModal}
        />
      )}

      {/* Edit Patient Modal */}
      {showEditPatientModal && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          isOpen={showEditPatientModal}
          onClose={() => {
            setShowEditPatientModal(false)
            setSelectedPatient(null)
          }}
          onSave={handlePatientUpdate}
        />
      )}

      {/* NEW MODAL - Delete Confirmation Modal */}
      {showDeleteModal && selectedPatient && (
        <DeleteConfirmationModal
          patient={selectedPatient}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedPatient(null)
          }}
          onConfirm={handleDeletePatient}
          isDeleting={isDeleting}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentModalData && (
        <PaymentModal
          data={paymentModalData}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentModalData(null)
          }}
          onProcessPayment={processPayment}
          isProcessing={isProcessingPayment}
        />
      )}

      {/* Appointments Detail Modal */}
      {showAppointmentsModal && selectedPatient && (
        <AppointmentsDetailModal
          patient={selectedPatient}
          isOpen={showAppointmentsModal}
          onClose={() => {
            setShowAppointmentsModal(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}

// Enhanced Payment Modal Component with improved scrolling
const PaymentModal: React.FC<{
  data: PaymentModalData
  isOpen: boolean
  onClose: () => void
  onProcessPayment: (paymentData: {
    appointmentIds: string[]
    paymentAmount: number
    paymentMethod: string
    paymentType: "full" | "partial"
  }) => void
  isProcessing: boolean
}> = ({ data, isOpen, onClose, onProcessPayment, isProcessing }) => {
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([])
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full")

  const pendingAppointments = data.patient.appointments.filter(
    (apt) => apt.payment.status === "pending" || apt.payment.status === "partial",
  )

  const totalOwed = pendingAppointments.reduce((sum, apt) => {
    const remaining = apt.payment.amount - (apt.payment.paidAmount || 0)
    return sum + remaining
  }, 0)

  useEffect(() => {
    if (data.paymentType === "full") {
      setSelectedAppointments(pendingAppointments.map((apt) => apt._id))
      setPaymentAmount(totalOwed)
      setPaymentType("full")
    } else if (data.paymentType === "single" && pendingAppointments.length > 0) {
      setSelectedAppointments([pendingAppointments[0]._id])
      const remaining = pendingAppointments[0].payment.amount - (pendingAppointments[0].payment.paidAmount || 0)
      setPaymentAmount(remaining)
      setPaymentType("full")
    }
  }, [data])

  // ADD THIS NEW useEffect - This is the fix!
  useEffect(() => {
    // Only auto-update payment amount for full payments
    if (paymentType === "full") {
      const newTotal = calculateSelectedTotal()
      setPaymentAmount(newTotal)
    }
  }, [selectedAppointments, paymentType])

  const handleAppointmentToggle = (appointmentId: string) => {
    setSelectedAppointments((prev) => {
      if (prev.includes(appointmentId)) {
        return prev.filter((id) => id !== appointmentId)
      } else {
        return [...prev, appointmentId]
      }
    })
  }

  const calculateSelectedTotal = () => {
    return selectedAppointments.reduce((sum, aptId) => {
      const apt = pendingAppointments.find((a) => a._id === aptId)
      if (apt) {
        const remaining = apt.payment.amount - (apt.payment.paidAmount || 0)
        return sum + remaining
      }
      return sum
    }, 0)
  }

  const handleSubmit = () => {
    if (selectedAppointments.length === 0) {
      alert("Please select appointments and enter a valid payment amount")
      return
    }

    onProcessPayment({
      appointmentIds: selectedAppointments,
      paymentAmount,
      paymentMethod,
      paymentType,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-[#1E437A]">Process Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#1E437A] mb-2">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-black">
              <div>
                <span className="font-medium text-gray-800">Name:</span> {data.patient.firstName}{" "}
                {data.patient.lastName}
              </div>
              <div>
                <span className="font-medium text-gray-800">Parent:</span> {data.patient.parentInfo?.name}
              </div>
              <div>
                <span className="font-medium text-gray-800">Total Amount Due:</span>{" "}
                <span className="text-red-600 font-medium">₹{totalOwed}</span>
              </div>
              <div>
                <span className="font-medium text-gray-800">Pending Appointments:</span> {pendingAppointments.length}
              </div>
            </div>
          </div>

          {/* Appointment Selection with Enhanced Scrolling */}
          <div>
            <h4 className="font-medium text-[#1E437A] mb-3">Select Appointments to Pay</h4>
            <div className="relative">
              {/* Custom scrollable container with visible scrollbar */}
              <div
                className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#C83C92 #f1f1f1",
                }}
              >
                {/* Custom scrollbar styles for webkit browsers */}
                <style jsx>{`
                  .appointments-scroll::-webkit-scrollbar {
                    width: 8px;
                  }
                  .appointments-scroll::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                  }
                  .appointments-scroll::-webkit-scrollbar-thumb {
                    background: #C83C92;
                    border-radius: 4px;
                  }
                  .appointments-scroll::-webkit-scrollbar-thumb:hover {
                    background: #B8358A;
                  }
                `}</style>
                <div className="appointments-scroll p-2 space-y-2">
                  {pendingAppointments.map((appointment) => {
                    const remaining = appointment.payment.amount - (appointment.payment.paidAmount || 0)
                    return (
                      <label
                        key={appointment._id}
                        className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer"
                      >
                        <input
                          style={{ color: "black" }}
                          type="checkbox"
                          checked={selectedAppointments.includes(appointment._id)}
                          onChange={() => handleAppointmentToggle(appointment._id)}
                          className="mr-3 text-[#C83C92] focus:ring-[#C83C92] focus:ring-2 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {new Date(appointment.date).toLocaleDateString()} - {appointment.startTime}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {appointment.service.name} with {appointment.therapist.name}
                              </div>
                              {appointment.payment.status === "partial" && (
                                <div className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                                  Paid: ₹{appointment.payment.paidAmount} of ₹{appointment.payment.amount}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold text-sm text-gray-900">₹{remaining}</div>
                              <div className="text-xs text-gray-500">remaining</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              {/* Scroll indicator */}
              {pendingAppointments.length > 3 && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Scroll to view more appointments ({pendingAppointments.length} total)
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E437A] mb-2">Payment Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    style={{ color: "black" }}
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === "full"}
                    onChange={(e) => {
                      setPaymentType(e.target.value as "full" | "partial")
                      if (e.target.value === "full") {
                        setPaymentAmount(calculateSelectedTotal())
                      }
                    }}
                    className="mr-2 text-[#C83C92] focus:ring-[#C83C92]"
                  />
                  <span className="text-black">Full Payment</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E437A] mb-2">Payment Amount</label>
                <input
                  style={{ color: "black" }}
                  type="number"
                  value={paymentAmount || calculateSelectedTotal() || 0}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={calculateSelectedTotal()}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] text-black"
                  placeholder="Enter amount"
                />
                <div className="text-xs text-gray-500 mt-1">Selected total: ₹{calculateSelectedTotal()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E437A] mb-2">Payment Method</label>
                <select
                  style={{ color: "black" }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] text-black"
                >
                  <option value="cash">Cash</option>
                  <option value="card">UPI</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || selectedAppointments.length === 0}
            className="flex-1 bg-[#C83C92] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B8358A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Process Payment (₹{paymentAmount})
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Appointments Detail Modal Component (keeping existing implementation)
const AppointmentsDetailModal: React.FC<{
  patient: PatientWithAppointments
  isOpen: boolean
  onClose: () => void
}> = ({ patient, isOpen, onClose }) => {
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1E437A]">
            Appointment History - {patient.firstName} {patient.lastName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Patient Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
            <div>
              <span className="font-medium text-gray-800">Total Appointments:</span> {patient.totalAppointments}
            </div>
            <div>
              <span className="font-medium text-gray-800">Completed:</span> {patient.completedAppointments}
            </div>
            <div>
              <span className="font-medium text-gray-800">Total Paid:</span>{" "}
              <span className="text-green-600">₹{patient.totalPaid}</span>
            </div>
            <div>
              <span className="font-medium text-gray-800">Payment to be received:</span>{" "}
              <span className="text-red-600">₹{patient.totalOwed}</span>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          <h4 className="font-medium text-[#1E437A]">All Appointments</h4>
          {patient.appointments.map((appointment) => (
            <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-[#456696]">
                    {new Date(appointment.date).toLocaleDateString()} - {appointment.startTime} to {appointment.endTime}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {appointment.service.name} with {appointment.therapist.name}
                  </div>
                  <div className="text-sm text-gray-600">Type: {appointment.type}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
                <div>
                  <span className="font-medium text-gray-800">Amount:</span> ₹{appointment.payment.amount}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Payment Status:</span>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment.status)}`}
                  >
                    {appointment.payment.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">Method:</span> {appointment.payment.method}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Sessions:</span> {appointment.sessionsCompleted}/
                  {appointment.totalSessions}
                </div>
              </div>
              {appointment.payment.status === "partial" && (
                <div className="mt-2 text-sm text-orange-600">
                  Paid: ₹{appointment.payment.paidAmount} of ₹{appointment.payment.amount}
                </div>
              )}
            </div>
          ))}
        </div>

        {patient.appointments.length === 0 && (
          <div className="text-center py-8 text-gray-500">No appointments found for this patient.</div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
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

export default PatientsEnhancedPage
