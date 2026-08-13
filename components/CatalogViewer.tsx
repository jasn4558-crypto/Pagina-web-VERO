"use client";

import { useState, useMemo, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, BookOpen, Loader2, Tag, Layers } from "lucide-react";
import { generateCatalogPDF, CatalogCategory, CatalogSubcategory, CatalogProduct } from "@/lib/catalogPdfGenerator";
import { getHeaderConfig, DEFAULT_HEADER_CONFIG, HeaderConfig } from "@/lib/configManager";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

interface CatalogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  products: CatalogProduct[];
}

export default function CatalogViewer({
  isOpen,
  onClose,
  categories,
  subcategories = [],
  products,
}: CatalogViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);

  useEffect(() => {
    getHeaderConfig().then((cfg) => setHeaderConfig(cfg));
  }, []);

  const PRODS_PER_PAGE = 6;

  // Organizar productos por Categoría y Subcategoría
  const { pages, indexMap } = useMemo(() => {
    interface PageItem {
      type: "index" | "products";
      catName?: string;
      subcatName?: string;
      products?: CatalogProduct[];
    }

    const calculatedPages: PageItem[] = [{ type: "index" }];
    const calculatedIndex: { label: string; isHeader: boolean; pageIndex: number }[] = [];

    const catMap = new Map<string, CatalogCategory>();
    categories.forEach((c) => catMap.set(c.id, c));

    const subcatMap = new Map<string, CatalogSubcategory>();
    subcategories.forEach((s) => subcatMap.set(s.id, s));

    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.categoria_id === cat.id);
      if (catProducts.length === 0) return;

      calculatedIndex.push({
        label: cat.nombre,
        isHeader: true,
        pageIndex: calculatedPages.length,
      });

      const catSubcats = subcategories.filter((s) => s.categoria_id === cat.id);
      const usedSubcatIds = new Set<string>();

      catSubcats.forEach((subcat) => {
        const subProducts = catProducts.filter((p) => p.subcategoria_id === subcat.id);
        if (subProducts.length > 0) {
          usedSubcatIds.add(subcat.id);
          calculatedIndex.push({
            label: subcat.nombre,
            isHeader: false,
            pageIndex: calculatedPages.length,
          });

          for (let i = 0; i < subProducts.length; i += PRODS_PER_PAGE) {
            calculatedPages.push({
              type: "products",
              catName: cat.nombre,
              subcatName: subcat.nombre,
              products: subProducts.slice(i, i + PRODS_PER_PAGE),
            });
          }
        }
      });

      // Productos de la categoría sin subcategoría asignada
      const sinSubcat = catProducts.filter(
        (p) => !p.subcategoria_id || !usedSubcatIds.has(p.subcategoria_id)
      );

      if (sinSubcat.length > 0) {
        if (catSubcats.length > 0) {
          calculatedIndex.push({
            label: "Otros productos",
            isHeader: false,
            pageIndex: calculatedPages.length,
          });
        }
        for (let i = 0; i < sinSubcat.length; i += PRODS_PER_PAGE) {
          calculatedPages.push({
            type: "products",
            catName: cat.nombre,
            subcatName: catSubcats.length > 0 ? "Otros" : undefined,
            products: sinSubcat.slice(i, i + PRODS_PER_PAGE),
          });
        }
      }
    });

    return { pages: calculatedPages, indexMap: calculatedIndex };
  }, [categories, subcategories, products]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress(0);
    try {
      await generateCatalogPDF(categories, subcategories, products, (progress) => {
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
    <>
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
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-all active:scale-95"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {pdfProgress}%
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Descargar PDF Interactivo</span>
                    <span className="sm:hidden">PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
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
                    <h1 className="text-2xl font-black text-stone-900 sm:text-3xl uppercase tracking-tight">
                      {headerConfig.titulo_principal}{" "}
                      <span className="italic font-light text-emerald-600">
                        {headerConfig.titulo_destacado}
                      </span>
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">Catálogo Completo por Categorías y Subcategorías</p>
                  </div>

                  <h3 className="mb-4 border-b border-stone-100 pb-2 text-lg font-bold text-stone-800">
                    Índice de Contenidos
                  </h3>

                  <ul className="space-y-2.5">
                    {indexMap.map((idxItem, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => goToCategory(idxItem.pageIndex)}
                          className={`group flex w-full items-center justify-between text-left hover:text-emerald-600 transition-all ${
                            idxItem.isHeader ? "pt-2 font-bold text-stone-900 text-base" : "pl-4 text-stone-600 text-sm"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 transition-colors group-hover:text-emerald-600">
                            {idxItem.isHeader ? (
                              <Layers className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <span className="text-emerald-500">•</span>
                            )}
                            {idxItem.label}
                          </span>
                          <div className="mx-3 flex-1 border-b-2 border-dotted border-stone-200 opacity-50 group-hover:border-emerald-200" />
                          <span className="text-xs font-semibold text-stone-400 group-hover:text-emerald-600 shrink-0">
                            Pág. {idxItem.pageIndex + 1}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-6 border-b border-emerald-100 pb-3 text-center">
                    <h3 className="text-xl font-bold uppercase text-emerald-600">
                      {currentPageData.catName}
                    </h3>
                    {currentPageData.subcatName && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                        <Tag className="h-3 w-3" />
                        {currentPageData.subcatName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {currentPageData.products?.map((prod) => {
                      const subcatObj = subcategories.find((s) => s.id === prod.subcategoria_id);
                      const catObj = categories.find((c) => c.id === prod.categoria_id);

                      return (
                        <div
                          key={prod.id}
                          onClick={() =>
                            setSelectedProduct({
                              ...prod,
                              descripcion: (prod as any).descripcion || "",
                              categoriaNombre: catObj?.nombre,
                              subcategoriaNombre: subcatObj?.nombre,
                            })
                          }
                          className="group flex flex-col items-center gap-2 rounded-xl border border-stone-100 p-2.5 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white"
                        >
                          <div className="aspect-square w-full overflow-hidden rounded-lg bg-stone-100 relative">
                            {prod.imagenes[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={prod.imagenes[0]}
                                alt={prod.nombre}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                No img
                              </div>
                            )}
                            {prod.precioOriginal && (
                              <span className="absolute top-1 left-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow">
                                OFERTA
                              </span>
                            )}
                            {prod.imagenes.length > 1 && (
                              <span className="absolute bottom-1 right-1 rounded-md bg-stone-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                                +{prod.imagenes.length - 1} fotos
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-2 w-full text-center text-xs font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">
                            {prod.nombre}
                          </p>
                          {/* Descripción con formato HTML */}
                          {(prod as any).descripcion && (
                            <div
                              className="w-full text-left text-[10px] leading-snug text-stone-500 line-clamp-3 [&>ul]:list-disc [&>ul]:ml-3 [&>ol]:list-decimal [&>ol]:ml-3 [&>li]:block [&>p]:block [&>b]:font-bold [&>strong]:font-bold [&>em]:italic [&>br]:block"
                              dangerouslySetInnerHTML={{ __html: (prod as any).descripcion }}
                            />
                          )}
                          {prod.precioOriginal ? (
                            <div className="flex flex-col items-center leading-tight">
                              <span className="text-[10px] text-stone-400 line-through">
                                ₡{prod.precioOriginal.toLocaleString("es-CR")}
                              </span>
                              <span className="text-sm font-bold text-rose-600">
                                ₡{prod.precio.toLocaleString("es-CR")}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-emerald-600">
                              ₡{prod.precio.toLocaleString("es-CR")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navegación inferior */}
          <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-4">
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <div className="text-sm font-medium text-stone-500">
              Pág. {currentPage + 1} de {pages.length}
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage === pages.length - 1}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-30 transition-all active:scale-95"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalle de producto si hace clic en uno dentro del catálogo */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
