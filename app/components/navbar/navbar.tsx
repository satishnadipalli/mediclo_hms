"use client"
import type React from "react"

import { useEffect, useState } from "react"
import { ChevronDown, LogOut, User, Briefcase, Menu } from "lucide-react"
import { useRouter } from "next/navigation" // Import useRouter for navigation

interface NavbarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}



const Navbar: React.FC<NavbarProps> = ({ isOpen, setIsOpen, userDetails, setUserDetails }) => {

  const router = useRouter()
  const [showProfilePopup, setShowProfilePopup] = useState(false)

  // Load user from localStorage on client side
  useEffect(() => {
    const storedUser = localStorage.getItem("receptionDetails")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUserDetails(parsedUser)
      } catch (err) {
        console.error("Error parsing receptionDetails from localStorage", err)
        localStorage.removeItem("receptionDetails") // Clean bad data
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("receptionDetails")
    localStorage.removeItem("receptionToken") // Add this line to remove the receptionToken
    setUserDetails(null)
    setShowProfilePopup(false)
    setIsOpen(false);
    router.push("/login");
  }

  return (
    <header
      className={`transition-all duration-300 ${
        isOpen && userDetails ? "w-[calc(100%-280px)] ml-[280px]" : "w-full ml-0"
      } h-16 flex items-center justify-between px-6 bg-white fixed top-0 z-10 border-b border-gray-200 z-50`}
    >
      
      
      <h1 className="text-[#1E437A] font-bold text-2xl flex items-center gap-10"> <div onClick={()=>setIsOpen(prev=>!prev)}><Menu color="purple"/></div> Hospital Management System</h1>
      <div className="flex items-center space-x-8 relative">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowProfilePopup(!showProfilePopup)}
        >
          <div className="p-3 h-9 w-9 flex items-center justify-center rounded-full text-white bg-blue-500">
            {userDetails?.firstName?.substring(0, 2)?.toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col">
            {userDetails ? (
              <>
                <span className="text-sm font-semibold text-[#1A1C21]">{userDetails?.firstName?.toUpperCase()}</span>
                <span className="text-xs font-semibold text-[#667085]">{userDetails?.role?.toUpperCase()}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[#1A1C21]">{"Login"}</span>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-[#667085] transition-transform ${showProfilePopup ? "rotate-180" : ""}`}
          />
        </div>

        {showProfilePopup && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-white shadow-lg z-20">
            <div className="p-2">
              <div className="flex items-center gap-2 p-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                <span>{userDetails?.firstName || "Guest"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 text-sm font-medium text-gray-700">
                <Briefcase className="h-4 w-4" />
                <span>{userDetails?.role || "N/A"}</span>
              </div>
              <div className="my-1 h-px bg-gray-200" /> {/* Separator */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
