"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search, Calendar, Plus, RefreshCw, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import filter from '@/public/filter.svg'
const EyeIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.25 5.61C6.27 8.2 10 13 10 13V18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18V13C14 13 17.72 8.2 19.74 5.61C20.25 4.95 19.78 4 18.95 4H5.04C4.21 4 3.74 4.95 4.25 5.61Z" fill="currentColor"/>
  </svg>
);

const RescheduleAppointmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (data: { newDate: string; newTime: string; reason: string }) => void;
}> = ({ isOpen, onClose, onReschedule }) => {
  const [formData, setFormData] = useState({
    newDate: "",
    newTime: "",
    reason: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onReschedule(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-gray-100 bg-opacity-30 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#1E437A] mb-6">Reschedule Appointment</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[#1E437A] mb-2" htmlFor="newDate">
                      New Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="newDate"
                        name="newDate"
                        value={formData.newDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-50 text-gray-700 pr-10"
                        placeholder="Select new date"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[#1E437A] mb-2" htmlFor="newTime">
                      New Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        id="newTime"
                        name="newTime"
                        value={formData.newTime}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-50 text-gray-700 pr-10"
                        placeholder="Select new time"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-[#1E437A] mb-2" htmlFor="reason">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-50 text-gray-700 min-h-32"
                    placeholder=""
                  />
                </div>
                
                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="submit"
                    className="bg-[#C83C92] text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#F24E1E] text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// HandoverAppointmentModal Component with Checkboxes
const HandoverAppointmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patientName: string | null;
  onConfirm: (data: { doctor: string; reason: string }) => void;
}> = ({ isOpen, onClose, patientName, onConfirm }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm({
      doctor: selectedDoctor,
      reason: reason
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-gray-100 bg-opacity-30 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#1E437A] mb-6">Handover Appointment</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h3 className="text-[#1E437A] font-medium mb-4">Select New Doctor</h3>
                  
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center p-4 border-b">
                      <div className="font-medium text-[#1E437A]">Doctor Name</div>
                      <div className="font-medium text-[#1E437A]">Next Available Slot</div>
                    </div>
                    
                    <div className="border-b p-4 flex justify-between items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="doctor"
                          value="Dr. Parul Diwan"
                          checked={selectedDoctor === "Dr. Parul Diwan"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDoctor(e.target.value);
                            } else {
                              setSelectedDoctor("");
                            }
                          }}
                          className="mr-2 h-4 w-4 text-[#C83C92] rounded border-gray-300 focus:ring-[#C83C92]"
                        />
                        <span className="text-[#1E437A]">Dr. Parul Diwan</span>
                      </label>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        Available Now
                      </span>
                    </div>
                    
                    <div className="p-4 flex justify-between items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="doctor"
                          value="Dr. Rohan Mehta"
                          checked={selectedDoctor === "Dr. Rohan Mehta"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDoctor(e.target.value);
                            } else {
                              setSelectedDoctor("");
                            }
                          }}
                          className="mr-2 h-4 w-4 text-[#C83C92] rounded border-gray-300 focus:ring-[#C83C92]"
                        />
                        <span className="text-[#1E437A]">Dr. Rohan Mehta</span>
                      </label>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        Available at 3:00 PM
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-[#1E437A] mb-2" htmlFor="reason">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-50 text-gray-700"
                    placeholder="Enter reason for handover..."
                    rows={6}
                  />
                </div>
                
                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="submit"
                    className="bg-[#C83C92] text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#F24E1E] text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Dashboard Component
interface Appointment {
  id: number;
  time: string;
  patientName: string;
  primaryConcern: string;
  status: string;
}

const DoctorsDashboard: React.FC = () => {
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sample appointments data
  const appointments: Appointment[] = [
    {
      id: 1,
      time: "10:00 AM",
      patientName: "Aarav Sharma",
      primaryConcern: "Speech Delay",
      status: "Completed"
    },
    {
      id: 2,
      time: "11:30 AM",
      patientName: "Kiara Joshi",
      primaryConcern: "Autism",
      status: "Completed"
    },
    {
      id: 3, 
      time: "02:00 PM",
      patientName: "Rohan Gupta",
      primaryConcern: "ADHD",
      status: "Pending"
    },
    {
      id: 4,
      time: "03:30 PM",
      patientName: "Kabir Mehta",
      primaryConcern: "Sensory Processing",
      status: "Pending"
    }
  ];

  // Filter appointments based on search term
  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    
    const searchTermLower = searchTerm.toLowerCase();
    return appointments.filter(appointment => {
      return (
        appointment.patientName.toLowerCase().includes(searchTermLower) ||
        appointment.primaryConcern.toLowerCase().includes(searchTermLower) ||
        appointment.time.toLowerCase().includes(searchTermLower) ||
        appointment.status.toLowerCase().includes(searchTermLower)
      );
    });
  }, [searchTerm, appointments]);

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const openHandoverModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsHandoverModalOpen(true);
  };

  const handleReschedule = (formData: { newDate: string; newTime: string; reason: string }) => {
    console.log("Rescheduling appointment:", selectedAppointment);
    console.log("New details:", formData);
    // Here you would update the appointment in your database
  };

  const handleHandover = (formData: { doctor: string; reason: string }) => {
    console.log("Handing over appointment:", selectedAppointment);
    console.log("Handover details:", formData);
    // Here you would update the appointment in your database
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-[170px] mx-auto overflow-y-auto hide-scrollbar">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#1E437A] mb-6">Hello, Doctor!</h1>
      
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-3 py-2 w-full border bg-gray-50 text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92]"
            placeholder="Search for a patient..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium">
            <Calendar className="w-5 h-5" />
            Schedule an Appointment
          </button>
          <button className="flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium">
            <Plus className="w-5 h-5" />
            Register New Patient
          </button>
        </div>
      </div>
      
      {/* Appointments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-[#1E437A]">Today's Appointments</h2>
          {/* <button className="flex items-center gap-1 text-gray-500 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
            <Image src={filter} width={15} height={15} alt=""></Image>
            <span>Filters</span>
          </button> */}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-3 px-4 font-medium text-[#1E437A]">Time</th>
                <th className="py-3 px-4 font-medium text-[#1E437A]">Patient Name</th>
                <th className="py-3 px-4 font-medium text-[#1E437A]">Primary Concern</th>
                <th className="py-3 px-4 font-medium text-[#1E437A]">Status</th>
                <th className="py-3 px-4 font-medium text-[#1E437A] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">{appointment.time}</td>
                    <td className="py-4 px-4">
                      <button 
                        className="text-[#245BA7] font-medium hover:underline focus:outline-none"
                        onClick={() => openHandoverModal(appointment)}
                      >
                        {appointment.patientName}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{appointment.primaryConcern}</td>
                    <td className="py-4 px-4">
                      <span 
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          appointment.status === "Completed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-gray-500 hover:text-[#245BA7]">
                          <EyeIcon />
                        </button>
                        <button 
                          className="p-1 text-gray-500 hover:text-[#245BA7]"
                          onClick={() => openRescheduleModal(appointment)}
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                        <button 
                          className="p-1 text-gray-500 hover:text-[#245BA7]"
                          onClick={() => openRescheduleModal(appointment)}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No appointments found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RescheduleAppointmentModal 
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onReschedule={handleReschedule}
      />
      
      <HandoverAppointmentModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        patientName={selectedAppointment ? selectedAppointment.patientName : null}
        onConfirm={handleHandover}
      />
    </div>
  );
};

export default DoctorsDashboard;