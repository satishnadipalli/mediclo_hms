"use client";

import NavbarAvatar from '@/public/NavbarAvatar.png';
import Image from "next/image";
import { useEffect, useState } from 'react';

interface NavbarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface UserDetails {
  firstName: string;
  role: 'therapist' | 'receptionist' | 'doctor' | string; // adjust as per your use case
}

const Navbar: React.FC<NavbarProps> = ({ isOpen, setIsOpen }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Load user from localStorage on client side
  useEffect(() => {
    const storedUser = localStorage.getItem('adminDetails');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserDetails(parsedUser);
        console.log("Parsed user from localStorage:", parsedUser);
      } catch (err) {
        console.error("Error parsing adminDetails from localStorage", err);
        localStorage.removeItem('adminDetails'); // Clean bad data
      }
    }
  }, []);

  // Log after state update (optional)
  useEffect(() => {
    if (userDetails) {
      console.log("User details updated:", userDetails);
    }
  }, [userDetails]);
  // 

  return (
    <header
      className={`transition-all duration-300 ${isOpen ? "w-[82%] left-70" : "w-full left-0"
        } h-16 flex items-center justify-between px-6 bg-white fixed top-0 z-10 border-l-1`}
    >      {/* Left: Menu Button */}
      <button className="text-gray-600 hover:text-gray-900" onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 7C3 6.44772 3.44772 6 4 6H20C20.5523 6 21 6.44772 21 7C21 7.55228 20.5523 8 20 8H4C3.44772 8 3 7.55228 3 7Z" fill="#667085" />
          <path d="M3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12Z" fill="#667085" />
          <path d="M4 16C3.44772 16 3 16.4477 3 17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17C21 16.4477 20.5523 16 20 16H4Z" fill="#667085" />
        </svg>
      </button>
      <h1 className='text-[#1E437A] font-bold text-2xl mr-150'>Hospital Management System</h1>



      {/* Right Section */}
      <div className="flex items-center space-x-8">

        {/* Notifications */}
        <div className="relative cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.57088C7.60769 4.0561 4.99997 6.97352 4.99997 10.5V15.5L4.28237 16.7558C3.71095 17.7558 4.433 19 5.58474 19H8.12602C8.57006 20.7252 10.1362 22 12 22C13.8638 22 15.4299 20.7252 15.874 19H18.4152C19.5669 19 20.289 17.7558 19.7176 16.7558L19 15.5V10.5C19 6.97354 16.3923 4.05614 13 3.57089V3ZM6.99997 16.0311L6.44633 17H17.5536L17 16.0311V10.5C17 7.73858 14.7614 5.5 12 5.5C9.23854 5.5 6.99997 7.73858 6.99997 10.5V16.0311ZM12 20C11.2597 20 10.6134 19.5978 10.2676 19H13.7324C13.3866 19.5978 12.7403 20 12 20Z" fill="#667085" />
          </svg>          <span className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold rounded-full px-1.5">
            3
          </span>
        </div>



        {/* User Profile */}
        <div className="flex items-center space-x-2 cursor-pointer">
          {
            userDetails ?
            <>
              <Image
            src={NavbarAvatar} // Replace with actual profile image
            alt="User Profile"
            width={45}
            height={45}
            className="rounded-full"
          />
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-semibold text-[#1A1C21]">{userDetails?.firstName || "lOgin"}</span>
            <span className="text-xs font-semibold text-[#667085]">{userDetails?.role || "lOgin"}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.5893 6.9107C15.2638 6.58527 14.7362 6.58527 14.4108 6.9107L10 11.3214L5.58928 6.9107C5.26384 6.58527 4.7362 6.58527 4.41077 6.9107C4.08533 7.23614 4.08533 7.76378 4.41077 8.08921L9.70539 13.3838C9.86811 13.5466 10.1319 13.5466 10.2946 13.3838L15.5893 8.08921C15.9147 7.76378 15.9147 7.23614 15.5893 6.9107Z" fill="#667085" />
          </svg>
            </>
          :
          <span  className='text-black'>Login</span>
          }
        </div>
      </div>
    </header>
  );
};
export default Navbar;