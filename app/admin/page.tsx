"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Upload, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Verificar sesión al montar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      } else {
        setSession(session);
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!nombre.trim() || !descripcion.trim() || !precio || !imagen) {
      setError("Por favor completa todos los campos y selecciona una imagen.");
      return;
    }

    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Subir imagen al bucket tienda-archivos en la subcarpeta productos/
      const filePath = `productos/${Date.now()}-${imagen.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tienda-archivos")
        .upload(filePath, imagen, {
          cacheControl: "3600",
          upsert: false,
          contentType: imagen.type,
        });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública de la imagen
      const { data: publicUrlData } = supabase.storage
        .from("tienda-archivos")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // 3. Insertar producto en la tabla productos
      const { error: insertError } = await supabase.from("productos").insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        imagenes: [publicUrl],
        activo: true,
      });

      if (insertError) throw insertError;

      // 4. Limpiar formulario y mostrar éxito
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setImagen(null);
      setSuccess(true);
    } catch (err: any) {
      console.error("Error al crear producto:", err);
      setError(err?.message || "Ocurrió un error al crear el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mientras se verifica la sesión
  if (checking) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verificando sesión...</span>
        </div>
      </main>
    );
  }

  // Si no hay sesión, no renderizar (se redirige en el useEffect)
  if (!session) return null;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-zinc-900">
            <Package className="h-7 w-7" />
            Panel de Administración
          </h1>
          <p className="mt-1 text-zinc-600">
            Agrega nuevos productos a la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Bolso de Cuero Artesanal"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="descripcion" className="text-sm font-medium text-zinc-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el producto..."
            rows={4}
            className="resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="precio" className="text-sm font-medium text-zinc-700">
            Precio (₡)
          </label>
          <input
            id="precio"
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej. 45000"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="imagen" className="text-sm font-medium text-zinc-700">
            Imagen principal
          </label>
          <input
            id="imagen"
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Producto creado exitosamente.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Crear Producto
            </>
          )}
        </button>
      </form>
    </main>
  );
}