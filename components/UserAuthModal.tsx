"use client";

import { useState, FormEvent } from "react";
import {
  X,
  UserCheck,
  Mail,
  Lock,
  Phone,
  User,
  CheckCircle2,
  Loader2,
  Shield,
  KeyRound,
  History,
  ShoppingBag,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  registerUser,
  loginUser,
  verifyUserCode,
  requestPasswordReset,
  resetPasswordWithCode,
  saveUserSession,
  logoutUserSession,
  UserProfile,
} from "@/lib/authManager";
import { supabase } from "@/lib/supabase";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

type Mode = "login" | "register" | "verify" | "forgot" | "reset" | "profile" | "history";

export default function UserAuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}: UserAuthModalProps) {
  const [mode, setMode] = useState<Mode>(currentUser ? "profile" : "login");

  // Form states
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  // Verification & reset code states
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetIdentifier, setResetIdentifier] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Historial de pedidos
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // ─── REGISTRO ────────────────────────────────────────────────────────────────
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await registerUser({
        nombre,
        apellido,
        email,
        password,
        telefono,
      });

      setGeneratedCode(res.verificationCode);
      saveUserSession(res.user);
      onUserChanged(res.user);

      setSuccess(`¡Cuenta creada! Código de verificación: ${res.verificationCode}`);
      setMode("verify");
    } catch (err: any) {
      setError(err?.message || "Error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFICACIÓN DE CÓDIGO ──────────────────────────────────────────────────
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await verifyUserCode(email || currentUser?.email || "", code);
      setSuccess("¡Cuenta verificada exitosamente!");
      if (currentUser) {
        onUserChanged({ ...currentUser, verificado: true });
      }
      setTimeout(() => setMode("profile"), 1000);
    } catch (err: any) {
      setError(err?.message || "Código incorrecto.");
    } finally {
      setLoading(false);
    }
  };

  // ─── INICIO DE SESIÓN ────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      onUserChanged(user);
      setSuccess(`¡Bienvenido de nuevo, ${user.nombre}!`);

      if (user.rol === "admin") {
        window.location.href = "/admin";
      } else {
        setTimeout(() => setMode("profile"), 800);
      }
    } catch (err: any) {
      setError(err?.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RECUPERAR CONTRASEÑA ────────────────────────────────────────────────────
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const codeSent = await requestPasswordReset(resetIdentifier);
      setGeneratedCode(codeSent);
      setSuccess(`Código de verificación enviado: ${codeSent}`);
      setMode("reset");
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await resetPasswordWithCode(resetIdentifier, code, newPassword);
      setSuccess("¡Contraseña restablecida exitosamente! Inicia sesión.");
      setTimeout(() => setMode("login"), 1200);
    } catch (err: any) {
      setError(err?.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // ─── CARGAR HISTORIAL DE PEDIDOS ──────────────────────────────────────────────
  const loadOrderHistory = async () => {
    if (!currentUser) return;
    setLoadingHistory(true);
    setMode("history");

    try {
      const phoneDigits = currentUser.telefono.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .or(`telefono.ilike.%${phoneDigits}%,telefono.ilike.%${currentUser.telefono}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrderHistory(data ?? []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    logoutUserSession();
    onUserChanged(null);
    setMode("login");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl transition-all animate-[slideIn_0.25s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
              <User className="h-5 w-5 text-emerald-600" />
              {mode === "login" && "Iniciar Sesión"}
              {mode === "register" && "Crear Cuenta (Costa Rica 🇨🇷)"}
              {mode === "verify" && "Verificar Cuenta"}
              {mode === "forgot" && "Recuperar Contraseña"}
              {mode === "reset" && "Restablecer Contraseña"}
              {mode === "profile" && `Mi Cuenta (${currentUser?.nombre})`}
              {mode === "history" && "Historial de Pedidos"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensajes de Alerta */}
          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
                  {error}
                </p>
              )}
              {success && (
                <p className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </p>
              )}
            </div>
          )}

          {/* ─── VISTA: LOGIN ─── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Correo Electrónico</label>
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 bg-stone-50/50">
                  <Mail className="h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Contraseña</label>
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 bg-stone-50/50">
                  <Lock className="h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => { resetMessages(); setMode("forgot"); }}
                className="self-end text-xs font-semibold text-emerald-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
              </button>

              <div className="mt-2 text-center text-xs text-stone-500">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => { resetMessages(); setMode("register"); }}
                  className="font-bold text-emerald-600 hover:underline"
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {/* ─── VISTA: REGISTRO ─── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3 p-6">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-700">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Verónica"
                    className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-700">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Mora"
                    className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">
                  Teléfono de Costa Rica (🇨🇷 8 dígitos)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 bg-stone-50/50">
                  <span className="text-xs font-bold text-emerald-700">🇨🇷 +506</span>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="88888888"
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Contraseña (Mínimo 6 caracteres)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Cuenta"}
              </button>

              <div className="mt-1 text-center text-xs text-stone-500">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => { resetMessages(); setMode("login"); }}
                  className="font-bold text-emerald-600 hover:underline"
                >
                  Inicia sesión
                </button>
              </div>
            </form>
          )}

          {/* ─── VISTA: VERIFICAR CÓDIGO ─── */}
          {mode === "verify" && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4 p-6">
              <p className="text-xs text-stone-600">
                Ingresa el código de 6 dígitos para verificar tu cuenta (Código de prueba:{" "}
                <strong className="text-emerald-700 font-bold">{generatedCode}</strong>):
              </p>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-black rounded-xl border border-stone-300 py-3 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar Cuenta"}
              </button>
            </form>
          )}

          {/* ─── VISTA: OLVIDÓ CONTRASEÑA ─── */}
          {mode === "forgot" && (
            <form onSubmit={handleRequestReset} className="flex flex-col gap-4 p-6">
              <p className="text-xs text-stone-600">
                Ingresa tu correo registrado o teléfono de Costa Rica para recibir un código de recuperación:
              </p>
              <input
                type="text"
                required
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                placeholder="correo@ejemplo.com o 88888888"
                className="rounded-xl border border-stone-200 px-3 py-2.5 text-xs bg-stone-50/50 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Código de Recuperación"}
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-stone-400 hover:underline text-center"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* ─── VISTA: RESTABLECER CONTRASEÑA ─── */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3 p-6">
              <p className="text-xs text-stone-600">
                Código de prueba generado: <strong className="text-emerald-700 font-bold">{generatedCode}</strong>
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Código de 6 dígitos</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-700">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-stone-50/50 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Nueva Contraseña"}
              </button>
            </form>
          )}

          {/* ─── VISTA: PERFIL DE USUARIO ─── */}
          {mode === "profile" && currentUser && (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-lg">
                  {currentUser.nombre[0]?.toUpperCase()}{currentUser.apellido[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">{currentUser.nombre} {currentUser.apellido}</h4>
                  <p className="text-xs text-stone-500">{currentUser.email}</p>
                  <p className="text-xs font-medium text-emerald-700">🇨🇷 {currentUser.telefono}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={loadOrderHistory}
                  className="flex items-center justify-between rounded-xl border border-stone-200 p-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-600" />
                    Historial de Pedidos
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </button>

                {currentUser.rol === "admin" && (
                  <a
                    href="/admin"
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Ir al Panel de Administración
                    </span>
                    <ChevronRight className="h-4 w-4 text-emerald-600" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* ─── VISTA: HISTORIAL DE PEDIDOS ─── */}
          {mode === "history" && (
            <div className="flex flex-col gap-3 p-6 max-h-[60vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setMode("profile")}
                className="text-xs text-emerald-600 font-semibold self-start hover:underline mb-1"
              >
                ← Volver al Perfil
              </button>

              {loadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-8 text-stone-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Cargando pedidos...</span>
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="py-8 text-center text-xs text-stone-500">
                  Aún no tienes pedidos registrados con tu número de teléfono.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {orderHistory.map((order) => (
                    <li key={order.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2 font-bold text-stone-800">
                        <span>Pedido #{order.id.slice(0, 8)}</span>
                        <span className="text-emerald-700">₡{order.total.toLocaleString("es-CR")}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-1">
                        Fecha: {new Date(order.created_at).toLocaleString("es-CR")} — Estado: <span className="uppercase font-semibold">{order.estado}</span>
                      </p>
                      <ul className="flex flex-col gap-1 pl-2 border-l-2 border-emerald-500">
                        {(order.items ?? []).map((it: any, idx: number) => (
                          <li key={idx} className="text-stone-700">
                            {it.nombre} × {it.cantidad}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
