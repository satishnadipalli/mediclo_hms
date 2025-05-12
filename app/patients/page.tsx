"use client"
import React, { useState } from "react";
import { Calendar, Edit, Plus, Search, SlidersHorizontal, UserRound, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Define TypeScript interfaces
interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  parentName: string;
  contact: string;
  lastVisit: string;
  upcomingAppointment: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      name: "Aarav Sharma",
      age: 8,
      gender: "Male",
      parentName: "Vikram Sharma",
      contact: "98765 43210",
      lastVisit: "Feb 28, 2025",
      upcomingAppointment: "Mar 6, 2025"
    },
    {
      id: 2,
      name: "Zara Khan",
      age: 5,
      gender: "Female",
      parentName: "Aisha Khan",
      contact: "99887 66554",
      lastVisit: "Jan 15, 2025",
      upcomingAppointment: "Mar 6, 2025"
    },
    {
      id: 3,
      name: "Kabir Mehta",
      age: 7,
      gender: "Male",
      parentName: "Rohan Mehta",
      contact: "97845 21345",
      lastVisit: "Feb 10, 2025",
      upcomingAppointment: "Mar 7, 2025"
    },
    {
      id: 4,
      name: "Ishaan Verma",
      age: 6,
      gender: "Male",
      parentName: "Pooja Verma",
      contact: "98456 32145",
      lastVisit: "Mar 1, 2025",
      upcomingAppointment: "Mar 7, 2025"
    },
    {
      id: 5,
      name: "Tara Iyer",
      age: 9,
      gender: "Female",
      parentName: "Arun Iyer",
      contact: "99234 55667",
      lastVisit: "Jan 30, 2025",
      upcomingAppointment: "Mar 8, 2025"
    },
    {
      id: 6,
      name: "Rehan Das",
      age: 4,
      gender: "Male",
      parentName: "Priya Das",
      contact: "98987 33445",
      lastVisit: "Feb 20, 2025",
      upcomingAppointment: "Mar 9, 2025"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState<string>("");

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Patient Records</h1>
      
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search for a patient..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-white w-full border text-[#858D9D] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button 
          className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium"
          onClick={() => console.log("Export patient list")}
        >
          <FileText className="w-5 h-5" />
          Export Patient List
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
          <h2 className="text-xl font-semibold text-[#1E437A]">All Patients</h2>
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
            onClick={() => console.log("Open filters")}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="">
              <tr className="text-left text-[#1E437A] bg-[#F9F9FC] h-12">
                <th className="pb-3 font-medium">Patient Name</th>
                <th className="pb-3 font-medium">Age</th>
                <th className="pb-3 font-medium">Gender</th>
                <th className="pb-3 font-medium">Parent Name</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium">Last Visit</th>
                <th className="pb-3 font-medium">Upcoming Appointment</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b">
                  <td className="py-4 text-[#456696]">{patient.name}</td>
                  <td className="py-4 text-[#456696]">{patient.age}</td>
                  <td className="py-4 text-[#456696]">{patient.gender}</td>
                  <td className="py-4 text-[#456696]">{patient.parentName}</td>
                  <td className="py-4 text-[#456696]">{patient.contact}</td>
                  <td className="py-4 text-[#456696]">{patient.lastVisit}</td>
                  <td className="py-4 text-[#456696]">{patient.upcomingAppointment}</td>
                  <td className="py-4">
                    <div className="flex gap-3">
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <button 
                          className="p-2 bg-blue-50 text-blue-600 rounded-md"
                          aria-label="View patient details"
                        >
                          <UserRound className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/patients/${patient.id}/edit`}>
                        <button 
                          className="p-2 bg-purple-50 text-[#C83C92] rounded-md"
                          aria-label="Edit patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/appointments/schedule/${patient.id}`}>
                        <button 
                          className="p-2 bg-green-50 text-green-600 rounded-md"
                          aria-label="Schedule appointment"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>Showing 1-6 of 6 patients</div>
          <div className="flex gap-2">
            <button 
              disabled 
              className="px-3 py-1 border rounded-md text-gray-400"
              aria-label="Previous page"
            >
              Previous
            </button>
            <button 
              className="px-3 py-1 bg-[#1E437A] text-white rounded-md"
              aria-label="Page 1"
            >
              1
            </button>
            <button 
              disabled 
              className="px-3 py-1 border rounded-md text-gray-400"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;