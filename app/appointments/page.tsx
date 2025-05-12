"use client"
import React, { useState } from "react";
import { Calendar, Eye, Phone, Plus, Search, SlidersHorizontal, Check, X } from "lucide-react";
import Link from "next/link";

// Define TypeScript interfaces
interface Appointment {
  id: number;
  date: string;
  time: string;
  patientName: string;
  patientId: number;
  doctor: string;
  parentContact: string;
  status: "Confirmed" | "Pending Confirmation" | "Cancelled";
}

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      date: "Mar 6, 2025",
      time: "09:30 AM",
      patientName: "Aarav Sharma",
      patientId: 1,
      doctor: "Dr. Shruti Patil",
      parentContact: "98765 43210",
      status: "Confirmed"
    },
    {
      id: 2,
      date: "Mar 6, 2025",
      time: "10:00 AM",
      patientName: "Zara Khan",
      patientId: 2,
      doctor: "Dr. Parul Diwan",
      parentContact: "99887 66554",
      status: "Confirmed"
    },
    {
      id: 3,
      date: "Mar 7, 2025",
      time: "11:30 AM",
      patientName: "Kabir Mehta",
      patientId: 3,
      doctor: "Dr. Shruti Patil",
      parentContact: "97845 21345",
      status: "Confirmed"
    },
    {
      id: 4,
      date: "Mar 7, 2025",
      time: "12:00 PM",
      patientName: "Ishaan Verma",
      patientId: 4,
      doctor: "Dr. Parul Diwan",
      parentContact: "98456 32145",
      status: "Confirmed"
    },
    {
      id: 5,
      date: "Mar 8, 2025",
      time: "02:00 PM",
      patientName: "Tara Iyer",
      patientId: 5,
      doctor: "Dr. Shruti Patil",
      parentContact: "99234 55667",
      status: "Pending Confirmation"
    },
    {
      id: 6,
      date: "Mar 9, 2025",
      time: "03:30 PM",
      patientName: "Rehan Das",
      patientId: 6,
      doctor: "Dr. Parul Diwan",
      parentContact: "98987 33445",
      status: "Pending Confirmation"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };
  
  const confirmAppointment = (id: number): void => {
    setAppointments(appointments.map(appointment => 
      appointment.id === id ? {...appointment, status: "Confirmed"} : appointment
    ));
  };
  
  const cancelAppointment = (id: number): void => {
    setAppointments(appointments.map(appointment => 
      appointment.id === id ? {...appointment, status: "Cancelled"} : appointment
    ));
  };

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
            <h2 className="text-xl font-semibold text-[#1E437A]">All Appointments</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
                {appointments.filter(a => a.status === "Confirmed").length} Confirmed
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-600">
                {appointments.filter(a => a.status === "Pending Confirmation").length} Pending
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="">
              <tr className="text-left text-[#1E437A] bg-[#F9F9FC] h-12">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Patient Name</th>
                <th className="pb-3 font-medium">Doctor</th>
                <th className="pb-3 font-medium">Parent Contact</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b">
                  <td className="py-4 text-[#456696]">{appointment.date}</td>
                  <td className="py-4 text-[#456696]">{appointment.time}</td>
                  <td className="py-4 text-[#456696]">
                    <Link href={`/dashboard/patients/${appointment.patientId}`} className="hover:underline">
                      {appointment.patientName}
                    </Link>
                  </td>
                  <td className="py-4 text-[#456696]">{appointment.doctor}</td>
                  <td className="py-4 text-[#456696]">{appointment.parentContact}</td>
                  <td className="py-4">
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
                  </td>
                  <td className="py-4">
                    {appointment.status === "Confirmed" ? (
                      <div className="flex gap-2">
                        <Link href={`/dashboard/appointments/${appointment.id}`}>
                          <button className="flex items-center gap-1 text-[#C83C92] font-medium">
                            <Eye className="w-4 h-4" />
                            Details
                          </button>
                        </Link>
                      </div>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>Showing 1-6 of 6 appointments</div>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 border rounded-md text-gray-400">Previous</button>
            <button className="px-3 py-1 bg-[#1E437A] text-white rounded-md">1</button>
            <button disabled className="px-3 py-1 border rounded-md text-gray-400">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;