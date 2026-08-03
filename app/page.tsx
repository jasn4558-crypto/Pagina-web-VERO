import ProductCard from "@/components/ProductCard";
import FloatingCart from "@/components/FloatingCart";

interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagen: string;
}

// Datos simulados (mock data) - Se reemplazarán con datos reales de Supabase en la Fase 3
const products: Product[] = [
  {
    id: "1",
    nombre: "Bolso de Cuero Artesanal",
    precio: 45000,
    descripcion:
      "Bolso elaborado a mano en cuero genuino, ideal para uso diario. Diseño único y duradero.",
    imagen: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  },
  {
    id: "2",
    nombre: "Velas Aromáticas Naturales",
    precio: 8500,
    descripcion:
      "Velas hechas con cera de soya y aceites esenciales. Aromas relajantes para tu hogar.",
    imagen: "https://images.unsplash.com/photo-1602874801006-26cbfc9ce7b5?w=600&q=80",
  },
  {
    id: "3",
    nombre: "Taza de Cerámica Hecha a Mano",
    precio: 12000,
    descripcion:
      "Taza de cerámica artesanal con esmaltado especial. Perfecta para tu café de cada día.",
    imagen: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
  },
];

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Nuestra Tienda</h1>
        <p className="mt-1 text-zinc-600">
          Productos artesanales hechos con amor. Agrega al carrito y pide por WhatsApp.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </section>

      <FloatingCart />
    </main>
  );
}