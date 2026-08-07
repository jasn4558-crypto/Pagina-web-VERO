import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: "admin" | "cliente";
  verificado: boolean;
  created_at?: string;
}

/**
 * Valida un número telefónico de Costa Rica.
 * Formato: 8 dígitos iniciando en 2, 4, 5, 6, 7 u 8 (opcional prefijo +506 o 506).
 */
export function validateCostaRicaPhone(phone: string): { valid: boolean; cleanPhone: string; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // Extraer sólo los números si viene con +506
  const numOnly = cleaned.replace(/^\+?506/, "");

  if (!/^[245678]\d{7}$/.test(numOnly)) {
    return {
      valid: false,
      cleanPhone: phone,
      error: "Ingresa un teléfono válido de Costa Rica (8 dígitos iniciando en 2, 4, 5, 6, 7 u 8).",
    };
  }

  return {
    valid: true,
    cleanPhone: `+506${numOnly}`,
  };
}

/**
 * Registra un nuevo usuario en la tabla `usuarios`.
 */
export async function registerUser(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
}): Promise<{ user: UserProfile; verificationCode: string }> {
  const emailClean = data.email.trim().toLowerCase();
  const phoneVal = validateCostaRicaPhone(data.telefono);

  if (!phoneVal.valid) {
    throw new Error(phoneVal.error || "Teléfono inválido.");
  }

  if (!data.nombre.trim() || !data.apellido.trim()) {
    throw new Error("Nombre y apellido son obligatorios.");
  }

  if (data.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // Verificar si es el email del administrador principal
  const isAdmin = emailClean === "admin@tiendaveronica.com" || emailClean === "admin@vero.com";
  const rol = isAdmin ? "admin" : "cliente";

  // Generar código de verificación aleatorio de 6 dígitos
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Guardar en la tabla `usuarios`
  const { data: newUser, error } = await supabase
    .from("usuarios")
    .insert({
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      email: emailClean,
      password: data.password, // En producción usar hash
      telefono: phoneVal.cleanPhone,
      rol,
      codigo_verificacion: verificationCode,
      verificado: false,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      throw new Error("El correo electrónico ya está registrado.");
    }
    throw new Error(`Error al registrar usuario: ${error.message}`);
  }

  const profile: UserProfile = {
    id: newUser.id,
    nombre: newUser.nombre,
    apellido: newUser.apellido,
    email: newUser.email,
    telefono: newUser.telefono,
    rol: newUser.rol,
    verificado: newUser.verificado,
    created_at: newUser.created_at,
  };

  return { user: profile, verificationCode };
}

/**
 * Verifica un usuario mediante el código de 6 dígitos.
 */
export async function verifyUserCode(emailOrPhone: string, code: string): Promise<boolean> {
  const cleanInput = emailOrPhone.trim().toLowerCase();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`email.eq.${cleanInput},telefono.eq.${cleanInput}`)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Usuario no encontrado.");
  }

  if (data.codigo_verificacion !== code.trim()) {
    throw new Error("El código de verificación es incorrecto.");
  }

  const { error: updateErr } = await supabase
    .from("usuarios")
    .update({ verificado: true, codigo_verificacion: null })
    .eq("id", data.id);

  if (updateErr) throw updateErr;

  return true;
}

/**
 * Inicio de sesión. Si es admin, otorga rol admin.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();

  // Intento de inicio de sesión
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", emailClean)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  if (data.password !== password) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  const profile: UserProfile = {
    id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    telefono: data.telefono,
    rol: data.rol,
    verificado: data.verificado,
    created_at: data.created_at,
  };

  saveUserSession(profile);
  return profile;
}

/**
 * Solicita código de recuperación de contraseña (envía código al correo/teléfono).
 */
export async function requestPasswordReset(identifier: string): Promise<string> {
  const cleanInput = identifier.trim().toLowerCase();
  const phoneVal = validateCostaRicaPhone(identifier);
  const cleanPhone = phoneVal.valid ? phoneVal.cleanPhone : cleanInput;

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`email.eq.${cleanInput},telefono.eq.${cleanPhone}`)
    .maybeSingle();

  if (error || !data) {
    throw new Error("No encontramos ninguna cuenta asociada a este correo o teléfono.");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await supabase
    .from("usuarios")
    .update({ codigo_verificacion: code })
    .eq("id", data.id);

  return code;
}

/**
 * Restablece la contraseña mediante el código.
 */
export async function resetPasswordWithCode(
  identifier: string,
  code: string,
  newPassword: string
): Promise<boolean> {
  const cleanInput = identifier.trim().toLowerCase();
  const phoneVal = validateCostaRicaPhone(identifier);
  const cleanPhone = phoneVal.valid ? phoneVal.cleanPhone : cleanInput;

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`email.eq.${cleanInput},telefono.eq.${cleanPhone}`)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Usuario no encontrado.");
  }

  if (data.codigo_verificacion !== code.trim()) {
    throw new Error("El código de verificación es inválido o ha expirado.");
  }

  if (newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const { error: updateErr } = await supabase
    .from("usuarios")
    .update({ password: newPassword, codigo_verificacion: null, verificado: true })
    .eq("id", data.id);

  if (updateErr) throw updateErr;

  return true;
}

// ─── Sesión en localStorage ──────────────────────────────────────────────────
export function saveUserSession(user: UserProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_session", JSON.stringify(user));
  }
}

export function getCurrentUserSession(): UserProfile | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("user_session");
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
  }
  return null;
}

export function logoutUserSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user_session");
  }
}
