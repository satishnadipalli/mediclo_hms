"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import logo from "@/public/SensesLogo.png"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutGrid, Users, CalendarCheck, ClipboardList } from "lucide-react" // Importing Lucide React icons

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("Dashboard")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const getUserRole = () => {
      const token = localStorage.getItem("authToken")
      if (token) {
        try {
          const userData = JSON.parse(atob(token.split(".")[1]))
          setUserRole(userData.role)
        } catch (error) {
          console.error("Error parsing auth token:", error)
          setUserRole("")
        }
      }
    }
    getUserRole()
  }, [])

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <aside
      className={`fixed flex h-screen w-70 flex-col bg-white px-4 py-6 transition-all duration-300 ${
        isOpen ? "left-0" : "-left-70" // Adjust this based on your actual sidebar width
      }`}
    >
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center">
        <Image src={logo || "/placeholder.svg"} alt="8Senses Logo" className="h-15" />
      </div>
      {/* Scrollable Navigation */}
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <nav>
          <ul className="space-y-3">
            {/* Dashboard */}
            <Link href={"/dashboard"}>
              <li
                className={`flex cursor-pointer items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                  activeTab === "Dashboard" ? "bg-[#C83C92] text-white" : "text-[#456696] hover:bg-gray-100"
                }`}
                onClick={() => handleTabClick("Dashboard")}
              >
                <LayoutGrid className="h-6 w-6" /> {/* Lucide icon */}
                <span>Dashboard</span>
              </li>
            </Link>
            {/* Patients */}
            <Link href={"/patients"}>
              <li
                className={`flex cursor-pointer items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                  activeTab === "Patients" ? "bg-[#C83C92] text-white" : "text-[#456696] hover:bg-gray-100"
                }`}
                onClick={() => handleTabClick("Patients")}
              >
                <Users className="h-6 w-6" /> {/* Lucide icon */}
                <span>Patients</span>
              </li>
            </Link>
            {/* Appointments */}
            <Link href={"/appointments"}>
              <li
                className={`flex cursor-pointer items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                  activeTab === "Appointments" ? "bg-[#C83C92] text-white" : "text-[#456696] hover:bg-gray-100"
                }`}
                onClick={() => handleTabClick("Appointments")}
              >
                <CalendarCheck className="h-6 w-6" /> {/* Lucide icon */}
                <span>Appointments</span>
              </li>
            </Link>
            {/* Consultations - Only shown for doctors */}
            {userRole === "doctor" && (
              <Link href={"/consultations"}>
                <li
                  className={`flex cursor-pointer items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                    activeTab === "Consultations" ? "bg-[#C83C92] text-white" : "text-[#456696] hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabClick("Consultations")}
                >
                  <ClipboardList className="h-6 w-6" /> {/* Lucide icon */}
                  <span>Consultations</span>
                </li>
              </Link>
            )}
          </ul>
        </nav>
      </div>
      {/* Fixed Bottom Section */}
      <div className="py-4 font-bold -mb-5">
        <ul>
          {/* Support */}
          {/* Settings */}
          <li>{/* You can add settings/support links here if needed */}</li>
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar
