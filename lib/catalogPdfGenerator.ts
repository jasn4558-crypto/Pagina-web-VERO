import { jsPDF } from "jspdf";
import { getHeaderConfig } from "./configManager";

export interface CatalogProduct {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagenes: string[];
  categoria_id: string;
  subcategoria_id?: string | null;
}

export interface CatalogCategory {
  id: string;
  nombre: string;
}

export interface CatalogSubcategory {
  id: string;
  categoria_id: string;
  nombre: string;
}

interface LoadedImageData {
  dataUrl: string;
  format: "JPEG" | "PNG";
  width: number;
  height: number;
}

async function loadImgAsDataUrl(url?: string): Promise<LoadedImageData | null> {
  if (!url || typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const width = img.naturalWidth || 200;
        const height = img.naturalHeight || 200;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve({ dataUrl, format: "JPEG", width, height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

/** Dibuja texto con salto de línea automático y retorna la Y final */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const last = clipped[maxLines - 1] as string;
    clipped[maxLines - 1] = last.length > 3 ? last.slice(0, -3) + "..." : last + "...";
  }
  clipped.forEach((line: string, i: number) => {
    doc.text(line, x, y + i * lineHeight);
  });
  return y + clipped.length * lineHeight;
}

/** Dibuja una imagen con ratio correcto centrada en el box */
function drawImageFit(
  doc: jsPDF,
  imgData: LoadedImageData,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  const ratio = Math.min(boxW / imgData.width, boxH / imgData.height);
  const fitW = imgData.width * ratio;
  const fitH = imgData.height * ratio;
  const imgX = boxX + (boxW - fitW) / 2;
  const imgY = boxY + (boxH - fitH) / 2;
  doc.addImage(imgData.dataUrl, imgData.format, imgX, imgY, fitW, fitH);
}

export async function generateCatalogPDF(
  categories: CatalogCategory[],
  subcategories: CatalogSubcategory[],
  products: CatalogProduct[],
  onProgress?: (progress: number) => void
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Nombre de la tienda desde configuración
  const headerConfig = await getHeaderConfig();
  const storeName = `${headerConfig.titulo_principal} ${headerConfig.titulo_destacado}`.trim().toUpperCase() || "TIENDA";
  const storeTagline = headerConfig.descripcion || "Catálogo de Productos";

  // Emerald palette
  const COLOR_EMERALD: [number, number, number] = [16, 185, 129];
  const COLOR_DARK: [number, number, number] = [15, 23, 42];
  const COLOR_MID: [number, number, number] = [71, 85, 105];
  const COLOR_LIGHT: [number, number, number] = [241, 245, 249];
  const COLOR_BORDER: [number, number, number] = [226, 232, 240];
  const COLOR_WHITE: [number, number, number] = [255, 255, 255];

  // PRODUCTOS POR PÁGINA: 2 columnas, 2 filas = 4 (con descripción e imágenes múltiples)
  const PRODS_PER_PAGE = 4;

  // Agrupar productos por categoría y subcategoría
  interface Group {
    catName: string;
    subcatName?: string;
    products: CatalogProduct[];
  }
  const groups: Group[] = [];
  categories.forEach((cat) => {
    const catProducts = products.filter((p) => p.categoria_id === cat.id);
    if (catProducts.length === 0) return;
    const catSubcats = subcategories.filter((s) => s.categoria_id === cat.id);
    const usedSubcatIds = new Set<string>();

    catSubcats.forEach((subcat) => {
      const subProds = catProducts.filter((p) => p.subcategoria_id === subcat.id);
      if (subProds.length > 0) {
        usedSubcatIds.add(subcat.id);
        groups.push({ catName: cat.nombre, subcatName: subcat.nombre, products: subProds });
      }
    });

    const sinSubcat = catProducts.filter((p) => !p.subcategoria_id || !usedSubcatIds.has(p.subcategoria_id));
    if (sinSubcat.length > 0) {
      groups.push({ catName: cat.nombre, subcatName: catSubcats.length > 0 ? "General" : undefined, products: sinSubcat });
    }
  });

  if (groups.length === 0) {
    alert("No hay productos con categoría para generar el catálogo.");
    return;
  }

  // Pre-calcular páginas para el índice interactivo
  let tempPage = 2; // Página 1 = Portada+Índice
  const indexEntries: { label: string; isHeader: boolean; page: number }[] = [];
  let prevCatName = "";
  groups.forEach((g) => {
    if (g.catName !== prevCatName) {
      prevCatName = g.catName;
      indexEntries.push({ label: g.catName, isHeader: true, page: tempPage });
    }
    if (g.subcatName) {
      indexEntries.push({ label: `  • ${g.subcatName}`, isHeader: false, page: tempPage });
    }
    tempPage += Math.ceil(g.products.length / PRODS_PER_PAGE);
  });

  // ─────────────────────────────────────────────────────
  // PÁGINA 1: Portada + Índice Interactivo
  // ─────────────────────────────────────────────────────

  // Banner superior
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 0, 210, 55, "F");

  // Franja verde decorativa
  doc.setFillColor(...COLOR_EMERALD);
  doc.rect(0, 47, 210, 8, "F");

  // Logo / nombre de tienda
  doc.setTextColor(...COLOR_WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text(storeName, 105, 26, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(200, 240, 225);
  const taglineLines = doc.splitTextToSize(storeTagline, 170);
  doc.text(taglineLines.slice(0, 2), 105, 36, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_WHITE);
  doc.text("CATÁLOGO DE PRODUCTOS", 105, 51, { align: "center" });

  // Fecha
  const fecha = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MID);
  doc.text(`Generado el ${fecha}`, 105, 63, { align: "center" });

  // Encabezado del índice
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("ÍNDICE DE CATEGORÍAS", 18, 76);

  // Línea verde
  doc.setDrawColor(...COLOR_EMERALD);
  doc.setLineWidth(0.8);
  doc.line(18, 78, 192, 78);
  doc.setLineWidth(0.2);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLOR_MID);
  doc.text("Toca o haz clic en una categoría para ir directamente a esa sección.", 18, 84);

  let indexY = 92;
  indexEntries.forEach((entry) => {
    if (indexY > 270) return;

    if (entry.isHeader) {
      // Fondo del encabezado de categoría
      doc.setFillColor(...COLOR_LIGHT);
      doc.roundedRect(18, indexY - 4, 174, 9, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLOR_EMERALD);
      doc.text(entry.label.toUpperCase(), 22, indexY + 2.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_MID);
      doc.text(`Pág. ${entry.page}`, 188, indexY + 2.5, { align: "right" });

      doc.link(18, indexY - 4, 174, 9, { pageNumber: entry.page });
      indexY += 12;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR_DARK);
      doc.text(entry.label, 26, indexY);

      doc.setTextColor(...COLOR_MID);
      doc.text(`Pág. ${entry.page}`, 188, indexY, { align: "right" });

      // Puntos entre nombre y página
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineDashPattern([1, 2], 0);
      const labelWidth = doc.getTextWidth(entry.label) + 26;
      doc.line(labelWidth + 4, indexY - 0.5, 178, indexY - 0.5);
      doc.setLineDashPattern([], 0);

      doc.link(26, indexY - 4, 162, 7, { pageNumber: entry.page });
      indexY += 9;
    }
  });

  // Pie de portada
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 282, 210, 15, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_WHITE);
  doc.text(`${storeName} · Precios en CRC ₡ · Envío a coordinar`, 105, 291, { align: "center" });

  // ─────────────────────────────────────────────────────
  // CARGA DE IMÁGENES: todas las imágenes de todos los productos
  // ─────────────────────────────────────────────────────
  const allUrls = new Set<string>();
  products.forEach((p) => {
    (p.imagenes || []).forEach((url) => { if (url) allUrls.add(url); });
  });
  const allUrlsArray = Array.from(allUrls);
  const loadedImages: Record<string, LoadedImageData | null> = {};

  let loadedCount = 0;
  const CHUNK = 5;
  for (let i = 0; i < allUrlsArray.length; i += CHUNK) {
    const chunk = allUrlsArray.slice(i, i + CHUNK);
    const results = await Promise.all(chunk.map((url) => loadImgAsDataUrl(url)));
    chunk.forEach((url, idx) => { loadedImages[url] = results[idx]; });
    loadedCount += chunk.length;
    onProgress?.(Math.floor((loadedCount / allUrlsArray.length) * 100));
  }

  // ─────────────────────────────────────────────────────
  // PÁGINAS DE PRODUCTOS
  // Layout: 2 columnas × 2 filas = 4 productos por página
  // Cada tarjeta: imagen principal grande + galería de miniaturas + nombre + descripción + precio
  // ─────────────────────────────────────────────────────
  const CARD_W = 86;
  const CARD_H = 115;
  const COL_GAP = 8;
  const ROW_GAP = 6;
  const MARGIN_X = 15;
  const START_Y = 30;

  groups.forEach((group) => {
    const totalPages = Math.ceil(group.products.length / PRODS_PER_PAGE);

    for (let p = 0; p < totalPages; p++) {
      doc.addPage();

      // ── Encabezado de la página ──
      doc.setFillColor(...COLOR_DARK);
      doc.rect(0, 0, 210, 24, "F");
      doc.setFillColor(...COLOR_EMERALD);
      doc.rect(0, 20, 210, 4, "F");

      // Nombre tienda (pequeño, derecha)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_WHITE);
      doc.text(storeName, 192, 10, { align: "right" });

      // Título de sección
      const headerTitle = group.subcatName
        ? `${group.catName.toUpperCase()}  /  ${group.subcatName.toUpperCase()}`
        : group.catName.toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...COLOR_WHITE);
      doc.text(headerTitle, 105, 15, { align: "center" });

      const pageProducts = group.products.slice(p * PRODS_PER_PAGE, (p + 1) * PRODS_PER_PAGE);

      pageProducts.forEach((prod, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const cardX = MARGIN_X + col * (CARD_W + COL_GAP);
        const cardY = START_Y + row * (CARD_H + ROW_GAP);

        // ── Tarjeta fondo ──
        doc.setFillColor(...COLOR_WHITE);
        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardY, CARD_W, CARD_H, 3, 3, "FD");

        const imagenes = prod.imagenes || [];
        const mainUrl = imagenes[0];
        const mainImg = mainUrl ? loadedImages[mainUrl] : null;

        // ── Imagen principal ──
        const IMG_H = 52;
        const IMG_W = CARD_W - 4;

        // Fondo gris suave para la imagen
        doc.setFillColor(...COLOR_LIGHT);
        doc.roundedRect(cardX + 2, cardY + 2, IMG_W, IMG_H, 2, 2, "F");

        if (mainImg) {
          try {
            drawImageFit(doc, mainImg, cardX + 2, cardY + 2, IMG_W, IMG_H);
          } catch {
            // Silent
          }
        }

        // ── Galería de imágenes adicionales (miniaturas) ──
        const extraImgs = imagenes.slice(1, 5); // máx 4 miniaturas
        const MINI_SIZE = 10;
        const MINI_GAP = 2;
        const MINI_Y = cardY + 2 + IMG_H + 2;

        if (extraImgs.length > 0) {
          const totalMiniW = extraImgs.length * MINI_SIZE + (extraImgs.length - 1) * MINI_GAP;
          let miniX = cardX + 2 + (IMG_W - totalMiniW) / 2;

          extraImgs.forEach((url) => {
            const mImg = loadedImages[url];
            doc.setFillColor(...COLOR_LIGHT);
            doc.setDrawColor(...COLOR_BORDER);
            doc.roundedRect(miniX, MINI_Y, MINI_SIZE, MINI_SIZE, 1, 1, "FD");
            if (mImg) {
              try {
                drawImageFit(doc, mImg, miniX, MINI_Y, MINI_SIZE, MINI_SIZE);
              } catch {
                // Silent
              }
            }
            miniX += MINI_SIZE + MINI_GAP;
          });
        }

        // Separador entre imagen/miniaturas y texto
        const textStartY = MINI_Y + (extraImgs.length > 0 ? MINI_SIZE + 3 : 3);
        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.2);
        doc.line(cardX + 3, textStartY - 1, cardX + CARD_W - 3, textStartY - 1);

        // ── Nombre del producto ──
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_DARK);
        const afterName = drawWrappedText(doc, prod.nombre, cardX + 3, textStartY + 1, CARD_W - 6, 4.5, 2);

        // ── Descripción ──
        if (prod.descripcion && prod.descripcion.trim()) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...COLOR_MID);
          drawWrappedText(doc, prod.descripcion.trim(), cardX + 3, afterName + 1.5, CARD_W - 6, 3.8, 2);
        }

        // ── Precio (parte baja de la tarjeta) ──
        const priceY = cardY + CARD_H - 7;

        // Franja de precio
        doc.setFillColor(...COLOR_EMERALD);
        doc.roundedRect(cardX + 2, priceY - 2, CARD_W - 4, 9, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLOR_WHITE);
        doc.text(`₡ ${prod.precio.toLocaleString("es-CR")}`, cardX + CARD_W / 2, priceY + 4, { align: "center" });
      });

      // ── Pie de página ──
      doc.setFillColor(...COLOR_DARK);
      doc.rect(0, 282, 210, 15, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_WHITE);
      doc.text(`${storeName} · ${headerTitle}`, 15, 291);
      doc.text(`Página ${doc.getNumberOfPages()}`, 192, 291, { align: "right" });
    }
  });

  // Nombre del archivo usa el nombre real de la tienda
  const fileName = storeName.replace(/\s+/g, "_").toLowerCase();
  doc.save(`Catalogo_${fileName}.pdf`);
}
