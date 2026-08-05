import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";
import CategorySidebar from "@/components/CategorySidebar";
import { supabase } from "@/lib/supabase";

// Siempre consulta la base de datos fresca (evita caché agresiva de Server Components)
export const dynamic = "force-dynamic";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
}

interface Category {
  id: string;
  nombre: string;
  activo: boolean;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const categoriaId = params.categoria;

  let query = supabase.from("productos").select("*").eq("activo", true);
  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
  }
  const { data: productos, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) {
    console.error("Error al cargar productos:", error);
  }

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  const products: Product[] = (productos ?? []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    descripcion: p.descripcion,
    imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
  }));

  const allCategories: Category[] = [
    ...(categorias ?? []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      activo: c.activo,
    })),
  ];

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto bg-stone-50">
      <div className="flex">
        {/* Sidebar de categorías (desktop: estático, móvil: botón hamburguesa) */}
        <CategorySidebar
          categories={allCategories}
          selectedId={categoriaId ?? "all"}
        />

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
              Tienda <span className="text-emerald-600">Verónica</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-stone-600">
              Productos artesanales hechos con amor y dedicación.
              Agrega al carrito y pide por WhatsApp.
            </p>
          </header>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center">
              <p className="text-stone-500">
                No hay productos disponibles por el momento.
              </p>
              <p className="mt-1 text-sm text-stone-400">
                Vuelve pronto, estamos preparando novedades. ✨
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </section>
          )}
        </div>
      </div>

      <FloatingCart />
    </main>
  );
}