"use client";

import { Truck, Shield, Headphones, PackageCheck } from "lucide-react";

const badges = [
  {
    icon: Truck,
    label: "Envío Rápido",
    desc: "24h a todo el país",
  },
  {
    icon: Shield,
    label: "Compra Segura",
    desc: "Pago protegido",
  },
  {
    icon: Headphones,
    label: "Soporte 24/7",
    desc: "Por WhatsApp",
  },
  {
    icon: PackageCheck,
    label: "Calidad Garantizada",
    desc: "Revisión estricta",
  },
];

export default function TrustBadges() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.label}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {badge.label}
                </p>
                <p className="text-xs text-stone-500">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}