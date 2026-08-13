import type { CartItem } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";

export interface AddressData {
  provincia?: string;
  canton?: string;
  distrito?: string;
  direccionExacta?: string;
}

/**
 * Crea un pedido en la tabla `pedidos` de Supabase.
 * La dirección se guarda:
 *   1. En la columna `direccion` (JSONB) si existe.
 *   2. SIEMPRE dentro del objeto `_direccion` en el array `items` como metadata.
 * Retorna el número de pedido generado consecutivo (ej: "0000421").
 */
export async function createOrder(
  cart: CartItem[],
  userPhone: string,
  address?: AddressData
): Promise<string> {
  if (cart.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const { count } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  const numPedido = 421 + (count ?? 0);
  const numeroPedidoStr = String(numPedido).padStart(7, "0");
  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const addressPayload = {
    provincia: address?.provincia || "",
    canton: address?.canton || "",
    distrito: address?.distrito || "",
    direccion_exacta: address?.direccionExacta || "",
  };

  // Los items del carrito, más un item especial "_direccion" con los datos de envío
  const itemsPayload = [
    ...cart.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      imagen: i.imagen,
      numero_pedido: numeroPedidoStr,
    })),
    // Guardamos la dirección como un "item" especial de metadata
    {
      _tipo: "direccion",
      numero_pedido: numeroPedidoStr,
      ...addressPayload,
    },
  ];

  // Intento 1: con columna `direccion` JSONB (si ya fue creada en Supabase)
  const { error } = await supabase.from("pedidos").insert({
    telefono: userPhone,
    total,
    estado: "pendiente",
    direccion: addressPayload,
    items: itemsPayload,
  });

  if (error) {
    // La columna `direccion` aún no existe — fallback sin ella,
    // pero la dirección igualmente queda grabada dentro de items
    console.warn("Columna `direccion` no disponible, guardando en items:", error.message);
    const { error: fallbackError } = await supabase.from("pedidos").insert({
      telefono: userPhone,
      total,
      estado: "pendiente",
      items: itemsPayload,
    });
    if (fallbackError) {
      throw new Error(`Error al registrar el pedido: ${fallbackError.message}`);
    }
  }

  return numeroPedidoStr;
}

/**
 * Extrae la dirección de un pedido (desde columna `direccion` o desde items._tipo==="direccion")
 */
export function extractAddressFromOrder(order: {
  direccion?: Record<string, string> | null;
  items?: any[];
}): { provincia: string; canton: string; distrito: string; direccion_exacta: string } {
  // Primero intentar columna direccion
  if (order.direccion && order.direccion.provincia) {
    return {
      provincia: order.direccion.provincia || "",
      canton: order.direccion.canton || "",
      distrito: order.direccion.distrito || "",
      direccion_exacta: order.direccion.direccion_exacta || "",
    };
  }
  // Fallback: buscar en items
  const dirItem = (order.items || []).find((i: any) => i._tipo === "direccion");
  if (dirItem) {
    return {
      provincia: dirItem.provincia || "",
      canton: dirItem.canton || "",
      distrito: dirItem.distrito || "",
      direccion_exacta: dirItem.direccion_exacta || "",
    };
  }
  return { provincia: "", canton: "", distrito: "", direccion_exacta: "" };
}