"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { loginUser } from "@/lib/authManager";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(email, password);

      if (user.rol !== "admin") {
        setError("Acceso denegado. Esta cuenta no tiene permisos de administrador.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setError(err?.message || "Credenciales incorrectas.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center min-h-screen bg-stone-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Panel de Administración</h1>
          <p className="mt-1 text-xs text-stone-500">
            Ingresa tus credenciales de administrador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xs font-semibold text-stone-700">
              Correo Electrónico
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 transition-colors focus-within:border-emerald-500">
              <Mail className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jimenezquirosveronica@gmail.com"
                className="w-full bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-xs font-semibold text-stone-700">
              Contraseña
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 transition-colors focus-within:border-emerald-500">
              <Lock className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}