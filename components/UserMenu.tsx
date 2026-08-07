"use client";

import { useEffect, useState } from "react";
import { User, LogIn, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCurrentUserSession, UserProfile } from "@/lib/authManager";
import UserAuthModal from "./UserAuthModal";

export default function UserMenu() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUserSession();
    setCurrentUser(user);
  }, []);

  return (
    <>
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-3.5 py-2 text-xs font-bold text-stone-800 shadow-md backdrop-blur-md transition-all hover:bg-white hover:shadow-lg active:scale-95"
          aria-label="Cuenta de Usuario"
        >
          {currentUser ? (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                {currentUser.nombre[0]?.toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate hidden sm:inline">
                {currentUser.nombre}
              </span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-emerald-600" />
              <span>Ingresar</span>
            </>
          )}
        </button>
      </div>

      <UserAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
      />
    </>
  );
}
