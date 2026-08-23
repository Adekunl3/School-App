"use client";

import Image from "next/image";
import { useSession } from "@/providers/SessionProvider";

const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m` : `${seconds}s`;
};

const Navbar = () => {
  const { user, username, lock, msUntilLock, keepAlive } = useSession();

  const displayName = user?.displayName || username || "Guest User";
  const role = user?.role || "User";
  const initials = user?.initials || "U";

  // Only surface the countdown once it is close enough to be useful.
  const showCountdown = msUntilLock !== null && msUntilLock <= 2 * 60 * 1000;

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="Search" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>

      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {showCountdown && (
          <button
            type="button"
            onClick={keepAlive}
            title="Stay signed in"
            className="hidden sm:inline text-[10px] text-amber-600 hover:underline dark:text-amber-400"
          >
            Locks in {formatCountdown(msUntilLock!)} — stay signed in
          </button>
        )}

        {/* Manual lock — steps away without losing the current page. */}
        <button
          type="button"
          onClick={lock}
          title="Lock session"
          aria-label="Lock session"
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Lock
        </button>

        {/* Messages */}
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
          <Image src="/message.png" alt="Messages" width={20} height={20} />
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative">
          <Image
            src="/announcement.png"
            alt="Announcements"
            width={20}
            height={20}
          />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-end">
          <span className="text-xs leading-3 font-medium">{displayName}</span>
          <span className="text-[10px] text-gray-500 text-right">{role}</span>
        </div>

        {/* Avatar */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
