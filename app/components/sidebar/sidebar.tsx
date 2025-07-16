"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/SensesLogo.png";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PatientsIcon from "../../../public/PatientsIcon.svg";
import AppointmentsIcon from "../../../public/AppointmentsIcon.svg";
//import ConsultationsIcon from "../../../public/ConsultationsIcon.svg";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const getUserRole = () => {
      const token = localStorage.getItem("authToken");

      if (token) {
        try {
          const userData = JSON.parse(atob(token.split(".")[1]));
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
        isOpen && "left-0"
      }`}
    >
      <div className="flex items-center justify-center mb-6">
        <Image src={logo} alt="8Senses Logo" className="h-15" />
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <nav>
          <ul className="space-y-3">
            {/* Dashboard */}
            <Link href="/dashboard">
              <li
                className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                  activeTab === "Dashboard"
                    ? "bg-[#C83C92] text-white"
                    : "text-[#456696]"
                }`}
                onClick={() => handleTabClick("Dashboard")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                <span>Dashboard</span>
              </li>
            </Link>

            {/* Patients */}
            <Link href="/patients">
              <li
                className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                  activeTab === "Patients"
                    ? "bg-[#C83C92] text-white"
                    : "text-[#456696]"
                }`}
                onClick={() => handleTabClick("Patients")}
              >
                <Image
                  src={PatientsIcon}
                  width={24}
                  height={24}
                  alt="Patients icon"
                />
                <span>Patients</span>
              </li>
            </Link>

            {/* Appointments */}
            <Link href="/appointments">
              <li
                className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                  activeTab === "Appointments"
                    ? "bg-[#C83C92] text-white"
                    : "text-[#456696]"
                }`}
                onClick={() => handleTabClick("Appointments")}
              >
                <Image
                  src={AppointmentsIcon}
                  width={24}
                  height={24}
                  alt="Appointments icon"
                />
                <span>Appointments</span>
              </li>
            </Link>

            {/* Consultations - for doctor only */}
            {userRole === "doctor" && (
              <Link href="/consultations">
                <li
                  className={`flex items-center space-x-3 ml-0.5 px-4 py-3 rounded-lg cursor-pointer ${
                    activeTab === "Consultations"
                      ? "bg-[#C83C92] text-white"
                      : "text-[#456696]"
                  }`}
                  onClick={() => handleTabClick("Consultations")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
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
                  <span>Consultations</span>
                </li>
              </Link>
            )}
          </ul>
        </nav>
      </div>

      <div className="py-4 font-bold -mb-5">
        {/* You can add footer items here */}
      </div>
    </aside>
  );
};

export default Sidebar;
