/**
 * Extrae la dirección de un pedido.
 * Busca primero en la columna `direccion` (JSONB),
 * luego en el array `items` buscando el item especial { _tipo: "direccion" }.
 */
export function extractAddressFromOrder(order: {
  direccion?: Record<string, string> | null;
  items?: any[];
}): { provincia: string; canton: string; distrito: string; direccion_exacta: string } {
  // 1. Columna dedicada
  if (order.direccion && order.direccion.provincia) {
    return {
      provincia: order.direccion.provincia || "",
      canton: order.direccion.canton || "",
      distrito: order.direccion.distrito || "",
      direccion_exacta: order.direccion.direccion_exacta || "",
    };
  }
  // 2. Metadata dentro de items
  const dirItem = (order.items || []).find((i: any) => i && i._tipo === "direccion");
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

/**
 * Filtra los items de un pedido quitando los items de metadata especiales (_tipo).
 */
export function getProductItems(items: any[]): any[] {
  return (items || []).filter((i: any) => !i._tipo);
}
