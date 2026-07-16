//  import Image from "next/image";

// const UserCard = ({ type }: { type: string }) => {
  
//   return (
//     <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow dark:odd:bg-gray-800 dark:even:bg-gray-700 p-4 flex-1 min-w-[130px]">
//       <div className="flex justify-between items-center">
//         <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
//           2024/25
//         </span>
//         <Image src="/more.png" alt="" width={20} height={20} />
//       </div>
//       {/* Api call will be made to show the total count and relace 1,234 */}
//       <h1 className="text-2xl font-semibold my-4">1,234</h1> 
      
//       <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
//     </div>
//   );
// };

// export default UserCard;


"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, TOKEN } from "@/lib/api";
import { toast } from "react-hot-toast";

const UserCard = ({ type }: { type: string }) => {
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/GetPurchaseOrders/${TOKEN}`);

        if (response.data.message === "Success") {
          const count = response.data?.metadata?.totalCount ?? 0;
          setTotalCount(count);

          toast.success("Loaded successfully", { duration: 3000 });
        } else {
          const msg =
            response.data.message || "Failed. Please try again.";
          toast.error(msg, { duration: 3000 });
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Network error",
          { duration: 4000 }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow dark:odd:bg-gray-800 dark:even:bg-gray-700 p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>

      {/* Display loading or count */}
      <h1 className="text-2xl font-semibold my-4">
        {loading ? "..." : totalCount}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-500">
        {type}s
      </h2>
    </div>
  );
};

export default UserCard;


// "use client"

// import { api,  } from "@/lib/api";
// import { getCount } from "@/services/countService";
// import { endpoints, paginated } from "@/utils/apiEndPoints";
// import Image from "next/image";
// import { useEffect, useState } from "react";

// type UserCardType = "student" | "teacher" | "parent" | "staff";

// interface UserCardProps {
//   type: UserCardType;
// }

// const TOKEN = "741258"

// const UserCard = ({ type }: UserCardProps) => {
//   const [count, setCount] = useState(0);

//   useEffect(() => {
//     const loadCount = async () => {
//       // const urlMap: Record<UserCardType, string> = {
//       //   student: endpoints.students,
//       //   teacher: endpoints.teachers,
//       //   parent: endpoints.parents,
//       //   staff: endpoints.staff,
//       // };

//       // const finalUrl = paginated(urlMap[type], 1, 10);
//       // const total = await getCount(finalUrl);

//       // setCount(total);
//       try {
//         const url = endpoints.purchaseOrders(TOKEN); // 👉 /GetPurchaseOrders/9999
//         const response = await api.get(url);

//         const total = response.data?.metadata?.totalCount ?? 0;
//         setCount(total);
//       } catch (err) {
//         console.error("Failed to load purchase order count", err);
//       }
//     };

//     loadCount();
//   }, [type]);

//   return (
//     <div className="rounded-2xl bg-white p-4 flex-1 min-w-[130px] shadow-md">
//       <div className="flex justify-between items-center">
//         <span className="text-[10px] bg-gray-200 px-2 py-1 rounded-full text-green-600">
//           2024/25
//         </span>
//       </div>

//       <h1 className="text-2xl font-semibold my-4">{count}</h1>
//       <h2 className="capitalize text-sm font-medium text-gray-500">
//         {type}s
//       </h2>
//     </div>
//   );
// };

// export default UserCard;
