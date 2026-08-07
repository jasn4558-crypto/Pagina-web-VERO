"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard } from "lucide-react";

export default function AdminBackButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => router.push("/admin")}
      title="Volver al panel de administración"
      className="
        fixed bottom-6 left-6 z-50
        flex items-center gap-2
        rounded-full
        bg-stone-900 text-white
        px-4 py-3
        text-sm font-semibold
        shadow-lg
        transition-all duration-200
        hover:bg-emerald-600 hover:shadow-xl hover:scale-105
        active:scale-95
      "
    >
      <LayoutDashboard className="h-4 w-4" />
      <span>Panel Admin</span>
    </button>
  );
}
