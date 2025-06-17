"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Eye,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import eye from "@/public/eye.svg";
import phone from "@/public/phone.svg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Clock, User, Edit3, Trash2 } from "lucide-react";
import { Stethoscope, UserCheck } from "lucide-react";
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
  status?: "scheduled" | "completed" | "cancelled" | "no_show";
}

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.data);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while fetching appointments");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      toast.success("Appointment status updated");
      fetchAppointments();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while updating status");
      }
    }
  };

  const filteredAppointments = appointments.filter(
    (appointment) =>
      (appointment.patientId?.childName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (appointment.doctorId?.firstName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (appointment.doctorId?.lastName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  if (loading) {
    return (
      <div className="p-6 max-w-[90%] mt-15 ml-70 mx-auto">
        <h1 className="text-2xl font-bold text-[#1E437A] mb-6">
          Loading appointments...
        </h1>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto  hide-scrollbar">
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">
        Hello, Receptionist!
      </h1>
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
          onClick={() => router.push("/dashboard/schedule-appointment")}
        >
          <Calendar className="w-5 h-5" />
          Schedule an Appointment
        </button>

        <Link href={"/dashboard/registerPatient"}>
          <button className="cursor-pointer flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium">
            <Plus className="w-5 h-5" />
            Register New Patient
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#1E437A] ml-5">
            Upcoming Appointments
          </h2>
        </div>

        <DoctorScheduleTable />
      </div>
    </div>
  );
};

export default ReceptionistDashboard;

interface Appointment {
  id: string;
  patientName: string;
  type?: "consultation" | "follow-up" | "emergency" | "surgery";
  status?: "scheduled" | "completed" | "cancelled";
  duration?: number;
}

interface DoctorSchedule {
  [doctor: string]: {
    [time: string]: Appointment | null;
  };
}

const DoctorScheduleTable: React.FC = () => {
  const timeSlots = [
    "9:15",
    "10:00",
    "10:45",
    "11:30",
    "12:15",
    "1:00",
    "1:45",
    "2:30",
    "3:15",
    "4:00",
    "4:45",
    "5:30",
    "6:00",
    "6:45",
  ];

  const doctors = [
    { name: "Dr. Ashish", specialty: "Cardiology", color: "blue" },
    { name: "Dr. Chandrika", specialty: "Pediatrics", color: "pink" },
    { name: "Dr. Mira G", specialty: "Dermatology", color: "green" },
    { name: "Dr. Nikhilesh", specialty: "Orthopedics", color: "purple" },
    { name: "Dr. Sarang", specialty: "Neurology", color: "indigo" },
    { name: "Dr. Rajesh", specialty: "General Medicine", color: "orange" },
    { name: "Dr. Vihan P", specialty: "ENT", color: "teal" },
  ];

  const [scheduleData, setScheduleData] = useState<DoctorSchedule>({
    "Dr. Ashish": {
      "9:15": {
        id: "1",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "John Doe",
        type: "consultation",
        status: "scheduled",
        duration: 30,
      },
      "11:30": {
        id: "2",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Sarah Wilson",
        type: "follow-up",
        status: "scheduled",
        duration: 20,
      },
      "2:30": {
        id: "3",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Mike Johnson",
        type: "consultation",
        status: "scheduled",
        duration: 45,
      },
      "4:45": {
        id: "4",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Emma Davis",
        type: "emergency",
        status: "scheduled",
        duration: 60,
      },
    },
    "Dr. Chandrika": {
      "10:00": {
        id: "5",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Alice Brown",
        type: "consultation",
        status: "scheduled",
        duration: 30,
      },
      "12:15": {
        id: "6",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Tommy Lee",
        type: "follow-up",
        status: "scheduled",
        duration: 15,
      },
      "3:15": {
        id: "7",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Lucy Chen",
        type: "consultation",
        status: "scheduled",
        duration: 30,
      },
      "5:30": {
        id: "8",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Baby Smith",
        type: "consultation",
        status: "scheduled",
        duration: 25,
      },
    },
    "Dr. Mira G": {
      "9:15": {
        id: "9",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Diana Miller",
        type: "consultation",
        status: "scheduled",
        duration: 40,
      },
      "1:00": {
        id: "10",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Robert Garcia",
        type: "follow-up",
        status: "scheduled",
        duration: 20,
      },
      "4:00": {
        id: "11",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Lisa Wang",
        type: "consultation",
        status: "scheduled",
        duration: 35,
      },
    },
    "Dr. Nikhilesh": {
      "10:45": {
        id: "12",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "James Taylor",
        type: "consultation",
        status: "scheduled",
        duration: 50,
      },
      "1:45": {
        id: "13",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Maria Rodriguez",
        type: "surgery",
        status: "scheduled",
        duration: 120,
      },
      "6:00": {
        id: "14",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "David Kim",
        type: "follow-up",
        status: "scheduled",
        duration: 30,
      },
    },
    "Dr. Sarang": {
      "11:30": {
        id: "15",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Jennifer Lopez",
        type: "consultation",
        status: "scheduled",
        duration: 45,
      },
      "2:30": {
        id: "16",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Kevin Brown",
        type: "emergency",
        status: "scheduled",
        duration: 90,
      },
      "5:30": {
        id: "17",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Amanda White",
        type: "follow-up",
        status: "scheduled",
        duration: 25,
      },
    },
    "Dr. Rajesh": {
      "9:15": {
        id: "18",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Chris Johnson",
        type: "consultation",
        status: "scheduled",
        duration: 30,
      },
      "12:15": {
        id: "19",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Nicole Davis",
        type: "consultation",
        status: "scheduled",
        duration: 35,
      },
      "3:15": {
        id: "20",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Ryan Miller",
        type: "follow-up",
        status: "scheduled",
        duration: 20,
      },
      "6:45": {
        id: "21",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Sophia Garcia",
        type: "consultation",
        status: "scheduled",
        duration: 40,
      },
    },
    "Dr. Vihan P": {
      "10:00": {
        id: "22",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Alex Wilson",
        type: "consultation",
        status: "scheduled",
        duration: 30,
      },
      "1:00": {
        id: "23",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Grace Lee",
        type: "surgery",
        status: "scheduled",
        duration: 90,
      },
      "4:45": {
        id: "24",
        patientId: "1e234",
        consultaionId: "ifj93y4334",
        doctorId: "123jerij9u",
        patientName: "Nathan Chen",
        type: "follow-up",
        status: "scheduled",
        duration: 25,
      },
    },
  });

  const [selectedSlot, setSelectedSlot] = useState<{
    doctor: string;
    time: string;
  } | null>(null);

  const getAppointmentTypeColor = (type?: string, doctorColor?: string) => {
    const baseColors = {
      blue: "bg-blue-100 border-blue-300 text-blue-800",
      pink: "bg-pink-100 border-pink-300 text-pink-800",
      green: "bg-green-100 border-green-300 text-green-800",
      purple: "bg-purple-100 border-purple-300 text-purple-800",
      indigo: "bg-indigo-100 border-indigo-300 text-indigo-800",
      orange: "bg-orange-100 border-orange-300 text-orange-800",
      teal: "bg-teal-100 border-teal-300 text-teal-800",
    };

    if (type === "emergency") {
      return "bg-red-100 border-red-400 text-red-800 ring-2 ring-red-200";
    }
    if (type === "surgery") {
      return "bg-purple-100 border-purple-400 text-purple-800 ring-2 ring-purple-200";
    }

    return (
      baseColors[doctorColor as keyof typeof baseColors] ||
      "bg-gray-100 border-gray-300 text-gray-800"
    );
  };

  const getDoctorHeaderColor = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600",
      orange: "from-orange-500 to-orange-600",
      teal: "from-teal-500 to-teal-600",
    };
    return colors[color as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const handleSlotClick = (doctor: string, time: string) => {
    setSelectedSlot({ doctor, time });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const hourNum = Number.parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour =
      hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getAppointmentCount = (doctorName: string) => {
    return Object.values(scheduleData[doctorName] || {}).filter(Boolean).length;
  };

  return (
    <div className="p-2 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Doctor Schedule
              </h1>
              <p className="text-gray-600">
                Daily consultation schedule by doctor
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-sm text-gray-700">
                Regular Consultation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Follow-up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-400 rounded ring-2 ring-red-200"></div>
              <span className="text-sm text-gray-700">Emergency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded ring-2 ring-purple-200"></div>
              <span className="text-sm text-gray-700">Surgery</span>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="p-4 bg-gradient-to-r from-slate-600 to-slate-700 text-left sticky left-0 z-10">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Clock className="w-5 h-5" />
                      Time
                    </div>
                  </th>
                  {doctors.map((doctor) => (
                    <th
                      key={doctor.name}
                      className="p-4 text-center min-w-[180px]"
                    >
                      <div
                        className={`bg-gradient-to-r ${getDoctorHeaderColor(
                          doctor.color
                        )} rounded-lg p-3 text-white`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <UserCheck className="w-5 h-5" />
                          <span className="font-semibold text-sm">
                            {doctor.name}
                          </span>
                        </div>
                        <div className="text-xs opacity-90">
                          {doctor.specialty}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {getAppointmentCount(doctor.name)} appointments
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr
                    key={time}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      timeIndex % 2 === 0 ? "bg-gray-25" : "bg-white"
                    }`}
                  >
                    {/* Time Column */}
                    <td className="p-4 border-r border-gray-200 bg-slate-50 sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                        <span className="font-medium text-gray-700 text-sm">
                          {formatTime(time)}
                        </span>
                      </div>
                    </td>

                    {/* Doctor Columns */}
                    {doctors.map((doctor) => {
                      const appointment = scheduleData[doctor.name]?.[time];
                      return (
                        <td
                          key={`${doctor.name}-${time}`}
                          className="p-2 border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleSlotClick(doctor.name, time)}
                        >
                          {appointment ? (
                            <div
                              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${getAppointmentTypeColor(
                                appointment.type,
                                doctor.color
                              )}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <p className="font-semibold text-xs truncate">
                                      {appointment.patientName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {appointment.type && (
                                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white bg-opacity-60 rounded-full">
                                        {appointment.type}
                                      </span>
                                    )}
                                    {appointment.duration && (
                                      <span className="text-xs opacity-70">
                                        {appointment.duration}min
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors">
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-25 transition-all min-h-[80px] flex items-center justify-center">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Selected: {selectedSlot.doctor} at {formatTime(selectedSlot.time)}
            </h3>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Book Appointment
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Doctor Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.slice(0, 4).map((doctor) => (
            <div
              key={doctor.name}
              className="p-4 bg-white rounded-xl shadow-sm border"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 bg-gradient-to-r ${getDoctorHeaderColor(
                    doctor.color
                  )} rounded-lg`}
                >
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{doctor.name}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getAppointmentCount(doctor.name)} patients
                  </p>
                  <p className="text-xs text-gray-500">{doctor.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
