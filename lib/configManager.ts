import { supabase } from "./supabase";

export interface HeaderConfig {
  badge_text: string;
  titulo_principal: string;
  titulo_destacado: string;
  descripcion: string;
  boton_texto: string;
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  badge_text: "Experiencia de Compra Inmersiva",
  titulo_principal: "Catálogo",
  titulo_destacado: "Esencial",
  descripcion:
    "Productos únicos y artesanales con envíos a todo el país 🇨🇷. Encuentra lo que necesitas más rápido en nuestro catálogo.",
  boton_texto: "Ver Catálogo",
};

export async function getHeaderConfig(): Promise<HeaderConfig> {
  try {
    // 1. Intentar cargar de Supabase
    const { data, error } = await supabase
      .from("configuracion")
      .select("*")
      .eq("clave", "header_config")
      .maybeSingle();

    if (!error && data && data.valor) {
      return {
        badge_text: data.valor.badge_text ?? DEFAULT_HEADER_CONFIG.badge_text,
        titulo_principal:
          data.valor.titulo_principal ?? DEFAULT_HEADER_CONFIG.titulo_principal,
        titulo_destacado:
          data.valor.titulo_destacado ?? DEFAULT_HEADER_CONFIG.titulo_destacado,
        descripcion: data.valor.descripcion ?? DEFAULT_HEADER_CONFIG.descripcion,
        boton_texto: data.valor.boton_texto ?? DEFAULT_HEADER_CONFIG.boton_texto,
      };
    }
  } catch (err) {
    console.error("Error al cargar configuración de Supabase:", err);
  }

  // 2. Fallback a localStorage si está disponible en cliente
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem("header_config");
      if (local) {
        return { ...DEFAULT_HEADER_CONFIG, ...JSON.parse(local) };
      }
    } catch (e) {
      console.error("Error al leer de localStorage:", e);
    }
  }

  return DEFAULT_HEADER_CONFIG;
}

export async function saveHeaderConfig(config: HeaderConfig): Promise<boolean> {
  // Guardar siempre en localStorage para persistencia inmediata local
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("header_config", JSON.stringify(config));
    } catch (e) {
      console.error("Error guardando en localStorage:", e);
    }
  }

  // Intentar guardar en Supabase
  try {
    const { error } = await supabase.from("configuracion").upsert(
      {
        clave: "header_config",
        valor: config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clave" }
    );

    if (error) {
      console.warn("Supabase upsert warning (tabla configuracion):", error.message);
    }
  } catch (err) {
    console.warn("Error enviando configuración a Supabase:", err);
  }

  return true;
}
