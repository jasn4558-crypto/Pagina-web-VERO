import { supabase } from "./supabase";

export interface SubcategoryRecord {
  id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
  orden?: number;
  created_at?: string;
}

export async function getSubcategories(categoriaId?: string): Promise<SubcategoryRecord[]> {
  try {
    let query = supabase.from("subcategorias").select("*").eq("activo", true);
    if (categoriaId) {
      query = query.eq("categoria_id", categoriaId);
    }
    const { data, error } = await query.order("orden", { ascending: true }).order("nombre", { ascending: true });
    if (error) {
      console.warn("Error fetching subcategories:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn("Error fetching subcategories exception:", err);
    return [];
  }
}

export async function getAllSubcategoriesAdmin(): Promise<SubcategoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from("subcategorias")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) {
      console.warn("Error fetching all subcategories:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn("Error in getAllSubcategoriesAdmin:", err);
    return [];
  }
}

export async function createSubcategory(categoriaId: string, nombre: string): Promise<SubcategoryRecord | null> {
  const { data, error } = await supabase
    .from("subcategorias")
    .insert([{ categoria_id: categoriaId, nombre, activo: true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating subcategory:", error);
    throw error;
  }
  return data;
}

export async function updateSubcategory(id: string, updates: Partial<SubcategoryRecord>): Promise<boolean> {
  const { error } = await supabase.from("subcategorias").update(updates).eq("id", id);
  if (error) {
    console.error("Error updating subcategory:", error);
    return false;
  }
  return true;
}

export async function deleteSubcategory(id: string): Promise<boolean> {
  const { error } = await supabase.from("subcategorias").delete().eq("id", id);
  if (error) {
    console.error("Error deleting subcategory:", error);
    return false;
  }
  return true;
}
