import React from "react";
import { Image } from "@/components/ui/image";
import { categoryImage } from "@/data/offerCategories";
import { offerTitle } from "@/lib/offerTitle";

/** Hero reel: tall photo cards (stories style) opening the offer. Uses offer/merchant photos. */
export default function MemberStories({ offers, meta, onOpen }) {
  const items = offers.slice(0, 10);
  if (!items.length) return null;
  return (
    <div className="-mx-4 mb-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="list">
      {items.map((o) => {
        const cat = meta(o.category);
        return (
          <button key={o.id} role="listitem" onClick={() => onOpen(o)} className="group relative h-44 w-28 shrink-0 snap-start overflow-hidden rounded-[20px] border-2 border-nv-emerald bg-slate-200 text-start sm:h-52 sm:w-32">
            <Image src={o.image_url || o.merchant?.cover_image_url || cat.image_url || categoryImage(o.category)} alt="" className="h-full w-full transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-2 bottom-2 line-clamp-3 text-xs font-medium leading-snug text-white">{offerTitle(o)}</span>
          </button>
        );
      })}
    </div>
  );
}
