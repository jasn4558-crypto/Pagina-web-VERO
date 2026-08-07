"use client";

import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Store } from "lucide-react";

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

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
      aria-label={isAdminRoute ? "Cambiar a vista cliente" : "Ir a vista admin"}
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
