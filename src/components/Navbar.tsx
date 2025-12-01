// import Image from "next/image"

// const Navbar = () => {
//   return (
//     <div className='flex items-center justify-between p-4'>
//       {/* SEARCH BAR */}
//       <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
//         <Image src="/search.png" alt="" width={14} height={14}/>
//         <input type="text" placeholder="Search..." className="w-[200px] p-2 bg-transparent outline-none"/>
//       </div>
//       {/* ICONS AND USER */}
//       <div className='flex items-center gap-6 justify-end w-full'>
//         <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
//           <Image src="/message.png" alt="" width={20} height={20}/>
//         </div>
//         <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'>
//           <Image src="/announcement.png" alt="" width={20} height={20}/>
//           <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
//         </div>
//         <div className='flex flex-col'>
//           <span className="text-xs leading-3 font-medium">John Doe</span>
//           <span className="text-[10px] text-gray-500 text-right">Admin</span>
//         </div>
//         <Image src="/avatar.png" alt="" width={36} height={36} className="rounded-full"/>
//       </div>
//     </div>
//   )
// }

// export default Navbar

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  extractRoleFromUserId, 
  formatUserName, 
  getUserInitials,
  retrieveUserData 
} from '@/utils/userUtils';

const Navbar = () => {
  const [userInfo, setUserInfo] = useState({
    userId: "",
    displayName: "Loading...",
    role: "User",
    initials: "U"
  });

  // Fetch user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        // Option 1: Get from localStorage (from login)
        const storedUserData = retrieveUserData();
        
        if (storedUserData) {
          setUserInfo({
            userId: storedUserData.userId,
            displayName: formatUserName(storedUserData.userId),
            role: extractRoleFromUserId(storedUserData.userId),
            initials: getUserInitials(formatUserName(storedUserData.userId))
          });
          return;
        }

        // Option 2: Get userId directly from localStorage
        const userId = localStorage.getItem("userId");
        if (userId) {
          setUserInfo({
            userId,
            displayName: formatUserName(userId),
            role: extractRoleFromUserId(userId),
            initials: getUserInitials(formatUserName(userId))
          });
          return;
        }

        // Option 3: Make API call to get current user
        fetchCurrentUser();
        
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserInfo({
          userId: "",
          displayName: "Guest User",
          role: "Guest",
          initials: "G"
        });
      }
    };

    loadUserData();

    // Listen for login/logout events
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Optional: API call to get current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // Make API call to get user details
      // const response = await api.get("/api/GetCurrentUser");
      // if (response.data.userId) {
      //   const userId = response.data.userId;
      //   // Update state...
      // }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  return (
    <div className='flex items-center justify-between p-4'>
      {/* SEARCH BAR */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <Image src="/search.png" alt="Search" width={14} height={14}/>
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      
      {/* ICONS AND USER */}
      <div className='flex items-center gap-6 justify-end w-full'>
        {/* Messages */}
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors'>
          <Image src="/message.png" alt="Messages" width={20} height={20}/>
        </div>
        
        {/* Announcements */}
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative'>
          <Image src="/announcement.png" alt="Announcements" width={20} height={20}/>
          <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
        </div>
        
        {/* Dynamic User Info */}
        <div className='flex flex-col items-end'>
          <span className="text-xs leading-3 font-medium">
            {userInfo.displayName}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {userInfo.role}
          </span>
        </div>
        
        {/* Dynamic Avatar */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {userInfo.initials}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;