"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export default function CatalogError({ reset }: { reset: () => void }) {
  const router = useRouter();

  return (
    <section className="shell error-page">
      <h1>Каталог недоступен</h1>
      <p>Не удалось загрузить данные. Попробуйте ещё раз.</p>
      <button className="button button-primary" onClick={() => { router.refresh(); reset(); }}>
        <RotateCcw size={17} aria-hidden /> Повторить
      </button>
    </section>
  );
}
