import { jsPDF } from "jspdf";
import type { CartItem } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";

/**
 * Genera un PDF sencillo con el resumen del pedido y retorna el Blob.
 */
export function generateOrderPDF(cart: CartItem[], userPhone: string): Blob {
  const doc = new jsPDF();
  const now = new Date();

  // Encabezado
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Pedido", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${now.toLocaleString("es-CR")}`, 14, 32);
  doc.text(`WhatsApp: ${userPhone}`, 14, 38);

  // Línea
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 44, 196, 44);

  // Cabecera de tabla
  let y = 52;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Producto", 14, y);
  doc.text("Cant.", 130, y);
  doc.text("Precio", 155, y);
  doc.text("Total", 180, y, { align: "right" });
  y += 4;
  doc.line(14, y, 196, y);
  y += 8;

  // Items
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let subtotal = 0;
  for (const item of cart) {
    const total = item.precio * item.cantidad;
    subtotal += total;

    // Truncar nombre largo para que quepa en el PDF
    const nombre = item.nombre.length > 38 ? item.nombre.slice(0, 37) + "…" : item.nombre;
    doc.text(nombre, 14, y);
    doc.text(String(item.cantidad), 130, y);
    doc.text(`₡${item.precio.toLocaleString("es-CR")}`, 155, y, { align: "right" });
    doc.text(`₡${total.toLocaleString("es-CR")}`, 180, y, { align: "right" });

    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  }

  // Línea final
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ₡${subtotal.toLocaleString("es-CR")}`, 180, y, { align: "right" });
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Total + Envío (dependiendo de la ubicación)",
    180,
    y,
    { align: "right" }
  );

  // Pie de página
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Gracias por tu compra.", 14, 290);

  // Retornar el PDF como Blob (sin descargar localmente)
  return doc.output("blob");
}

/**
 * Procesa el pedido: genera el PDF, lo sube a Supabase Storage
 * y abre WhatsApp con la URL pública del PDF.
 */
export async function processOrder(cart: CartItem[], userPhone: string): Promise<void> {
  if (cart.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  // 1. Generar PDF como Blob
  const pdfBlob = generateOrderPDF(cart, userPhone);

  // 2. Subir el PDF al bucket tienda-archivos en la subcarpeta pedidos/
  const fileName = `pedido-${Date.now()}.pdf`;
  const filePath = `pedidos/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("tienda-archivos")
    .upload(filePath, pdfBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/pdf",
    });

  if (uploadError) {
    throw new Error(`Error al subir el PDF: ${uploadError.message}`);
  }

  // 3. Obtener URL pública del PDF
  const { data: publicUrlData } = supabase.storage
    .from("tienda-archivos")
    .getPublicUrl(filePath);
  const pdfUrl = publicUrlData.publicUrl;

  // 4. Construir mensaje de WhatsApp con la URL del PDF
  const numeroLimpio = userPhone.replace(/[^\d]/g, "");
  const mensaje = encodeURIComponent(
    `Hola, quiero realizar este pedido. Mi número de contacto es ${userPhone}. Aquí está el detalle: ${pdfUrl}`
  );

  // 5. Abrir WhatsApp en una nueva pestaña
  window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, "_blank");
}