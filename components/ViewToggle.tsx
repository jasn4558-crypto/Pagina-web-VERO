"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    // Detectar si se está ejecutando desde la aplicación móvil nativa (Capacitor)
    const checkNative =
      typeof window !== "undefined" &&
      !!(window as any).Capacitor?.isNativePlatform();
    setIsNativeApp(checkNative);

    // Si es la aplicación móvil y entra a /, redirigir automáticamente a /admin
    if (checkNative && pathname === "/") {
      router.replace("/admin");
    }

    // Verificar sesión de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Mostrar si el admin tiene sesión activa O si es la aplicación móvil
  if (!isAdmin && !isNativeApp) return null;

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
      aria-label={isAdminRoute ? "Cambiar a vista cliente" : "Cambiar a vista admin"}
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
