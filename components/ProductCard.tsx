"use client";

import { useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
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
  const [added, setAdded] = useState(false);

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
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Contenedor de Imagen */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
        {/* Badge Novedad */}
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
          Novedad
        </span>

        {imagenPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[imgIndex] ?? imagenPrincipal}
            alt={nombre}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <span className="text-4xl">🛍️</span>
          </div>
        )}

        {/* Carrusel: flechas si hay más de 1 imagen */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-95"
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
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-95"
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
                  className={`h-1 rounded-full transition-all ${
                    i === imgIndex ? "w-4 bg-emerald-600" : "w-1.5 bg-white/80"
                  }`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detalles del Producto */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-bold text-stone-900 transition-colors group-hover:text-emerald-700 sm:text-base line-clamp-1">
            {nombre}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {descripcion}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-100">
          <div>
            <span className="text-xs uppercase font-semibold text-stone-400 block">Precio</span>
            <span className="text-base font-extrabold text-stone-900 sm:text-lg">
              ₡{precio.toLocaleString("es-CR")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm ${
              added
                ? "bg-emerald-700 scale-105"
                : "bg-stone-900 hover:bg-emerald-600 hover:shadow-md"
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}