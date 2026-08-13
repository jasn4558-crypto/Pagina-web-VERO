import { jsPDF } from "jspdf";

export interface OrderItem {
  nombre: string;
  cantidad: number;
  precio?: number;
  imagen?: string;
  numero_pedido?: string;
}

export interface OrderData {
  id: string;
  telefono: string;
  total: number;
  estado: string;
  items: OrderItem[];
  created_at?: string;
  numero_pedido?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  direccion_exacta?: string;
  direccion?: {
    provincia?: string;
    canton?: string;
    distrito?: string;
    direccion_exacta?: string;
  };
}

async function loadImgAsDataUrl(
  url?: string
): Promise<{ dataUrl: string; format: "JPEG" } | null> {
  if (!url || typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 3500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ dataUrl, format: "JPEG" });
      } catch (err) {
        console.warn("Error convirtiendo imagen a dataUrl:", err);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

export async function generateOrderPDF(order: OrderData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const numOrdenStr =
    order.numero_pedido ||
    order.items?.[0]?.numero_pedido ||
    order.id.slice(0, 8);

  const fechaStr = order.created_at
    ? new Date(order.created_at).toLocaleString("es-CR")
    : new Date().toLocaleString("es-CR");

  // Extraer información de dirección
  const provincia = order.provincia || order.direccion?.provincia || "";
  const canton = order.canton || order.direccion?.canton || "";
  const distrito = order.distrito || order.direccion?.distrito || "";
  const direccionExacta = order.direccion_exacta || order.direccion?.direccion_exacta || "";

  // 1. Encabezado principal (Banner Verde Esmeralda)
  doc.setFillColor(16, 185, 129); // Emerald-600
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TIENDA VERÓNICA", 15, 17);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("COMPROBANTE DE COMPRA / COTIZACIÓN", 15, 25);

  // 2. Tarjeta Informativa del Pedido
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 36, 88, 30, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 36, 88, 30, 3, 3, "S");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(`N° DE ORDEN: #${numOrdenStr}`, 19, 43);
  doc.setFont("helvetica", "normal");
  doc.text(`FECHA: ${fechaStr}`, 19, 49);
  doc.text(`TELÉFONO: ${order.telefono}`, 19, 55);
  doc.setFont("helvetica", "bold");
  doc.text(`ESTADO: ${order.estado.toUpperCase()}`, 19, 61);

  // 3. Tarjeta Informativa de Dirección de Envío
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(107, 36, 88, 30, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(107, 36, 88, 30, 3, 3, "S");

  doc.setTextColor(16, 185, 129); // Emerald
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("DIRECCIÓN DE ENTREGA", 111, 43);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const ubicacionStr = [provincia, canton, distrito].filter(Boolean).join(", ");
  doc.text(`Ubicación: ${ubicacionStr || "No especificada"}`, 111, 49);

  const truncDireccion = direccionExacta
    ? doc.splitTextToSize(`Detalle: ${direccionExacta}`, 80)
    : ["Detalle: A coordinar vía WhatsApp"];
  doc.text(truncDireccion, 111, 55);

  // 4. Encabezado de la Tabla de Productos
  let y = 73;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("IMAGEN", 18, y + 6);
  doc.text("PRODUCTO", 38, y + 6);
  doc.text("CANT", 125, y + 6, { align: "center" });
  doc.text("PRECIO UNIT", 155, y + 6, { align: "right" });
  doc.text("TOTAL", 190, y + 6, { align: "right" });

  y += 12;

  // Cargar imágenes de productos
  const loadedImages = await Promise.all(
    (order.items ?? []).map((item) => loadImgAsDataUrl(item.imagen))
  );

  // Renderizar filas de productos
  (order.items ?? []).forEach((item, index) => {
    const precioUnit =
      item.precio ? item.precio : Math.round(order.total / (item.cantidad || 1));
    const subtotalItem = precioUnit * (item.cantidad || 1);
    const imgData = loadedImages[index];

    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y - 3, 180, 16, "F");
    }

    if (imgData) {
      try {
        doc.addImage(imgData.dataUrl, imgData.format, 18, y - 2, 14, 14);
      } catch (e) {
        doc.setFillColor(241, 245, 249);
        doc.rect(18, y - 2, 14, 14, "F");
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(18, y - 2, 14, 14, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const truncNombre =
      item.nombre.length > 40 ? item.nombre.slice(0, 37) + "..." : item.nombre;
    doc.text(truncNombre, 38, y + 5);
    doc.text(String(item.cantidad || 1), 125, y + 5, { align: "center" });
    doc.text(`CRC ${precioUnit.toLocaleString("es-CR")}`, 155, y + 5, {
      align: "right",
    });
    doc.text(`CRC ${subtotalItem.toLocaleString("es-CR")}`, 190, y + 5, {
      align: "right",
    });

    y += 16;
  });

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 6;

  // 5. Cuadro del Resumen de la Compra
  const summaryBoxY = y;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(105, summaryBoxY, 90, 44, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(105, summaryBoxY, 90, 44, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("RESUMEN DE LA COMPRA", 110, summaryBoxY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal:", 110, summaryBoxY + 16);
  doc.text(`CRC ${order.total.toLocaleString("es-CR")}`, 190, summaryBoxY + 16, {
    align: "right",
  });

  doc.text("Costo de Envío:", 110, summaryBoxY + 23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text("A convenir según lugar", 190, summaryBoxY + 23, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(110, summaryBoxY + 27, 190, summaryBoxY + 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("TOTAL ESTIMADO:", 110, summaryBoxY + 36);
  doc.text(`CRC ${order.total.toLocaleString("es-CR")}`, 190, summaryBoxY + 36, {
    align: "right",
  });

  // 6. Pie de página
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Nota: El precio del envío se coordina dependiendo del lugar de entrega. Nos comunicaremos vía WhatsApp.",
    105,
    282,
    { align: "center" }
  );

  doc.save(`Pedido_${numOrdenStr}.pdf`);
}
