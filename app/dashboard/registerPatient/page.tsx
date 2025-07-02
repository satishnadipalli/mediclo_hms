"use client"
import type React from "react"
import { useState } from "react"
import { ChevronLeft, Upload, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

const PatientRegistrationForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // File previews
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(null)
  const [parentPhotoPreview, setParentPhotoPreview] = useState<string | null>(null)
  const [birthCertificatePreview, setBirthCertificatePreview] = useState<string | null>(null)
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Child's Information
    childName: "",
    lastName: "", // Add this field
    dateOfBirth: "",
    age: "",
    gender: "",
    childPhoto: "",
    birthCertificate: "",
    parentId: "", // Add this field

    // Parent's Information
    parentInfo: {
      name: "",
      phone: "",
      email: "",
      photo: "",
      aadharCard: "",
      address: "",
      relationship: "Guardian",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          firstName: formData.childName,
          lastName: formData.lastName,
          // fullName: `${formData.firstName} ${formData.lastName}`,
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
      console.log("Registed successfully",response)
      toast.success("Patient registered successfully!")

      // Redirect to schedule appointment with patient ID
      router.push(`/dashboard/schedule-appointment?patientId=${result.data._id}`)
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register patient")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterLater = async () => {
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          firstName: formData.childName,
          lastName: formData.lastName,
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

       const data = await response.json();
      console.log("Regsited successfullyu",data);
      // return;

      toast.success("Patient registered successfully!")
      console.log("routeing")
      router.push("/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register patient")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 mw-[85%] ml-[300px] mx-auto bg-gray-50 min-h-screen">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Child's Full Name</label>
              <input
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                placeholder="Enter child's full name here"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Child's Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Child's Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter child's last name here"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Date of Birth and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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

        {/* Emergency Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Emergency Contact Information</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                <input
                  type="text"
                  name="emergencyContact.relation"
                  value={formData.emergencyContact.relation}
                  onChange={handleInputChange}
                  placeholder="Enter relation (e.g., Uncle, Aunt)"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
                placeholder="Enter emergency contact phone number"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Parent's Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Parent's Information</h2>

          <div className="space-y-6">
            {/* Parent/Guardian Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Name</label>
              <input
                type="text"
                name="parentInfo.name"
                value={formData.parentInfo.name}
                onChange={handleInputChange}
                placeholder="Enter parent's full name here"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Contact Number and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent's Contact Number</label>
                <input
                  type="tel"
                  name="parentInfo.phone"
                  value={formData.parentInfo.phone}
                  onChange={handleInputChange}
                  placeholder="Enter parent's contact number here"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent's Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="parentInfo.email"
                  value={formData.parentInfo.email}
                  onChange={handleInputChange}
                  placeholder="Enter parent's email address here"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Parent Photo</label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 cursor-pointer font-medium">
                  <Upload className="w-4 h-4" />
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "parentPhoto")}
                    className="hidden"
                  />
                </label>
                {parentPhotoPreview && (
                  <div className="mt-2">
                    <img
                      src={parentPhotoPreview || "/placeholder.svg"}
                      alt="Parent"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Aadhar Card</label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 cursor-pointer font-medium">
                  <Upload className="w-4 h-4" />
                  Aadhar Card
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, "aadharCard")}
                    className="hidden"
                  />
                </label>
                {aadharCardPreview && <div className="mt-2 text-xs text-green-600">✓ File uploaded</div>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="parentInfo.address"
                value={formData.parentInfo.address}
                onChange={handleInputChange}
                placeholder="Enter full address here..."
                rows={4}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PatientRegistrationForm
