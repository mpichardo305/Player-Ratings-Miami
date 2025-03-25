"use client";

import { useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm bg-card">
        <CardContent className="flex flex-col items-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold mt-4 text-card-foreground">
            Logging Out...
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Please wait while we sign you out.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}