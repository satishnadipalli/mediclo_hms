
export interface PatientWithAppointments {
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