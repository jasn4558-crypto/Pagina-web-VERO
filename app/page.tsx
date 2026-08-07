import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";
import CategorySidebar from "@/components/CategorySidebar";
import HeroBanner from "@/components/HeroBanner";
import TrustBadges from "@/components/TrustBadges";
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
    <main className="flex-1 w-full bg-stone-50">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Trust Badges */}
      <TrustBadges />

      {/* 3. Contenido principal: Sidebar + Grid de productos */}
      <div id="productos" className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CategorySidebar
          categories={allCategories}
          selectedId={categoriaId ?? "all"}
        />

        <div className="flex-1 lg:ml-8">
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">
              {categoriaId
                ? allCategories.find((c) => c.id === categoriaId)?.nombre ?? "Productos"
                : "Todos los productos"}
            </h2>
            <p className="mt-1 text-stone-600">
              {products.length} producto(s) disponible(s)
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