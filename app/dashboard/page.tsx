"use client"
import React, { useState, useEffect } from "react";
import { Calendar, Eye, Phone, Plus, Search, SlidersHorizontal } from "lucide-react";
import eye from '@/public/eye.svg'
import phone from '@/public/phone.svg'
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Appointment {
  _id: string;
  date: string;
  timeSlot: string;
  patientId: {
    childName: string;
    _id: string;
  };
  doctorId: {
    firstName: string;
    lastName: string;
    _id: string;
  };
  parentInfo: {
    contactNumber: string;
  };
  status: "scheduled" | "completed" | "cancelled" | "no_show";
}

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.data);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred while fetching appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      toast.success('Appointment status updated');
      fetchAppointments(); 
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred while updating status');
      }
    }
  };

  const filteredAppointments = appointments.filter(appointment => 
    appointment.patientId.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.doctorId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.doctorId.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Loading appointments...</h1>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Hello, Receptionist!</h1>
      
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search patients or doctors..." 
            className="pl-10 pr-4 py-2 bg-white w-110 border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium"
          onClick={() => router.push('/dashboard/schedule-appointment')}
        >
          <Calendar className="w-5 h-5" />
          Schedule an Appointment
        </button>
        
        <Link href={'/dashboard/registerPatient'}>
          <button className="cursor-pointer flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium">
            <Plus className="w-5 h-5" />
            Register New Patient
          </button>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#1E437A] ml-5">Upcoming Appointments</h2>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full ml-5">
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
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b">
                    <td className="py-4 text-[#456696]">
                      {new Date(appointment.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 text-[#456696]">{appointment.timeSlot}</td>
                    <td className="py-4 text-[#456696]">{appointment.patientId.childName}</td>
                    <td className="py-4 text-[#456696]">
                      Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                    </td>
                    <td className="py-4 text-[#456696]">
  {appointment.parentInfo?.contactNumber || "N/A"}
</td>
                    <td className="py-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === "scheduled" 
                            ? "bg-green-100 text-green-600" 
                            : appointment.status === "completed"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 flex gap-3">
                      <button 
                        className="flex items-center gap-1 text-[#C83C92] font-medium"
                        onClick={() => router.push(`/dashboard/appointments/${appointment._id}`)}
                      >
                        <Image src={eye} width={18} height={18} alt="eye"/>
                        View Details
                      </button>
                      <button 
  className="flex items-center gap-1 text-[#C83C92] font-medium"
  onClick={() => appointment.parentInfo?.contactNumber && (window.location.href = `tel:${appointment.parentInfo.contactNumber}`)}
  disabled={!appointment.parentInfo?.contactNumber}
>

                        <Image src={phone} width={18} height={18} alt="phone"/>
                        Call Parent
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;