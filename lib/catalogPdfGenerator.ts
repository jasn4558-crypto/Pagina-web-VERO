import { jsPDF } from "jspdf";

export interface CatalogProduct {
  id: string;
  nombre: string;
  precio: number;
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
    const timer = setTimeout(() => resolve(null), 3500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const width = img.naturalWidth || 200;
        const height = img.naturalHeight || 200;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ dataUrl, format: "JPEG", width, height });
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

export async function generateCatalogPDF(
  categories: CatalogCategory[],
  subcategories: CatalogSubcategory[],
  products: CatalogProduct[],
  onProgress?: (progress: number) => void
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const PRODS_PER_PAGE = 8;

  // Organizar categorías, subcategorías y productos
  const subcatMap = new Map<string, CatalogSubcategory>();
  subcategories.forEach((s) => subcatMap.set(s.id, s));

  // Agrupar por categoría y subcategoría
  // Clave de grupo: `${catId}_${subcatId || 'general'}`
  interface Group {
    key: string;
    catName: string;
    subcatName?: string;
    products: CatalogProduct[];
  }

  const groups: Group[] = [];

  categories.forEach((cat) => {
    const catProducts = products.filter((p) => p.categoria_id === cat.id);
    if (catProducts.length === 0) return;

    // Obtener subcategorías asociadas que tengan productos
    const catSubcats = subcategories.filter((s) => s.categoria_id === cat.id);
    const usedSubcatIds = new Set<string>();

    catSubcats.forEach((subcat) => {
      const subProducts = catProducts.filter((p) => p.subcategoria_id === subcat.id);
      if (subProducts.length > 0) {
        usedSubcatIds.add(subcat.id);
        groups.push({
          key: `${cat.id}_${subcat.id}`,
          catName: cat.nombre,
          subcatName: subcat.nombre,
          products: subProducts,
        });
      }
    });

    // Productos sin subcategoría (General)
    const sinSubcatProds = catProducts.filter(
      (p) => !p.subcategoria_id || !usedSubcatIds.has(p.subcategoria_id)
    );
    if (sinSubcatProds.length > 0) {
      groups.push({
        key: `${cat.id}_general`,
        catName: cat.nombre,
        subcatName: catSubcats.length > 0 ? "General / Varios" : undefined,
        products: sinSubcatProds,
      });
    }
  });

  if (groups.length === 0) {
    alert("No hay productos con categoría para generar el catálogo.");
    return;
  }

  // Precalculo de páginas para el Índice interactivo
  let tempPageCounter = 2; // El catálogo comienza en pág. 2 (Pág. 1 es Portada + Índice)
  const indexEntries: { label: string; isHeader: boolean; startPage: number }[] = [];

  let currentCatHeader = "";
  groups.forEach((g) => {
    if (g.catName !== currentCatHeader) {
      currentCatHeader = g.catName;
      indexEntries.push({ label: g.catName, isHeader: true, startPage: tempPageCounter });
    }
    if (g.subcatName) {
      indexEntries.push({ label: `  • ${g.subcatName}`, isHeader: false, startPage: tempPageCounter });
    }

    const pagesNeeded = Math.ceil(g.products.length / PRODS_PER_PAGE);
    tempPageCounter += pagesNeeded;
  });

  // PÁGINA 1: Portada e Índice
  doc.setFillColor(16, 185, 129); // Emerald-600
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("CATÁLOGO DE PRODUCTOS", 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Tienda Verónica", 105, 30, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Índice Interactivo (Toca una categoría para ir a la página)", 20, 54);

  let indexY = 65;
  doc.setFontSize(11);

  indexEntries.forEach((entry) => {
    if (indexY > 270) return; // Evitar desbordamiento en índice

    if (entry.isHeader) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(entry.label, 20, indexY);
      
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(`Pág. ${entry.startPage}`, 185, indexY, { align: "right" });

      // ENLACE INTERACTIVO EN EL PDF (Tocar salta a la página)
      doc.link(20, indexY - 4, 165, 6, { pageNumber: entry.startPage });
      indexY += 8;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(entry.label, 24, indexY);

      doc.setTextColor(100, 116, 139);
      doc.text(`Pág. ${entry.startPage}`, 185, indexY, { align: "right" });

      // ENLACE INTERACTIVO EN EL PDF
      doc.link(24, indexY - 4, 161, 6, { pageNumber: entry.startPage });
      indexY += 7;
    }
  });

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Página 1", 105, 287, { align: "center" });

  // Cargar imágenes de productos manteniendo aspecto natural
  const allImagesToLoad = products.map((p) => p.imagenes[0]).filter(Boolean);
  const loadedImages: Record<string, LoadedImageData | null> = {};

  let loadedCount = 0;
  const chunkSize = 6;
  for (let i = 0; i < allImagesToLoad.length; i += chunkSize) {
    const chunk = allImagesToLoad.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map((url) => loadImgAsDataUrl(url)));
    chunk.forEach((url, idx) => {
      if (url) loadedImages[url] = results[idx];
    });
    loadedCount += chunk.length;
    if (onProgress) {
      onProgress(Math.floor((loadedCount / allImagesToLoad.length) * 100));
    }
  }

  // Renderizar Páginas de Productos
  let currentPage = 1;

  groups.forEach((group) => {
    const totalPages = Math.ceil(group.products.length / PRODS_PER_PAGE);

    for (let p = 0; p < totalPages; p++) {
      doc.addPage();
      currentPage++;

      // Encabezado de la página
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 0, 210, 25, "F");

      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);

      const headerTitle = group.subcatName
        ? `${group.catName.toUpperCase()} — ${group.subcatName.toUpperCase()}`
        : group.catName.toUpperCase();

      doc.text(headerTitle, 105, 16, { align: "center" });

      const startIndex = p * PRODS_PER_PAGE;
      const pageProducts = group.products.slice(startIndex, startIndex + PRODS_PER_PAGE);

      const marginX = 18;
      const startY = 32;
      const colWidth = 84;
      const rowHeight = 60;

      pageProducts.forEach((prod, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const x = marginX + col * 90;
        const y = startY + row * rowHeight;

        // Tarjeta de producto
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, colWidth, rowHeight - 4, 2, 2, "S");

        const imgUrl = prod.imagenes[0];
        const imgData = imgUrl ? loadedImages[imgUrl] : null;

        // Contenedor de la imagen (80mm ancho x 36mm alto)
        const maxW = colWidth - 4; // 80mm
        const maxH = 36; // 36mm

        if (imgData && imgData.width && imgData.height) {
          try {
            // CALCULAR ASPECT RATIO REAL SIN DISTORSIÓN
            const ratio = Math.min(maxW / imgData.width, maxH / imgData.height);
            const fitW = imgData.width * ratio;
            const fitH = imgData.height * ratio;
            const imgX = x + 2 + (maxW - fitW) / 2;
            const imgY = y + 2 + (maxH - fitH) / 2;

            doc.addImage(imgData.dataUrl, imgData.format, imgX, imgY, fitW, fitH);
          } catch (e) {
            doc.setFillColor(241, 245, 249);
            doc.rect(x + 2, y + 2, maxW, maxH, "F");
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(x + 2, y + 2, maxW, maxH, "F");
        }

        // Nombre del producto
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        const truncName = doc.splitTextToSize(prod.nombre, colWidth - 6);
        doc.text(truncName, x + 3, y + 43);

        // Precio del producto
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(`CRC ${prod.precio.toLocaleString("es-CR")}`, x + 3, y + 51);
      });

      // Pie de página
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Página ${currentPage}`, 105, 287, { align: "center" });
    }
  });

  doc.save("Catalogo_Tienda_Veronica.pdf");
}
