"use client";

import { useState } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2, Phone, CheckCircle2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { createOrder } from "@/lib/orderManager";

export default function FloatingCart() {
  const { items, totalItems, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleGenerateOrder = async () => {
    if (!phone.trim()) {
      alert("Por favor ingresa tu número de WhatsApp.");
      return;
    }
    setIsGenerating(true);
    setSuccessMessage("");
    try {
      await createOrder(items, phone.trim());
      setSuccessMessage(`¡Pedido recibido! Nos pondremos en contacto al número ${phone.trim()}`);
      clearCart();
      setPhone("");
    } catch (error) {
      console.error("Error al generar el pedido:", error);
      alert("Ocurrió un error al generar el pedido. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (totalItems === 0 && !isOpen && !successMessage) return null;

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
          aria-label="Abrir carrito"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {totalItems}
          </span>
        </button>
      )}

      {/* Panel lateral */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed bottom-4 right-4 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
                <ShoppingCart className="h-5 w-5" />
                Tu carrito
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vaciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Cerrar carrito"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="flex items-start gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
              </div>
            )}

            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  Tu carrito está vacío.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-stone-900">
                          {item.nombre}
                        </span>
                        <span className="text-xs text-stone-500">
                          ₡{item.precio.toLocaleString("es-CR")}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${item.nombre}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-semibold text-stone-900">
                  ₡{subtotal.toLocaleString("es-CR")}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Total + Envío (dependiendo de la ubicación)
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 focus-within:border-emerald-500">
                <Phone className="h-4 w-4 shrink-0 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu número de WhatsApp (ej. 506XXXXXXXX)"
                  className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateOrder}
                disabled={isGenerating || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                {isGenerating ? "Generando..." : "Generar Pedido"}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}