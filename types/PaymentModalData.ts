import { PatientWithAppointments } from "./PatientWithAppointment"

export interface PaymentModalData {
  patient: PatientWithAppointments
  selectedAppointments: string[]
  paymentType: "single" | "partial" | "full"
  customAmount?: number
}