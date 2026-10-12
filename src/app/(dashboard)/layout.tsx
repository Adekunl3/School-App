import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import SessionGate from "@/components/SessionGate";
import SessionProvider from "@/providers/SessionProvider";
import Image from "next/image";
import HomeLink from "@/components/HomeLink";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <SessionGate>
        <div className="h-screen flex overflow-hidden">
          {/* LEFT: logo stays put, only the menu scrolls */}
          <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] h-screen flex flex-col">
            <div className="shrink-0 p-4 pb-0">
              <HomeLink
                className="flex items-center justify-center lg:justify-start gap-2"
              >
                <Image src="/logo.png" alt="logo" width={32} height={32} />
                <span className="hidden lg:block font-bold">SchooL App</span>
              </HomeLink>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <Menu />
            </div>
          </div>
          {/* RIGHT */}
          <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-white dark:bg-gray-900 text-black dark:text-white h-screen overflow-y-auto overflow-x-auto flex flex-col">
            <Navbar />
            {children}
          </div>
        </div>
      </SessionGate>
    </SessionProvider>
  );
}
