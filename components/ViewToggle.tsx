"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    // Verificar si el usuario tiene una sesión activa de administrador
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminLoggedIn(!!session);
    });

    // Escuchar cambios en el estado de autenticación (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // REGLA FUNDAMENTAL:
  // Si el usuario está en la vista de cliente (/) Y NO ha iniciado sesión como administrador,
  // NO se muestra NINGÚN botón. Los clientes normales no deben ver ningún indicio del panel admin.
  if (!isAdminRoute && !isAdminLoggedIn) {
    return null;
  }

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
      className="fixed top-3 left-3 z-[100] flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95 border border-stone-200/80"
      aria-label={isAdminRoute ? "Ver vista cliente" : "Regresar al panel admin"}
    >
      {isAdminRoute ? (
        <>
          <Store className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-stone-800 sm:text-sm">
            Vista Cliente
          </span>
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-stone-800 sm:text-sm">
            Vista Admin
          </span>
        </>
      )}
    </button>
  );
}
