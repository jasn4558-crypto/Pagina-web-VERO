"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    // Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAdmin(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Solo mostrar si hay sesión activa de admin
  if (!isAdmin) return null;

  const handleToggle = () => {
    if (isAdminRoute) {
      router.push("/");
    } else {
      router.push("/admin");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed top-3 left-3 z-[100] flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95"
      aria-label={isAdminRoute ? "Cambiar a vista cliente" : "Cambiar a vista admin"}
    >
      {isAdminRoute ? (
        <>
          <Store className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-stone-700 sm:text-sm">
            Vista Cliente
          </span>
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-semibold text-stone-700 sm:text-sm">
            Vista Admin
          </span>
        </>
      )}
    </button>
  );
}

