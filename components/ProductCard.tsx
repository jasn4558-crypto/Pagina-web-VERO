"use client";

import { useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";

interface ProductCardProps {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
}

export default function ProductCard({
  id,
  nombre,
  precio,
  descripcion,
  imagenes,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [imgIndex, setImgIndex] = useState(0);

  const images = imagenes.length > 0 ? imagenes : [];
  const imagenPrincipal = images[0] ?? "";

  const prevImage = () => {
    if (images.length <= 1) return;
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setImgIndex((i) => (i + 1) % images.length);
  };

  const handleAddToCart = () => {
    addToCart({ id, nombre, precio, imagen: imagenPrincipal });
    toast.success("¡Producto agregado al carrito!", {
      description: nombre,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {/* Badge Novedad */}
        <span className="absolute left-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-2 sm:top-2 sm:px-2.5 sm:py-1 sm:text-xs">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          Novedad
        </span>

        {imagenPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[imgIndex] ?? imagenPrincipal}
            alt={nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <span className="text-3xl sm:text-4xl">🛍️</span>
          </div>
        )}

        {/* Carrusel: flechas (solo si hay más de 1 imagen) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:h-8 sm:w-8 sm:left-2"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:h-8 sm:w-8 sm:right-2"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-2 sm:gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIndex(i);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    i === imgIndex ? "w-3 sm:w-4" : "w-1.5 sm:w-1.5"
                  } bg-white`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4 lg:p-5">
        <h3 className="text-sm font-semibold text-stone-900 sm:text-base lg:text-lg">
          {nombre}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-stone-500 sm:text-sm">
          {descripcion}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 sm:pt-3">
          <span className="text-lg font-bold text-emerald-700 sm:text-xl">
            ₡{precio.toLocaleString("es-CR")}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}