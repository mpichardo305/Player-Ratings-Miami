"use client";

import { useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Layout from "../layout";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      await supabase.auth.signOut();
      localStorage.clear(); // ✅ Clears cached session data
      router.replace("/");  // ✅ Redirect safely
    };

    handleLogout();
  }, [router]);

  return (
    
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="flex flex-col items-center bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
        <h1 className="text-2xl font-semibold mt-4">Logging Out...</h1>
        <p className="text-gray-400 mt-2 text-sm">Please wait while we sign you out.</p>
      </div>
    </div>
  
  );
}