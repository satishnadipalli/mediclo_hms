"use client";
import React, { useState } from "react";
import { Calendar, ChevronLeft, Image as ImageIcon } from "lucide-react";

const AppointmentSchedulingPage = () => {
  const [formData, setFormData] = useState({
    doctor: "",
    appointmentDate: "",
    timeSlot: "",
    primaryConcern: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("Appointment scheduled:", formData);
  };
  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="-mb-10">
        <div className="flex items-center text-[#1E437A] mb-2">
          <ChevronLeft className="w-5 h-5" />
          <a href="#" className="font-medium">Back</a>
        </div>
        <h1 className="text-2xl font-bold text-[#245BA7]">Schedule an Appointment</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span className="text-[#1E437A]">Dashboard</span>
          <span className="mx-2">›</span>
          <span className="text-[#1E437A]">Register New Patient</span>
          <span className="mx-2">›</span>
          <span>Schedule an Appointment</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mb-6">
        <button 
          className="flex items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium"
          onClick={handleSubmit}
        >
          <Calendar className="w-5 h-5" />
          Schedule & Send Notification
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Appointment Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Appointment Information</h2>
          
          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="doctor">
              Select Doctor
            </label>
            <div className="relative">
              <select
                id="doctor"
                name="doctor"
                value={formData.doctor}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
              >
                <option value="">Select doctor</option>
                <option value="dr-smith">Dr. Smith</option>
                <option value="dr-johnson">Dr. Johnson</option>
                <option value="dr-williams">Dr. Williams</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="appointmentDate">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                  placeholder="Select appointment date"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="timeSlot">
                Available Time Slots
              </label>
              <div className="relative">
                <select
                  id="timeSlot"
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
                >
                  <option value="">Select time slot</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Medical Information</h2>
          
          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2" htmlFor="primaryConcern">
              Primary Concern
            </label>
            <div className="relative">
              <select
                id="primaryConcern"
                name="primaryConcern"
                value={formData.primaryConcern}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D] appearance-none"
              >
                <option value="">Select the primary concern</option>
                <option value="developmental">Developmental Assessment</option>
                <option value="behavioral">Behavioral Issues</option>
                <option value="speech">Speech Therapy</option>
                <option value="physical">Physical Therapy</option>
                <option value="checkup">Regular Check-up</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Media</h2>
          
          <div className="mb-4">
            <label className="block text-[#1E437A] mb-2">
              Upload Files (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-gray-500 mb-4">Upload any Medical Records, Home Play Videos, etc.</p>
                <button 
                  type="button"
                  className="bg-blue-100 text-blue-500 px-6 py-2 rounded-lg font-medium"
                >
                  Add Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AppointmentSchedulingPage;