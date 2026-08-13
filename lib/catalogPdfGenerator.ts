import { jsPDF } from "jspdf";
import { getHeaderConfig } from "./configManager";

export interface CatalogProduct {
  id: string;
  nombre: string;
  precio: number;
  precioOriginal?: number;
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

// ─────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────

async function loadImgAsDataUrl(url?: string): Promise<LoadedImageData | null> {
  if (!url || typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 6000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const w = img.naturalWidth || 300;
        const h = img.naturalHeight || 300;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.88), format: "JPEG", width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

/** Dibuja imagen centrada y con ratio correcto dentro de un box */
function drawImageFit(
  doc: jsPDF,
  imgData: LoadedImageData,
  boxX: number, boxY: number,
  boxW: number, boxH: number
) {
  const ratio = Math.min(boxW / imgData.width, boxH / imgData.height);
  const fitW = imgData.width * ratio;
  const fitH = imgData.height * ratio;
  doc.addImage(
    imgData.dataUrl, imgData.format,
    boxX + (boxW - fitW) / 2,
    boxY + (boxH - fitH) / 2,
    fitW, fitH
  );
}

/**
 * Limpia el texto para jsPDF/Helvetica:
 * elimina emojis y cualquier caracter fuera del rango Latin-1 (U+0000–U+00FF)
 * que causaria caracteres basura en el PDF.
 */
function pdfSafe(text: string): string {
  if (!text) return "";
  
  // 1. Reemplazar etiquetas de lista con saltos y guiones
  let parsed = text
    .replace(/<li>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>?/gm, "") // Remover cualquier otra etiqueta HTML
    .replace(/&nbsp;/g, " ");
    
  // 2. Limpiar caracteres inválidos para jsPDF Helvetica y colapsar espacios (no saltos de línea)
  return parsed
    .replace(/[^\u0000-\u00FF\n\-]/g, "") // Mantener saltos de linea y guiones
    .replace(/[ \t]+/g, " ") // Colapsar multiples espacios y tabs
    .replace(/\n\s*\n+/g, "\n") // Colapsar multiples saltos de linea
    .trim();
}

/**
 * Dibuja texto (ya sanitizado) limitado a maxLines.
 * Retorna la Y donde termino el ultimo renglon.
 */
function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const safe = pdfSafe(text);
  if (!safe) return y;
  const raw = doc.splitTextToSize(safe, maxWidth) as string[];
  const lines = raw.slice(0, maxLines);
  // Solo agrega '...' si realmente habia mas contenido
  if (raw.length > maxLines && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length > 3 ? last.slice(0, -3).trimEnd() + "..." : last + "...";
  }
  lines.forEach((line, i) => doc.text(line, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

// ─────────────────────────────────────────────────────
// GENERADOR PRINCIPAL
// ─────────────────────────────────────────────────────

export async function generateCatalogPDF(
  categories: CatalogCategory[],
  subcategories: CatalogSubcategory[],
  products: CatalogProduct[],
  onProgress?: (progress: number) => void
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Nombre de tienda desde configuracion (sanitizado para PDF)
  const headerConfig = await getHeaderConfig();
  const storeName   = pdfSafe(`${headerConfig.titulo_principal} ${headerConfig.titulo_destacado}`.trim().toUpperCase()) || "TIENDA";
  const storeTagline = pdfSafe(headerConfig.descripcion || "");

  // Paleta de colores
  const C_EMERALD:  [number,number,number] = [16, 185, 129];
  const C_DARK:     [number,number,number] = [15, 23, 42];
  const C_MID:      [number,number,number] = [71, 85, 105];
  const C_LIGHT:    [number,number,number] = [241, 245, 249];
  const C_BORDER:   [number,number,number] = [210, 218, 228];
  const C_WHITE:    [number,number,number] = [255, 255, 255];

  // ── Agrupar por categoria / subcategoria ──
  interface Group {
    catName: string;
    subcatName?: string;
    products: CatalogProduct[];
  }
  const groups: Group[] = [];

  categories.forEach((cat) => {
    const catProds = products.filter((p) => p.categoria_id === cat.id);
    if (!catProds.length) return;

    const catSubcats = subcategories.filter((s) => s.categoria_id === cat.id);
    const usedSubcats = new Set<string>();

    catSubcats.forEach((sub) => {
      const sp = catProds.filter((p) => p.subcategoria_id === sub.id);
      if (sp.length) {
        usedSubcats.add(sub.id);
        groups.push({ catName: cat.nombre, subcatName: sub.nombre, products: sp });
      }
    });

    const rest = catProds.filter((p) => !p.subcategoria_id || !usedSubcats.has(p.subcategoria_id));
    if (rest.length) {
      groups.push({ catName: cat.nombre, subcatName: catSubcats.length ? "General" : undefined, products: rest });
    }
  });

  if (!groups.length) { alert("No hay productos con categoría para generar el catálogo."); return; }

  const PRODS_PER_PAGE = 4;

  // ── Pre-calcular paginas para el indice ──
  let tempPage = 2;
  const indexEntries: { label: string; isHeader: boolean; page: number }[] = [];
  let prevCat = "";
  groups.forEach((g) => {
    if (g.catName !== prevCat) {
      prevCat = g.catName;
      indexEntries.push({ label: g.catName, isHeader: true, page: tempPage });
    }
    if (g.subcatName) {
      indexEntries.push({ label: `  ${g.subcatName}`, isHeader: false, page: tempPage });
    }
    tempPage += Math.ceil(g.products.length / PRODS_PER_PAGE);
  });

  // ═══════════════════════════════════════════════════
  // PAGINA 1 — PORTADA + INDICE
  // ═══════════════════════════════════════════════════

  // Banner oscuro
  doc.setFillColor(...C_DARK);
  doc.rect(0, 0, 210, 52, "F");
  doc.setFillColor(...C_EMERALD);
  doc.rect(0, 44, 210, 8, "F");

  // Nombre tienda
  doc.setTextColor(...C_WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(storeName, 105, 24, { align: "center" });

  // Tagline
  if (storeTagline) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(190, 235, 215);
    const tLines = doc.splitTextToSize(storeTagline, 165) as string[];
    doc.text(tLines.slice(0, 2) as string[], 105, 33, { align: "center" });
  }

  // "CATALOGO DE PRODUCTOS" en la franja verde
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("CATALOGO DE PRODUCTOS", 105, 50, { align: "center" });

  // Fecha
  const fecha = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_MID);
  doc.text(`Generado el ${fecha}`, 105, 62, { align: "center" });

  // Titulo indice
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_DARK);
  doc.text("INDICE DE CATEGORIAS", 18, 74);

  doc.setDrawColor(...C_EMERALD);
  doc.setLineWidth(0.7);
  doc.line(18, 76, 192, 76);
  doc.setLineWidth(0.2);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...C_MID);
  doc.text("Toca una categoria para ir directamente a esa seccion.", 18, 82);

  let iy = 90;
  indexEntries.forEach((entry) => {
    if (iy > 272) return;
    if (entry.isHeader) {
      doc.setFillColor(...C_LIGHT);
      doc.roundedRect(18, iy - 4, 174, 9, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...C_EMERALD);
      doc.text(entry.label.toUpperCase(), 23, iy + 2.5);

      doc.setTextColor(...C_MID);
      doc.text(`Pag. ${entry.page}`, 188, iy + 2.5, { align: "right" });
      doc.link(18, iy - 4, 174, 9, { pageNumber: entry.page });
      iy += 12;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C_DARK);
      doc.text(entry.label, 26, iy);

      doc.setTextColor(...C_MID);
      doc.text(`Pag. ${entry.page}`, 188, iy, { align: "right" });

      // Linea punteada
      doc.setDrawColor(...C_BORDER);
      doc.setLineDashPattern([0.5, 2], 0);
      const lw = doc.getTextWidth(entry.label);
      doc.line(26 + lw + 3, iy - 0.5, 180, iy - 0.5);
      doc.setLineDashPattern([], 0);

      doc.link(26, iy - 4, 162, 7, { pageNumber: entry.page });
      iy += 9;
    }
  });

  // Pie portada
  doc.setFillColor(...C_DARK);
  doc.rect(0, 281, 210, 16, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_WHITE);
  doc.text(`${storeName}  |  Precios en CRC  |  Envio a coordinar`, 105, 291, { align: "center" });

  // ═══════════════════════════════════════════════════
  // CARGAR TODAS LAS IMAGENES
  // ═══════════════════════════════════════════════════
  const allUrls = new Set<string>();
  products.forEach((p) => (p.imagenes || []).forEach((u) => { if (u) allUrls.add(u); }));
  const urlArr = Array.from(allUrls);
  const loadedImages: Record<string, LoadedImageData | null> = {};

  const CHUNK = 4;
  for (let i = 0; i < urlArr.length; i += CHUNK) {
    const chunk = urlArr.slice(i, i + CHUNK);
    const results = await Promise.all(chunk.map((u) => loadImgAsDataUrl(u)));
    chunk.forEach((u, idx) => { loadedImages[u] = results[idx]; });
    onProgress?.(Math.floor(((i + CHUNK) / urlArr.length) * 100));
  }

  // ═══════════════════════════════════════════════════
  // PAGINAS DE PRODUCTOS
  // Layout FIJO (todas las posiciones relativas a cardY):
  //
  //   cardY + 2          → imagen (IMG_H = 50mm)
  //   cardY + 54         → fila de miniaturas (10mm, siempre reservada)
  //   cardY + 65.5       → linea separadora
  //   cardY + 68         → nombre producto (2 lineas, lh=5mm → hasta y+78)
  //   cardY + 79         → descripcion (3 lineas, lh=4mm → hasta y+91)
  //   cardY + 109        → precio (barra esmeralda, h=9mm → hasta y+118)
  //   cardY + 120        → fin de tarjeta
  //
  //  START_Y = 28; CARD_H = 120; ROW_GAP = 5; CARD_W = 86; COL_GAP = 8; MARGIN_X = 15
  //  2 filas: 28 + 2*(120+5) = 28+250 = 278 ✓ (< 281 pie de pagina)
  // ═══════════════════════════════════════════════════
  const CARD_W  = 86;
  const CARD_H  = 120;
  const COL_GAP = 8;
  const ROW_GAP = 5;
  const MARGIN_X = 15;
  const START_Y  = 28;

  const IMG_H  = 50;
  const IMG_W  = CARD_W - 4; // 82mm

  // Posiciones relativas fijas
  const REL_IMG_Y      = 2;       // imagen empieza aquí
  const REL_MINI_Y     = 54;      // miniaturas (siempre 10mm reservados)
  const MINI_H         = 10;
  const REL_SEP_Y      = 65;      // línea separadora
  const REL_NAME_Y     = 69;      // nombre empieza aquí
  const NAME_LH        = 4.8;     // interlineado nombre
  const NAME_LINES     = 2;
  const REL_DESC_Y     = 79;      // descripción empieza aquí
  const DESC_LH        = 3.8;     // interlineado descripción
  // Espacio disponible: REL_PRICE_Y - REL_DESC_Y = 30mm → máx 7 líneas a 3.8mm
  const DESC_LINES     = Math.floor((109 - 79) / 3.8); // = 7
  const REL_PRICE_Y    = 109;     // barra de precio
  const PRICE_H        = 9;

  groups.forEach((group) => {
    const totalPages = Math.ceil(group.products.length / PRODS_PER_PAGE);
    const sectionTitle = group.subcatName
      ? `${group.catName.toUpperCase()}  /  ${group.subcatName.toUpperCase()}`
      : group.catName.toUpperCase();

    for (let p = 0; p < totalPages; p++) {
      doc.addPage();
      const pageNum = doc.getNumberOfPages();

      // ── Encabezado de página ──
      doc.setFillColor(...C_DARK);
      doc.rect(0, 0, 210, 22, "F");
      doc.setFillColor(...C_EMERALD);
      doc.rect(0, 18, 210, 4, "F");

      // Nombre tienda (izquierda, pequeño)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160, 200, 185);
      doc.text(storeName, 15, 9);

      // Titulo de seccion
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...C_WHITE);
      doc.text(sectionTitle, 105, 14.5, { align: "center" });

      // Boton "↑ Indice" — clic vuelve a pag 1
      const btnW = 26;
      const btnH = 6;
      const btnX = 210 - btnW - 5;
      const btnY = 5;
      doc.setFillColor(...C_EMERALD);
      doc.roundedRect(btnX, btnY, btnW, btnH, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...C_WHITE);
      doc.text("^ Indice", btnX + btnW / 2, btnY + 4, { align: "center" });
      doc.link(btnX, btnY, btnW, btnH, { pageNumber: 1 });

      // ── Productos ──
      const pageProducts = group.products.slice(p * PRODS_PER_PAGE, (p + 1) * PRODS_PER_PAGE);

      pageProducts.forEach((prod, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const cardX = MARGIN_X + col * (CARD_W + COL_GAP);
        const cardY = START_Y + row * (CARD_H + ROW_GAP);

        // ── Sombra suave de tarjeta (pequeño rect offset) ──
        doc.setFillColor(220, 225, 232);
        doc.roundedRect(cardX + 1.5, cardY + 1.5, CARD_W, CARD_H, 3, 3, "F");

        // ── Tarjeta blanca ──
        doc.setFillColor(...C_WHITE);
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.25);
        doc.roundedRect(cardX, cardY, CARD_W, CARD_H, 3, 3, "FD");

        const imagenes = prod.imagenes || [];
        const mainUrl  = imagenes[0];
        const mainImg  = mainUrl ? loadedImages[mainUrl] : null;

        // ── Fondo de imagen ──
        doc.setFillColor(...C_LIGHT);
        doc.roundedRect(cardX + 2, cardY + REL_IMG_Y, IMG_W, IMG_H, 2, 2, "F");

        // ── Imagen principal con ratio correcto ──
        if (mainImg) {
          try { drawImageFit(doc, mainImg, cardX + 2, cardY + REL_IMG_Y, IMG_W, IMG_H); } catch { /* skip */ }
        }

        // ── Borde de imagen (sutil, para recortes perfectos) ──
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX + 2, cardY + REL_IMG_Y, IMG_W, IMG_H, 2, 2, "S");

        // ── Miniaturas (siempre en REL_MINI_Y, máx 5) ──
        const extras = imagenes.slice(1, 6);
        if (extras.length > 0) {
          const MINI_W  = Math.min(10, (IMG_W - (extras.length - 1) * 2) / extras.length);
          const totalW  = extras.length * MINI_W + (extras.length - 1) * 2;
          let mx        = cardX + 2 + (IMG_W - totalW) / 2;
          const my      = cardY + REL_MINI_Y;

          extras.forEach((url) => {
            const mi = loadedImages[url];
            doc.setFillColor(...C_LIGHT);
            doc.setDrawColor(...C_BORDER);
            doc.setLineWidth(0.2);
            doc.roundedRect(mx, my, MINI_W, MINI_H, 1, 1, "FD");
            if (mi) {
              try { drawImageFit(doc, mi, mx, my, MINI_W, MINI_H); } catch { /* skip */ }
              // Borde sobre miniatura
              doc.setDrawColor(...C_BORDER);
              doc.roundedRect(mx, my, MINI_W, MINI_H, 1, 1, "S");
            }
            mx += MINI_W + 2;
          });

          // Indicador "+ más fotos" si tiene más de 5
          if (imagenes.length > 6) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(5.5);
            doc.setTextColor(...C_MID);
            doc.text(`+${imagenes.length - 6} foto(s)`, cardX + CARD_W - 3, cardY + REL_MINI_Y + 7, { align: "right" });
          }
        }

        // ── Linea separadora ──
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.2);
        doc.line(cardX + 4, cardY + REL_SEP_Y, cardX + CARD_W - 4, cardY + REL_SEP_Y);

        // ── Nombre del producto (2 lineas max) ──
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C_DARK);
        drawText(doc, pdfSafe(prod.nombre), cardX + 4, cardY + REL_NAME_Y, CARD_W - 8, NAME_LH, NAME_LINES);

        // ── Descripcion (hasta 7 lineas, sin truncar si cabe) ──
        const desc = pdfSafe(prod.descripcion || "");
        if (desc) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(...C_MID);
          drawText(doc, desc, cardX + 4, cardY + REL_DESC_Y, CARD_W - 8, DESC_LH, DESC_LINES);
        }

        // ── Barra de precio (posicion fija) ──
        if (prod.precioOriginal) {
          // Fondo rojo para indicar oferta
          doc.setFillColor(225, 29, 72); // rose-600
          doc.roundedRect(cardX + 3, cardY + REL_PRICE_Y, CARD_W - 6, PRICE_H, 2, 2, "F");

          // Precio original tachado (blanco opaco a la izquierda)
          const origText = `CRC ${prod.precioOriginal.toLocaleString("es-CR")}`;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(255, 200, 200); // rosa claro
          const origW = doc.getTextWidth(origText);
          const totalW = origW; // solo orig de momento, agregaremos nuevo precio
          // Centrar: precio nuevo sera principal
          const origX = cardX + CARD_W / 2 - origW - 1;
          const priceBaseY = cardY + REL_PRICE_Y + 6.2;
          doc.text(origText, origX, priceBaseY);
          // Linea de tachado sobre el texto original
          doc.setDrawColor(255, 180, 180);
          doc.setLineWidth(0.35);
          doc.line(origX, priceBaseY - 1.5, origX + origW, priceBaseY - 1.5);

          // Precio con descuento (blanco, bold, derecha)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...C_WHITE);
          doc.text(
            `CRC ${prod.precio.toLocaleString("es-CR")}`,
            cardX + CARD_W / 2 + 1,
            priceBaseY,
            { align: "left" }
          );

          // Badge "OFERTA" en imagen
          doc.setFillColor(225, 29, 72);
          doc.roundedRect(cardX + 3, cardY + REL_IMG_Y + 2, 18, 5, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(5.5);
          doc.setTextColor(...C_WHITE);
          doc.text("OFERTA", cardX + 3 + 9, cardY + REL_IMG_Y + 5.5, { align: "center" });
        } else {
          doc.setFillColor(...C_EMERALD);
          doc.roundedRect(cardX + 3, cardY + REL_PRICE_Y, CARD_W - 6, PRICE_H, 2, 2, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...C_WHITE);
          doc.text(
            `CRC ${prod.precio.toLocaleString("es-CR")}`,
            cardX + CARD_W / 2,
            cardY + REL_PRICE_Y + 6.2,
            { align: "center" }
          );
        }
      });

      // ── Pie de pagina ──
      doc.setFillColor(...C_DARK);
      doc.rect(0, 281, 210, 16, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 200, 185);
      doc.text(storeName, 15, 291);

      doc.setTextColor(...C_WHITE);
      doc.text(sectionTitle, 105, 291, { align: "center" });
      doc.text(`Pag. ${pageNum}`, 195, 291, { align: "right" });
    }
  });

  // Guardar con nombre de tienda
  const fileName = storeName.replace(/\s+/g, "_").toLowerCase();
  doc.save(`Catalogo_${fileName}.pdf`);
}
