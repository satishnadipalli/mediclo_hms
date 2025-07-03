"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  Eye,
  Phone,
  Search,
  Check,
  X
} from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  patientId: string;
  doctor: string;
  parentContact: string;
  status: "Confirmed" | "Pending Confirmation" | "Cancelled";
  totalSessions: number;
  sessionsPaid: number;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/upcoming`);
        if (res.data.success) {
          const formatted = res.data.data.map((a: any): Appointment => ({
            id: a.id,
            date: formatDate(a.date),
            time: a.startTime,
            patientName: a.patientName || a.patientId?.fullName || "Unknown",
            patientId: a.patientId?._id || "unknown",
            doctor: a.therapistId?.fullName || "Unassigned",
            parentContact: a.phone || "N/A",
            status:
              a.status === "scheduled" || a.status === "rescheduled"
                ? "Pending Confirmation"
                : a.status.charAt(0).toUpperCase() + a.status.slice(1),
            totalSessions: a.totalSessions || 0,
            sessionsPaid: a.sessionsPaid || 0
          }));
          setAppointments(formatted);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const confirmAppointment = (id: string): void => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status: "Confirmed" } : appointment
      )
    );
  };

  const cancelAppointment = (id: string): void => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status: "Cancelled" } : appointment
      )
    );
  };

  const filteredAppointments = appointments.filter((a) =>
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Upcoming Appointments</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium">
          <Calendar className="w-5 h-5" />
          Schedule an Appointment
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <h2 className="text-xl font-semibold text-[#1E437A]">All</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                {appointments.filter((a) => a.status === "Confirmed").length} Confirmed
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-600">
                {appointments.filter((a) => a.status === "Pending Confirmation").length} Pending
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading appointments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[#1E437A] bg-[#F9F9FC] h-12">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Patient Name</th>
                  <th className="pb-3 font-medium">Doctor</th>
                  <th className="pb-3 font-medium">Parent Contact</th>
                  {/* <th className="pb-3 font-medium">Status</th> */}
                  {/* <th className="pb-3 font-medium">Actions</th> */}
                  <th className="pb-3 font-medium">No.of Sessions</th>
                  <th className="pb-3 font-medium">Sessions Paid</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b">
                    <td className="py-4 text-[#456696]">{appointment.date}</td>
                    <td className="py-4 text-[#456696]">{appointment.time}</td>
                    <td className="py-4 text-[#456696]">
                      {/* <Link
                        href={`/hms/dashboard/patients/${appointment.patientId}`} */}
                        {/* className="hover:underline"
                      > */}
                        {appointment.patientName}
                      {/* </Link> */}
                    </td>
                    <td className="py-4 text-[#456696]">{appointment.doctor}</td>
                    <td className="py-4 text-[#456696]">{appointment.parentContact}</td>
                    {/* <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === "Confirmed"
                            ? "bg-green-100 text-green-600"
                            : appointment.status === "Cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td> */}
                    {/* <td className="py-4">
                      {appointment.status === "Confirmed" ? (
                        // <Link href={`/hms/dashboard/appointments/${appointment.id}`}>
                          <button className="flex items-center gap-1 text-[#C83C92] font-medium">
                            <Eye className="w-4 h-4" />
                            Details
                          </button>
                        // </Link>
                      ) : appointment.status === "Pending Confirmation" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmAppointment(appointment.id)}
                            className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-md font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Confirm
                          </button>
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
                            <Phone className="w-4 h-4" />
                            Call
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500">No actions available</div>
                      )}
                    </td> */}
                    <td className="py-4 text-[#456696]">{appointment.totalSessions}</td>
                    <td className="py-4 text-[#456696]">{appointment.sessionsPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
