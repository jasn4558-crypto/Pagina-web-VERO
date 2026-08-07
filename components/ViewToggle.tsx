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
    // Verificar si hay una sesión activa de administrador en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminLoggedIn(!!session);
    });

    // Escuchar cambios de autenticación en tiempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // REGLA ABSOLUTA:
  // El botón de cambio de vista (Vista Cliente / Vista Admin) SOLO se muestra
  // si el usuario ha INICIADO SESIÓN como Administrador.
  // Sin iniciar sesión, NINGUNA vista (ni web ni app) muestra la opción de cambiar.
  if (!isAdminLoggedIn) {
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
