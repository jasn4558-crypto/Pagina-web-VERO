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
 * Guarda el teléfono, dirección, el total y los items como JSON.
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

  // Obtenemos la cantidad de pedidos existentes para calcular el consecutivo desde 421
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

  const { error } = await supabase.from("pedidos").insert({
    telefono: userPhone,
    total,
    estado: "pendiente",
    direccion: addressPayload,
    provincia: addressPayload.provincia,
    canton: addressPayload.canton,
    distrito: addressPayload.distrito,
    direccion_exacta: addressPayload.direccion_exacta,
    items: cart.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      imagen: i.imagen,
      numero_pedido: numeroPedidoStr,
      ...addressPayload,
    })),
  });

  if (error) {
    console.warn("Advertencia al insertar pedido con columnas directas:", error.message);
    // Fallback si la tabla no tiene las columnas individuales activas
    const { error: fallbackError } = await supabase.from("pedidos").insert({
      telefono: userPhone,
      total,
      estado: "pendiente",
      items: cart.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        precio: i.precio,
        cantidad: i.cantidad,
        imagen: i.imagen,
        numero_pedido: numeroPedidoStr,
        ...addressPayload,
      })),
    });
    if (fallbackError) {
      throw new Error(`Error al registrar el pedido: ${fallbackError.message}`);
    }
  }

  return numeroPedidoStr;
}