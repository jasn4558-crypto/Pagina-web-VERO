import { supabase } from "./supabase";
import type { PromoItem } from "@/components/PromoCarousel";

export interface PromoRecord {
  id: string;
  producto_id: string;
  nombre: string;
  imagen: string;
  precio_original: number;
  descuento: number;
  activo: boolean;
  orden: number;
}

export async function getPromos(): Promise<PromoItem[]> {
  const { data, error } = await supabase
    .from("promociones")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error || !data) return [];

  return data.map((r: PromoRecord) => ({
    id: r.id,
    producto_id: r.producto_id,
    nombre: r.nombre,
    imagen: r.imagen,
    precio_original: r.precio_original,
    descuento: r.descuento,
  }));
}

export async function getAllPromos(): Promise<PromoRecord[]> {
  const { data, error } = await supabase
    .from("promociones")
    .select("*")
    .order("orden", { ascending: true });

  if (error || !data) return [];
  return data as PromoRecord[];
}

export async function upsertPromo(promo: Omit<PromoRecord, "id"> & { id?: string }): Promise<void> {
  const { error } = await supabase.from("promociones").upsert(promo, { onConflict: "id" });
  if (error) throw error;
}

export async function deletePromo(id: string): Promise<void> {
  const { error } = await supabase.from("promociones").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePromo(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from("promociones").update({ activo }).eq("id", id);
  if (error) throw error;
}
