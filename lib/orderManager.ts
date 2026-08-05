import type { CartItem } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";

/**
 * Crea un pedido en la tabla `pedidos` de Supabase.
 * Guarda el teléfono, el total y los items como JSON.
 */
export async function createOrder(
  cart: CartItem[],
  userPhone: string
): Promise<void> {
  if (cart.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const { error } = await supabase.from("pedidos").insert({
    telefono: userPhone,
    total,
    estado: "pendiente",
    items: cart.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      imagen: i.imagen,
    })),
  });

  if (error) {
    throw new Error(`Error al registrar el pedido: ${error.message}`);
  }
}