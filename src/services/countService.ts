// app/services/countService.ts

// services/countService.ts
import { api } from "@/lib/api";
import axios from "axios";

export const getCount = async (url: string): Promise<number> => {
  try {
    const res = await api.get(url);
    return res.data?.metadata?.totalCount ?? 0;
  } catch (err) {
    console.error("Count fetch failed:", err);
    return 0;
  }
};


      
