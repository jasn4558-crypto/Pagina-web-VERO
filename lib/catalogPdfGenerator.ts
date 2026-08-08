import { jsPDF } from "jspdf";

export interface CatalogProduct {
  id: string;
  nombre: string;
  precio: number;
  imagenes: string[];
  categoria_id: string;
}

export interface CatalogCategory {
  id: string;
  nombre: string;
}

async function loadImgAsDataUrl(
  url?: string
): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
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

export async function generateCatalogPDF(
  categories: CatalogCategory[],
  products: CatalogProduct[],
  onProgress?: (progress: number) => void
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const productsPerCat: Record<string, CatalogProduct[]> = {};
  categories.forEach((cat) => {
    productsPerCat[cat.id] = products.filter((p) => p.categoria_id === cat.id);
  });

  const activeCategories = categories.filter((c) => productsPerCat[c.id]?.length > 0);
  
  let currentPage = 1;
  const PRODS_PER_PAGE = 8;
  
  let tempPageCounter = 2; // Categories start on page 2
  const calculatedIndex: { catName: string; startPage: number }[] = [];
  
  activeCategories.forEach((cat) => {
    calculatedIndex.push({ catName: cat.nombre, startPage: tempPageCounter });
    const catProducts = productsPerCat[cat.id] || [];
    const pagesNeeded = Math.ceil(catProducts.length / PRODS_PER_PAGE);
    tempPageCounter += pagesNeeded;
  });

  // PAGE 1: Cover and Index
  doc.setFillColor(16, 185, 129); // Emerald-600
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("CATÁLOGO DE PRODUCTOS", 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Tienda Verónica", 105, 30, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Índice de Categorías", 20, 60);

  let indexY = 75;
  doc.setFontSize(12);
  calculatedIndex.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.text(item.catName, 20, indexY);
    
    // Create dots manually
    const dotStr = ".".repeat(100);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    // Draw dots, clipped by length, just an approximation
    doc.text(dotStr, 60, indexY, { maxWidth: 100 }); 
    
    doc.setTextColor(30, 41, 59);
    doc.text(`Pág. ${item.startPage}`, 180, indexY, { align: "right" });
    indexY += 10;
  });

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Página 1`, 105, 285, { align: "center" });

  const allImagesToLoad = products.map((p) => p.imagenes[0]).filter(Boolean);
  const loadedImages: Record<string, { dataUrl: string; format: "JPEG" | "PNG" } | null> = {};
  
  let loadedCount = 0;
  const chunkSize = 5;
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

  activeCategories.forEach((cat) => {
    const catProducts = productsPerCat[cat.id] || [];
    const totalPages = Math.ceil(catProducts.length / PRODS_PER_PAGE);

    for (let p = 0; p < totalPages; p++) {
      doc.addPage();
      currentPage++;

      doc.setFillColor(241, 245, 249);
      doc.rect(0, 0, 210, 25, "F");
      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(cat.nombre.toUpperCase(), 105, 16, { align: "center" });

      const startIndex = p * PRODS_PER_PAGE;
      const pageProducts = catProducts.slice(startIndex, startIndex + PRODS_PER_PAGE);

      const marginX = 20;
      let startY = 35;
      const colWidth = 80;
      const rowHeight = 60;
      
      pageProducts.forEach((prod, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        
        const x = marginX + col * 90;
        const y = startY + row * rowHeight;

        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, colWidth, rowHeight - 5, 2, 2, "S");

        const imgUrl = prod.imagenes[0];
        const imgData = imgUrl ? loadedImages[imgUrl] : null;

        if (imgData) {
          try {
            doc.addImage(imgData.dataUrl, imgData.format, x + 2, y + 2, colWidth - 4, 38);
          } catch (e) {
            doc.setFillColor(241, 245, 249);
            doc.rect(x + 2, y + 2, colWidth - 4, 38, "F");
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(x + 2, y + 2, colWidth - 4, 38, "F");
        }

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const truncName = doc.splitTextToSize(prod.nombre, colWidth - 6);
        doc.text(truncName, x + 3, y + 45);

        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`CRC ${prod.precio.toLocaleString("es-CR")}`, x + 3, y + 52);
      });

      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Página ${currentPage}`, 105, 285, { align: "center" });
    }
  });

  doc.save("Catalogo_Tienda_Veronica.pdf");
}
