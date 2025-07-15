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
  }, []);
  // 

  console.log(userDetails)
  return (
    <header
      className={`transition-all duration-300 ${isOpen && userDetails ? "w-[82%] left-70" : "w-full left-0"
        } h-16 flex items-center justify-between px-6 bg-white fixed top-0 z-10 border-l-1`}
    >      {/* Left: Menu Button */}
      {/* <button className="text-gray-600 hover:text-gray-900" onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 7C3 6.44772 3.44772 6 4 6H20C20.5523 6 21 6.44772 21 7C21 7.55228 20.5523 8 20 8H4C3.44772 8 3 7.55228 3 7Z" fill="#667085" />
          <path d="M3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12Z" fill="#667085" />
          <path d="M4 16C3.44772 16 3 16.4477 3 17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17C21 16.4477 20.5523 16 20 16H4Z" fill="#667085" />
        </svg>
      </button> */}
      <h1 className='text-[#1E437A] font-bold text-2xl mr-150'>Hospital Management System</h1>



      {/* Right Section */}
      <div className="flex items-center space-x-8">

        {/* User Profile */}
        <div className="flex items-center space-x-2 cursor-pointer">
          {
            // userDetails ?
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
          // :
          // <span  className='text-black'>Login</span>
          }
        </div>
      </div>
    </header>
  );
};
export default Navbar;