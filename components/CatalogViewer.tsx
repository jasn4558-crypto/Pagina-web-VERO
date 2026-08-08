"use client";

import { useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Download, BookOpen, Loader2 } from "lucide-react";
import { generateCatalogPDF, CatalogCategory, CatalogProduct } from "@/lib/catalogPdfGenerator";

interface CatalogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

export default function CatalogViewer({ isOpen, onClose, categories, products }: CatalogViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const PRODS_PER_PAGE = 6;

  // Organizar productos por categoría y calcular páginas
  const { activeCategories, pages, indexMap } = useMemo(() => {
    const productsPerCat: Record<string, CatalogProduct[]> = {};
    categories.forEach((cat) => {
      productsPerCat[cat.id] = products.filter((p) => p.categoria_id === cat.id);
    });

    const active = categories.filter((c) => productsPerCat[c.id]?.length > 0);
    const calculatedPages: { type: "index" | "category"; cat?: CatalogCategory; products?: CatalogProduct[] }[] = [];
    const calculatedIndex: { catId: string; catName: string; pageIndex: number }[] = [];

    // Pagina 0 es el índice (type: "index")
    calculatedPages.push({ type: "index" });

    active.forEach((cat) => {
      const catProducts = productsPerCat[cat.id] || [];
      calculatedIndex.push({ catId: cat.id, catName: cat.nombre, pageIndex: calculatedPages.length });

      for (let i = 0; i < catProducts.length; i += PRODS_PER_PAGE) {
        calculatedPages.push({
          type: "category",
          cat: cat,
          products: catProducts.slice(i, i + PRODS_PER_PAGE),
        });
      }
    });

    return { activeCategories: active, pages: calculatedPages, indexMap: calculatedIndex };
  }, [categories, products]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress(0);
    try {
      await generateCatalogPDF(categories, products, (progress) => {
        setPdfProgress(progress);
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const goToCategory = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const currentPageData = pages[currentPage];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 p-2 sm:p-6 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-stone-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-stone-900">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold sm:text-lg">Catálogo de Productos</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {pdfProgress}%
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Descargar PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido del Libro */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            {currentPageData.type === "index" ? (
              <div className="flex-1 animate-in fade-in duration-300">
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-black text-emerald-600 sm:text-3xl uppercase tracking-tight">
                    Tienda Verónica
                  </h1>
                  <p className="mt-1 text-sm text-stone-500">Catálogo Completo</p>
                </div>

                <h3 className="mb-4 border-b border-stone-100 pb-2 text-lg font-bold text-stone-800">
                  Índice de Categorías
                </h3>
                <ul className="space-y-3">
                  {indexMap.map((idxItem) => (
                    <li key={idxItem.catId}>
                      <button
                        onClick={() => goToCategory(idxItem.pageIndex)}
                        className="group flex w-full items-center justify-between text-left hover:text-emerald-600"
                      >
                        <span className="font-semibold text-stone-700 transition-colors group-hover:text-emerald-600">
                          {idxItem.catName}
                        </span>
                        <div className="mx-4 flex-1 border-b-2 border-dotted border-stone-200 opacity-50 group-hover:border-emerald-200" />
                        <span className="text-sm font-medium text-stone-400 group-hover:text-emerald-500">
                          Pág. {idxItem.pageIndex + 1}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <h3 className="mb-6 border-b border-emerald-100 pb-3 text-center text-xl font-bold uppercase text-emerald-600">
                  {currentPageData.cat?.nombre}
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {currentPageData.products?.map((prod) => (
                    <div key={prod.id} className="flex flex-col items-center gap-2 rounded-xl border border-stone-100 p-2 shadow-sm">
                      <div className="aspect-square w-full overflow-hidden rounded-lg bg-stone-100">
                        {prod.imagenes[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imagenes[0]}
                            alt={prod.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            No img
                          </div>
                        )}
                      </div>
                      <p className="line-clamp-2 w-full text-center text-xs font-semibold text-stone-800">
                        {prod.nombre}
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        ₡{prod.precio.toLocaleString("es-CR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navegación inferior */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          
          <div className="text-sm font-medium text-stone-500">
            Pág. {currentPage + 1} de {pages.length}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-30"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
