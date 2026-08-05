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
        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-coral-500 bg-gradient-to-r from-rose-500 to-orange-400 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
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
            <span className="text-4xl">🛍️</span>
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
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-stone-900 sm:text-lg">
          {nombre}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">
          {descripcion}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xl font-bold text-emerald-700">
            ₡{precio.toLocaleString("es-CR")}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}