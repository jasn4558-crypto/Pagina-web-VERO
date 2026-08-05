import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagen: string;
}

export default async function Home() {
  const { data: productos, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true);

  if (error) {
    console.error("Error al cargar productos:", error);
  }

  const products: Product[] = (productos ?? []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    descripcion: p.descripcion,
    imagen: Array.isArray(p.imagenes) && p.imagenes.length > 0 ? p.imagenes[0] : "",
  }));

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Nuestra Tienda</h1>
        <p className="mt-1 text-zinc-600">
          Productos artesanales hechos con amor. Agrega al carrito y pide por WhatsApp.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          No hay productos disponibles por el momento.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </section>
      )}

      <FloatingCart />
    </main>
  );
}