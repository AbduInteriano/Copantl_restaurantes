import { FadeIn } from "@/components/fade-in";
import { RESTAURANTS, type RestaurantKey } from "@/lib/restaurants";

export type RestaurantMenuImage = {
  id: string;
  restaurant: RestaurantKey;
  image_url: string;
  sort_order: number;
};

type Props = {
  items: RestaurantMenuImage[];
};

export function RestaurantMenusDisplay({ items }: Props) {
  return (
    <div className="mt-8 space-y-16 sm:space-y-20">
      {RESTAURANTS.map((restaurant, sectionIndex) => {
        const menuImages = items
          .filter((item) => item.restaurant === restaurant.key)
          .sort((a, b) => a.sort_order - b.sort_order);

        return (
          <FadeIn key={restaurant.key} delay={sectionIndex * 0.05}>
            <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <header className="border-b border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4 sm:px-8 sm:py-5">
                <h3 className="section-title text-2xl text-[var(--accent-gold-dark)] sm:text-3xl">
                  {restaurant.menuTitle}
                </h3>
              </header>

              <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                {menuImages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">
                    Menu proximamente disponible.
                  </p>
                ) : (
                  menuImages.map((image, imageIndex) => (
                    <figure
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_4px_24px_rgba(28,24,20,0.06)]"
                    >
                      <img
                        src={image.image_url}
                        alt={`${restaurant.menuTitle} — pagina ${imageIndex + 1}`}
                        className="mx-auto block h-auto w-full max-w-3xl object-contain"
                        loading={imageIndex === 0 ? "eager" : "lazy"}
                      />
                    </figure>
                  ))
                )}
              </div>
            </article>
          </FadeIn>
        );
      })}
    </div>
  );
}
