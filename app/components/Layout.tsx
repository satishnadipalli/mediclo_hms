"use client"
import React, { useEffect, useState } from "react";
import Navbar from "./navbar/navbar";
import Sidebar from "./sidebar/sidebar";
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true); // Sidebar state
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  
    // Load user from localStorage on client side
    useEffect(() => {
      const storedUser = localStorage.getItem('receptionDetails');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserDetails(parsedUser);
          console.log("Parsed user from localStorage:", parsedUser);
        } catch (err) {
          console.error("Error parsing receptionDetails from localStorage", err);
          localStorage.removeItem('receptionDetails'); // Clean bad data
        }
      }
    }, []);

  
  return (
    <div className="flex">
      {/* Sidebar Component */}
      {
      userDetails && 
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      }
      <div className="flex-1">
        {/* Navbar Component */}
        
          <Navbar isOpen={isOpen} setIsOpen={setIsOpen}  userDetails={userDetails}/>
        
        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
