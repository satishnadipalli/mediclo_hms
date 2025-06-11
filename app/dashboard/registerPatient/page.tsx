"use client"
import React, { useState } from "react";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";

const PatientRegistrationForm = () => {
  const [formData, setFormData] = useState({
    childName: "",
    motherName: "",
    fatherName: "",
    contactNumber: "",
    emailAddress: "",
    childAge: "",
    serviceType: "",
    preferredDate: "",
    paymentMethod: "",
    specialNeeds: "",
    consentChecked: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log("Form submitted:", formData);
  };

  return (
    <div className="p-6 max-w-[84%] mt-15 ml-70 mx-auto overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="-mb-10">
        <div className="flex items-center text-blue-700 mb-2">
          <ChevronLeft className="w-5 h-5" />
          <a href="#" className="font-medium">Back</a>
        </div>
        <h1 className="text-2xl font-bold text-[#245BA7]">Register New Patient</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span className="text-[#245BA7]">Dashboard</span>
          <span className="mx-2">›</span>
          <span>Register New Patient</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mb-6">
        <div></div> {/* Empty div for spacing */}
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#C83C921A] text-[#C83C92] px-4 py-2 rounded-lg font-medium">
            <span className="text-[#C83C92]">+</span> Register for Later
          </button>
          <Link href={'/dashboard/scheduleAppointment'}><button className="flex cursor-pointer items-center gap-2 bg-[#C83C92] text-white px-4 py-2 rounded-lg font-medium" type="submit">
            <Calendar className="w-5 h-5" />
            Register & Schedule an Appointment
          </button></Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1E437A] mb-4">Patient Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="childName">
                Child's Name*
              </label>
              <input
                type="text"
                id="childName"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter child's full name"
              />
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="childAge">
                Child's Age*
              </label>
              <input
                type="number"
                id="childAge"
                name="childAge"
                value={formData.childAge}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter age in years"
                min="0"
                max="18"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="motherName">
                Mother's Name*
              </label>
              <input
                type="text"
                id="motherName"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter mother's full name"
              />
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="fatherName">
                Father's Name*
              </label>
              <input
                type="text"
                id="fatherName"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter father's full name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="contactNumber">
                Contact Number*
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter contact number"
              />
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="emailAddress">
                Email Address*
              </label>
              <input
                type="email"
                id="emailAddress"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="serviceType">
                Service Type*
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
              >
                <option value="">Select service</option>
                <option value="initialAssessment">Initial Assessment</option>
                <option value="followUp">Follow Up</option>
                <option value="therapySession">Therapy Session</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="preferredDate">
                Preferred Date*
              </label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="paymentMethod">
                Payment Method*
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
              >
                <option value="">Select payment method</option>
                {/* <option value="creditDebit">Credit/Debit Card</option> */}
                <option value="cash">Cash</option>
                <option value="insurance">UPI</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#1E437A] mb-2" htmlFor="specialNeeds">
                Special Needs or Considerations
              </label>
              <input
                type="text"
                id="specialNeeds"
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C83C92] bg-gray-100 text-[#858D9D]"
                placeholder="Any special requirements or notes"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="consentChecked"
                checked={formData.consentChecked}
                onChange={handleInputChange}
                required
                className="h-5 w-5 focus:ring-[#C83C92] border-gray-300 rounded"
              />
              <span className="ml-2 text-[#1E437A]">
                I consent to the treatment and privacy policy*
              </span>
            </label>
          </div>
        </div>

      </form>
    </div>
  );
};

export default PatientRegistrationForm;