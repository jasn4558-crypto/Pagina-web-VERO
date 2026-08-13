"use client";

import { useState } from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Phone,
  CheckCircle2,
  Truck,
  MapPin,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";
import { createOrder } from "@/lib/orderManager";

const PROVINCIAS_CR = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
];

export default function FloatingCart() {
  const { items, totalItems, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  
  // Datos de Dirección
  const [provincia, setProvincia] = useState("San José");
  const [canton, setCanton] = useState("");
  const [distrito, setDistrito] = useState("");
  const [direccionExacta, setDireccionExacta] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleGenerateOrder = async () => {
    if (!phone.trim()) {
      toast.error("Por favor ingresa tu número de WhatsApp.");
      return;
    }
    if (!canton.trim() || !distrito.trim() || !direccionExacta.trim()) {
      toast.error("Por favor completa tu provincia, cantón, distrito y dirección exacta.");
      return;
    }

    setIsGenerating(true);
    setSuccessMessage("");
    try {
      const numPedido = await createOrder(items, phone.trim(), {
        provincia,
        canton: canton.trim(),
        distrito: distrito.trim(),
        direccionExacta: direccionExacta.trim(),
      });

      setSuccessMessage(
        `¡Pedido recibido! N° de orden #${numPedido}. Nos comunicaremos al número ${phone.trim()} para coordinar el envío a ${provincia}, ${canton.trim()}.`
      );
      toast.success(`¡Pedido #${numPedido} generado exitosamente!`);
      clearCart();
      setPhone("");
      setCanton("");
      setDistrito("");
      setDireccionExacta("");
    } catch (error) {
      console.error("Error al generar el pedido:", error);
      toast.error("Ocurrió un error al generar el pedido. Inténtalo de nuevo.");
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
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed bottom-3 right-3 sm:right-6 z-50 flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                Tu Carrito ({totalItems})
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vaciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
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
                <p className="text-xs font-semibold text-emerald-700 leading-relaxed">{successMessage}</p>
              </div>
            )}

            {/* AVISO DE ENVÍO A CONVENIR */}
            <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold shadow-inner">
              <Truck className="h-4 w-4 shrink-0 text-emerald-200" />
              <span>Precio de envío a convenir dependiendo del lugar 🚚</span>
            </div>

            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  Tu carrito está vacío.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 border-b border-stone-100 pb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover border border-stone-200"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs font-bold text-stone-900 line-clamp-1">
                          {item.nombre}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600">
                          ₡{item.precio.toLocaleString("es-CR")}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* FORMULARIO DE DIRECCIÓN */}
              {items.length > 0 && (
                <div className="mt-4 rounded-2xl bg-stone-50 p-3.5 border border-stone-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Dirección de Entrega
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Provincia */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Provincia</label>
                      <select
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:border-emerald-500"
                      >
                        {PROVINCIAS_CR.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cantón */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Cantón</label>
                      <input
                        type="text"
                        value={canton}
                        onChange={(e) => setCanton(e.target.value)}
                        placeholder="Ej: Escazú"
                        className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Distrito */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Distrito</label>
                      <input
                        type="text"
                        value={distrito}
                        onChange={(e) => setDistrito(e.target.value)}
                        placeholder="Ej: San Antonio"
                        className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Teléfono WhatsApp */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="88888888"
                        className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Dirección Exacta */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Dirección exacta / Señas</label>
                    <textarea
                      rows={2}
                      value={direccionExacta}
                      onChange={(e) => setDireccionExacta(e.target.value)}
                      placeholder="De la iglesia 100m norte, casa color blanca..."
                      className="resize-none rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2.5 border-t border-stone-100 bg-stone-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-stone-600">Subtotal</span>
                <span className="text-lg font-black text-stone-900">
                  ₡{subtotal.toLocaleString("es-CR")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Envío: Se acuerda el precio según el lugar de entrega.</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateOrder}
                disabled={isGenerating || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                {isGenerating ? "Generando..." : "Generar Pedido por WhatsApp"}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}