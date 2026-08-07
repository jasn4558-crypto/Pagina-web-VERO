import { jsPDF } from "jspdf";

export interface OrderItem {
  nombre: string;
  cantidad: number;
  precio?: number;
  imagen?: string;
}

export interface OrderData {
  id: string;
  telefono: string;
  total: number;
  estado: string;
  items: OrderItem[];
  created_at?: string;
}

export function generateOrderPDF(order: OrderData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const fechaStr = order.created_at
    ? new Date(order.created_at).toLocaleString("es-CR")
    : new Date().toLocaleString("es-CR");

  // Encabezado
  doc.setFillColor(16, 185, 129); // Emerald-600
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TIENDA VERÓNICA", 15, 16);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("COTIZACIÓN / ORDEN DE COMPRA", 15, 24);

  // Info del Pedido
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`N° de Orden: ${order.id.slice(0, 8)}`, 15, 40);
  doc.text(`Fecha: ${fechaStr}`, 15, 46);
  doc.text(`Teléfono WhatsApp: ${order.telefono}`, 15, 52);
  doc.text(`Estado: ${order.estado.toUpperCase()}`, 15, 58);

  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 64, 195, 64);

  // Tabla de Productos Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 68, 180, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("PRODUCTO", 18, 73.5);
  doc.text("CANT", 130, 73.5, { align: "center" });
  doc.text("PRECIO UNIT", 160, 73.5, { align: "center" });
  doc.text("TOTAL", 190, 73.5, { align: "right" });

  let y = 83;
  (order.items ?? []).forEach((item, index) => {
    const precioUnit = item.precio ? item.precio : Math.round(order.total / (item.cantidad || 1));
    const subtotalItem = precioUnit * (item.cantidad || 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const truncNombre = item.nombre.length > 50 ? item.nombre.slice(0, 47) + "..." : item.nombre;
    doc.text(truncNombre, 18, y);
    doc.text(String(item.cantidad || 1), 130, y, { align: "center" });
    doc.text(`₡${precioUnit.toLocaleString("es-CR")}`, 160, y, { align: "center" });
    doc.text(`₡${subtotalItem.toLocaleString("es-CR")}`, 190, y, { align: "right" });

    y += 8;
  });

  // Línea final
  doc.line(15, y + 2, 195, y + 2);

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(`TOTAL FINAL: ₡${order.total.toLocaleString("es-CR")}`, 190, y + 12, {
    align: "right",
  });

  // Pie de página
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Gracias por comprar en Tienda Verónica. Para consultas contáctenos vía WhatsApp.",
    105,
    280,
    { align: "center" }
  );

  doc.save(`Cotizacion_Orden_${order.id.slice(0, 8)}.pdf`);
}
