"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/SensesLogo.png";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PatientsIcon from '../../../public/PatientsIcon.svg'
import AppointmentsIcon from '../../../public/AppointmentsIcon.svg'
import ConsultationsIcon from '../../../public/ConsultationsIcon.svg' // You'll need to create this icon

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Get user role from token
    const getUserRole = () => {
      // This is where you'll get the role from your authentication token
      const token = localStorage.getItem("authToken");
      
      if (token) {
        try {
          // Decode token (this depends on how your token is structured)
          // For JWT, you might use jwt_decode or a similar library
          const userData = JSON.parse(atob(token.split('.')[1]));
          setUserRole(userData.role);
        } catch (error) {
          console.error("Error parsing auth token:", error);
          setUserRole("");
        }
      }
    };
    
    getUserRole();
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const getSvgColor = (tab: string) => {
    return activeTab === tab ? "#FFFFFF" : "#456696";
  };

  return (
    <aside 
      className={`w-70 h-screen px-4 py-6 fixed bg-white flex flex-col transition-all duration-300 ${
        isOpen ? "left-0" : " -left-72"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <Image src={logo} alt="8Senses Logo" className="h-15" />
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <nav>
          <ul className="space-y-3">
            {/* Dashboard */}
            <li
              className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                activeTab === "Dashboard" ? "bg-[#C83C92] text-white" : "text-[#456696]"
              }`}
              onClick={() => handleTabClick("Dashboard")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3 5.5C3 4.11929 4.11929 3 5.5 3H8.5C9.88071 3 11 4.11929 11 5.5V8.5C11 9.88071 9.88071 11 8.5 11H5.5C4.11929 11 3 9.88071 3 8.5V5.5ZM5.5 5H8.5C8.77614 5 9 5.22386 9 5.5V8.5C9 8.77614 8.77614 9 8.5 9H5.5C5.22386 9 5 8.77614 5 8.5V5.5C5 5.22386 5.22386 5 5.5 5Z"
                  fill={getSvgColor("Dashboard")}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13 5.5C13 4.11929 14.1193 3 15.5 3H18.5C19.8807 3 21 4.11929 21 5.5V8.5C21 9.88071 19.8807 11 18.5 11H15.5C14.1193 11 13 9.88071 13 8.5V5.5ZM15.5 5H18.5C18.7761 5 19 5.22386 19 5.5V8.5C19 8.77614 18.7761 9 18.5 9H15.5C15.2239 9 15 8.77614 15 8.5V5.5C15 5.22386 15.2239 5 15.5 5Z"
                  fill={getSvgColor("Dashboard")}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.5 13C14.1193 13 13 14.1193 13 15.5V18.5C13 19.8807 14.1193 21 15.5 21H18.5C19.8807 21 21 19.8807 21 18.5V15.5C21 14.1193 19.8807 13 18.5 13H15.5ZM18.5 15H15.5C15.2239 15 15 15.2239 15 15.5V18.5C15 18.7761 15.2239 19 15.5 19H18.5C18.7761 19 19 18.7761 19 18.5V15.5C19 15.2239 18.7761 15 18.5 15Z"
                  fill={getSvgColor("Dashboard")}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3 15.5C3 14.1193 4.11929 13 5.5 13H8.5C9.88071 13 11 14.1193 11 15.5V18.5C11 19.8807 9.88071 21 8.5 21H5.5C4.11929 21 3 19.8807 3 18.5V15.5ZM5.5 15H8.5C8.77614 15 9 15.2239 9 15.5V18.5C9 18.7761 8.77614 19 8.5 19H5.5C5.22386 19 5 18.7761 5 18.5V15.5C5 15.2239 5.22386 15 5.5 15Z"
                  fill={getSvgColor("Dashboard")}
                />
              </svg>
              <Link href={'/dashboard'}><span>Dashboard</span></Link>
            </li>

            {/* Patients */}
            <li
              className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                activeTab === "Patients" ? "bg-[#C83C92] text-white" : "text-[#456696]"
              }`}
              onClick={() => handleTabClick("Patients")}
            >
            <Image 
                src={PatientsIcon}
                width={24}
                height={24}
                alt="Patients icon"
                className={activeTab === "Patients" ? "text-white" : "text-[#456696]"}
            />
            <Link href={'/patients'}><span>Patients</span></Link>
            </li>

            {/* Appointments */}
            <li
              className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                activeTab === "Appointments" ? "bg-[#C83C92] text-white" : "text-[#456696]"
              }`}
              onClick={() => handleTabClick("Appointments")}
            >
              <Image 
                src={AppointmentsIcon}
                width={24}
                height={24}
                alt="Appointments icon"
                className={activeTab === "Appointments" ? "text-white" : "text-[#456696]"}
              />
              <Link href={'/appointments'}><span>Appointments</span></Link>
            </li>

            {/* Consultations - Only shown for doctors */}
            {userRole === "doctor" && (
              <li
                className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                  activeTab === "Consultations" ? "bg-[#C83C92] text-white" : "text-[#456696]"
                }`}
                onClick={() => handleTabClick("Consultations")}
              >
                {/* You'll need to create or import this icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4ZM6 4H18V20H6V4Z"
                    fill={getSvgColor("Consultations")}
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 10C8 9.44772 8.44772 9 9 9H15C15.5523 9 16 9.44772 16 10C16 10.5523 15.5523 11 15 11H9C8.44772 11 8 10.5523 8 10Z"
                    fill={getSvgColor("Consultations")}
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 14C8 13.4477 8.44772 13 9 13H15C15.5523 13 16 13.4477 16 14C16 14.5523 15.5523 15 15 15H9C8.44772 15 8 14.5523 8 14Z"
                    fill={getSvgColor("Consultations")}
                  />
                </svg>
                <Link href={'/consultations'}><span>Consultations</span></Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      
      {/* Fixed Bottom Section */}
      <div className="py-4 font-bold -mb-5">
        <ul>
          {/* Support */}
          <li>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-[#667085] hover:bg-gray-200 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11V19C21 20.6569 19.6569 22 18 22H17C15.3431 22 14 20.6569 14 19V16C14 14.3431 15.3431 13 17 13H18C18.3506 13 18.6872 13.0602 19 13.1707V11C19 7.13401 15.866 4 12 4C8.13401 4 5 7.13401 5 11V13.1707C5.31278 13.0602 5.64936 13 6 13H7C8.65685 13 10 14.3431 10 16V19C10 20.6569 8.65685 22 7 22H6C4.34315 22 3 20.6569 3 19V11ZM19 16C19 15.4477 18.5523 15 18 15H17C16.4477 15 16 15.4477 16 16V19C16 19.5523 16.4477 20 17 20H18C18.5523 20 19 19.5523 19 19V16ZM5 19V16C5 15.4477 5.44772 15 6 15H7C7.55228 15 8 15.4477 8 16V19C8 19.5523 7.55228 20 7 20H6C5.44772 20 5 19.5523 5 19Z"
                  fill="#667085"
                />
              </svg>
              <span>Support</span>
            </button>
          </li>

          {/* Settings */}
          <li>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-[#667085] hover:bg-gray-200 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12ZM14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
                  fill="#667085"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.51026 13.4144L4.16603 13.0204C4.12293 12.6863 4.1007 12.3458 4.1007 12C4.1007 11.6543 4.12292 11.3137 4.16602 10.9797L3.51163 10.5866C2.56483 10.0177 2.25848 8.78894 2.82737 7.84214L4.0201 5.85712C4.58899 4.91032 5.8177 4.60397 6.7645 5.17286L7.41911 5.56619C7.86036 5.25176 8.33533 4.9816 8.83754 4.76217V4C8.83754 2.89543 9.73297 2 10.8375 2H13.1533C14.2579 2 15.1533 2.89543 15.1533 4V4.76217C15.6556 4.98161 16.1305 5.25178 16.5718 5.56622L17.2279 5.17199C18.1747 4.6031 19.4034 4.90945 19.9723 5.85625L21.165 7.84127C21.7339 8.78807 21.4276 10.0168 20.4808 10.5857L19.8249 10.9798C19.868 11.3138 19.8902 11.6543 19.8902 12C19.8902 12.3457 19.868 12.6863 19.8249 13.0203L20.4792 13.4135C21.426 13.9824 21.7324 15.2111 21.1635 16.1579L19.9708 18.1429C19.4019 19.0897 18.1732 19.3961 17.2264 18.8272L16.5717 18.4338C16.1305 18.7483 15.6555 19.0184 15.1533 19.2378V20C15.1533 21.1046 14.2579 22 13.1533 22H10.8375C9.73297 22 8.83754 21.1046 8.83754 20V19.2378C8.33536 19.0184 7.86042 18.7483 7.4192 18.4339L6.76314 18.8281C5.81634 19.397 4.58762 19.0906 4.01873 18.1438L2.82601 16.1588C2.25711 15.212 2.56346 13.9833 3.51026 13.4144ZM9.63829 6.59488L10.8375 6.0709V4L13.1533 4V6.0709L14.3526 6.59488C14.7268 6.75839 15.0813 6.95997 15.4112 7.195L16.4785 7.95556L18.258 6.88633L19.4507 8.87135L17.674 9.93891L17.8413 11.2357C17.8735 11.4851 17.8902 11.7401 17.8902 12C17.8902 12.2599 17.8735 12.515 17.8413 12.7644L17.674 14.0612L19.4492 15.1278L18.2565 17.1129L16.4784 16.0445L15.4111 16.805C15.0813 17.0401 14.7268 17.2416 14.3526 17.4051L13.1533 17.9291V20H10.8375V17.9291L9.63829 17.4051C9.26408 17.2416 8.9096 17.0401 8.5798 16.8051L7.51249 16.0446L5.73306 17.1137L4.54034 15.1287L6.31694 14.0612L6.14959 12.7644C6.11741 12.515 6.1007 12.26 6.1007 12C6.1007 11.7401 6.1174 11.485 6.14958 11.2357L6.31691 9.93886L4.54171 8.87221L5.73443 6.88719L7.51242 7.95552L8.57974 7.19497C8.90956 6.95995 9.26406 6.75839 9.63829 6.59488Z"
                  fill="#667085"
                />
              </svg>
              <span>Setting</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;