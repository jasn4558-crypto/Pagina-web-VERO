"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Check, Sparkles, Tag, Layers } from "lucide-react";
import { useCart } from "./CartProvider";

export interface ProductDetail {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  categoriaNombre?: string;
  subcategoriaNombre?: string;
}

interface ProductDetailModalProps {
  product: ProductDetail | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedImgIndex(0);
    setQuantity(1);
    setAdded(false);
  }, [product]);

  if (!product) return null;

  const images = product.imagenes && product.imagenes.length > 0 ? product.imagenes : [];
  const currentImage = images[selectedImgIndex] || "";

  const prevImage = () => {
    if (images.length <= 1) return;
    setSelectedImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setSelectedImgIndex((prev) => (prev + 1) % images.length);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: currentImage || images[0] || "",
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-900/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-stone-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/60 text-white backdrop-blur-md transition-all hover:bg-stone-900 hover:scale-105 active:scale-95 shadow-md"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          {/* GALERÍA DE IMÁGENES */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-stone-100 flex items-center justify-center overflow-hidden">
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt={product.nombre}
                className="h-full w-full object-contain transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-400">
                <span className="text-5xl">🛍️</span>
                <span className="text-xs font-semibold">Sin imagen</span>
              </div>
            )}

            {/* Badges y Contadores */}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase text-white shadow-md">
                <Sparkles className="h-3 w-3" />
                Destacado
              </span>
            </div>

            {images.length > 1 && (
              <div className="absolute right-3 bottom-3 z-10 rounded-full bg-stone-900/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm shadow-md">
                {selectedImgIndex + 1} / {images.length}
              </div>
            )}

            {/* Flechas de navegación en imagen grande */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* MINIATURAS ALINEADAS */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto bg-stone-50 p-3 border-b border-stone-100 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    idx === selectedImgIndex
                      ? "border-emerald-600 ring-2 ring-emerald-600/30 scale-105"
                      : "border-stone-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* INFORMACIÓN DEL PRODUCTO */}
          <div className="p-5 sm:p-7 space-y-4">
            {/* Categorías y Subcategorías */}
            {(product.categoriaNombre || product.subcategoriaNombre) && (
              <div className="flex flex-wrap items-center gap-2">
                {product.categoriaNombre && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                    <Layers className="h-3 w-3 text-emerald-600" />
                    {product.categoriaNombre}
                  </span>
                )}
                {product.subcategoriaNombre && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                    <Tag className="h-3 w-3 text-emerald-600" />
                    {product.subcategoriaNombre}
                  </span>
                )}
              </div>
            )}

            {/* Título y Precio */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                {product.nombre}
              </h2>
              <p className="mt-2 text-2xl font-black text-emerald-600">
                ₡{product.precio.toLocaleString("es-CR")}
              </p>
            </div>

            {/* Descripción */}
            {product.descripcion && (
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-1">
                  Descripción
                </h4>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {product.descripcion}
                </p>
              </div>
            )}

            {/* Selector de Cantidad y Botón Añadir */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-stone-400">Cantidad:</span>
                <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm hover:bg-stone-100 active:scale-95 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-stone-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm hover:bg-stone-100 active:scale-95 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                  added
                    ? "bg-emerald-700 scale-105"
                    : "bg-stone-900 hover:bg-emerald-600 hover:shadow-emerald-600/20"
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    ¡Agregado al carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Agregar al carrito (₡{(product.precio * quantity).toLocaleString("es-CR")})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
