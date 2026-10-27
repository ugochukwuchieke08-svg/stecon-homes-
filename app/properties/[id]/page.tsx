"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Bath,
  Check,
  Heart,
  MapPin,
  Maximize2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Property = {
  id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  beds: number;
  baths: number;
  area: string;
  tag: string;
  image_url: string | null;
  gallery: string[] | null;
  description: string;
  features: string[] | null;
  status: "draft" | "published" | "sold";
};

const formatPrice = (price: number) =>
  `₦${(Number(price) / 1_000_000).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}M`;

const whatsappLink = (message: string) =>
  `https://wa.me/2348102587157?text=${encodeURIComponent(message)}`;

export default function PropertyDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, name, location, price, type, beds, baths, area, tag, image_url, gallery, description, features, status"
        )
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load property:", error.message);
        setLoadError(
          "We couldn't load this property. Please refresh the page and try again."
        );
        setProperty(null);
      } else if (!data) {
        setProperty(null);
      } else {
        setProperty(data as Property);
      }

      setLoading(false);
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const images = useMemo(() => {
    if (!property) return [];

    const galleryImages = (property.gallery ?? []).filter(Boolean);
    const allImages = [
      ...(property.image_url ? [property.image_url] : []),
      ...galleryImages,
    ];

    return [...new Set(allImages)];
  }, [property]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const nextImage = () => {
    if (images.length > 1) {
      setActiveImage((current) => (current + 1) % images.length);
    }
  };

  const previousImage = () => {
    if (images.length > 1) {
      setActiveImage(
        (current) => (current - 1 + images.length) % images.length
      );
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#22251f]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#dedbd2] border-t-[#9a8458]" />
          <p className="mt-5 text-sm text-[#77786e]">
            Loading property details...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !property) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#22251f]">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-4xl">
            {loadError ? "Unable to load property" : "Property not found"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#77786e]">
            {loadError ||
              "This property may no longer be available, may not have been published, or the link may be incorrect."}
          </p>

          <Link
            href="/#properties"
            className="mt-7 inline-flex items-center gap-3 bg-[#272d25] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white"
          >
            <ArrowLeft size={16} /> Back to properties
          </Link>
        </div>
      </main>
    );
  }

  const enquiryMessage = `Hello Stecon Homes, I am interested in ${property.name}, located at ${property.location}, listed at ${formatPrice(Number(property.price))}. I would like more information and would like to arrange a viewing.`;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#22251f]">
      <header className="sticky top-0 z-40 border-b border-[#e7e5df] bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16">
          <Link
            href="/"
            className="relative block h-14 w-44 sm:w-52"
            aria-label="Stecon Homes home"
          >
            <Image
              src="/stecon-logo2.png"
              alt="Stecon Homes"
              fill
              priority
              sizes="208px"
              className="object-contain object-left"
            />
          </Link>

          <Link
            href="/#properties"
            className="flex items-center gap-2 text-xs font-medium sm:text-sm"
          >
            <ArrowLeft size={16} /> Back to properties
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-16">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#96825b]">
              {property.tag}
            </p>

            <h1 className="font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {property.name}
            </h1>

            <p className="mt-3 flex items-center gap-2 text-sm text-[#77786e]">
              <MapPin size={16} className="text-[#a38c5b]" />
              {property.location}
            </p>
          </div>

          <button
            onClick={() => setFavorite(!favorite)}
            className={`flex h-12 w-12 items-center justify-center border transition ${
              favorite
                ? "border-[#b94e43] bg-[#b94e43] text-white"
                : "border-[#dedbd2] bg-white hover:border-[#b59b69]"
            }`}
            aria-label={favorite ? "Remove favourite" : "Add favourite"}
          >
            <Heart size={19} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e5dc] sm:aspect-[16/8] lg:aspect-[16/7]">
          {images.length > 0 ? (
            <>
              <Image
                key={images[activeImage]}
                src={images[activeImage]}
                alt={`${property.name} - image ${activeImage + 1}`}
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous property image"
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-[#22251f] transition hover:bg-white"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next property image"
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-[#22251f] transition hover:bg-white"
                  >
                    <ChevronRight size={22} />
                  </button>

                  <div className="absolute bottom-4 right-4 bg-[#20251f]/80 px-3 py-2 text-xs text-white">
                    {activeImage + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#77786e]">
              No property image available
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-[#faf9f6] px-4 py-3 text-xs font-semibold uppercase tracking-wider sm:bottom-7 sm:left-7 sm:px-6 sm:py-4">
            {property.type}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View property image ${index + 1}`}
                className={`relative h-20 w-28 shrink-0 overflow-hidden border-2 transition ${
                  activeImage === index
                    ? "border-[#9a8458]"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt={`${property.name} thumbnail ${index + 1}`}
                  fill
                  unoptimized
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_370px] lg:gap-14">
          <div>
            <div className="grid grid-cols-3 border-y border-[#e7e5df] py-6">
              <div className="flex flex-col gap-2 border-r border-[#e7e5df] pr-3 sm:flex-row sm:items-center sm:gap-3">
                <BedDouble size={21} className="text-[#9a8458]" />
                <div>
                  <p className="text-lg font-medium">{property.beds}</p>
                  <p className="text-[10px] text-[#77786e] sm:text-xs">
                    Bedrooms
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-r border-[#e7e5df] px-3 sm:flex-row sm:items-center sm:gap-3">
                <Bath size={21} className="text-[#9a8458]" />
                <div>
                  <p className="text-lg font-medium">{property.baths}</p>
                  <p className="text-[10px] text-[#77786e] sm:text-xs">
                    Bathrooms
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pl-3 sm:flex-row sm:items-center sm:gap-3">
                <Maximize2 size={20} className="text-[#9a8458]" />
                <div>
                  <p className="text-lg font-medium">{property.area}</p>
                  <p className="text-[10px] text-[#77786e] sm:text-xs">
                    Area
                  </p>
                </div>
              </div>
            </div>

            <section className="mt-10">
              <h2 className="font-serif text-3xl">About this property</h2>
              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-[#6f7067]">
                {property.description || "Contact Stecon Homes for more information about this property."}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="font-serif text-3xl">Property highlights</h2>

              {property.features && property.features.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {property.features.map((feature, index) => (
                    <div
                      key={`${feature}-${index}`}
                      className="flex items-start gap-3 text-sm text-[#6f7067]"
                    >
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-[#9a8458]"
                      />
                      {feature}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-[#77786e]">
                  Contact us to learn more about this property's features.
                </p>
              )}
            </section>

            <div className="mt-10 flex items-start gap-3 border border-[#e7e5df] bg-white p-5">
              <ShieldCheck size={22} className="shrink-0 text-[#9a8458]" />
              <div>
                <h3 className="text-sm font-semibold">
                  Speak directly with Stecon Homes
                </h3>
                <p className="mt-2 text-xs leading-6 text-[#77786e]">
                  Contact our team to confirm the property's availability,
                  obtain additional information, and discuss viewing
                  arrangements.
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit border border-[#e7e5df] bg-white p-6 sm:p-8 lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#96825b]">
              Listed price
            </p>

            <p className="mt-3 font-serif text-4xl">
              {formatPrice(Number(property.price))}
            </p>

            <p className="mt-2 text-xs text-[#77786e]">
              Contact us to confirm the current asking price.
            </p>

            <div className="my-7 border-t border-[#e7e5df]" />

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#77786e]">Property type</span>
                <span className="font-medium">{property.type}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#77786e]">Location</span>
                <span className="text-right font-medium">
                  {property.location}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#77786e]">Property area</span>
                <span className="font-medium">{property.area}</span>
              </div>
            </div>

            <a
              href={whatsappLink(enquiryMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-3 bg-[#272d25] px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#444b3d]"
            >
              Enquire on WhatsApp <ArrowUpRight size={16} />
            </a>

            <button
              onClick={() => router.push("/#properties")}
              className="mt-3 flex w-full items-center justify-center gap-3 border border-[#dedbd2] px-5 py-4 text-xs font-semibold uppercase tracking-wider transition hover:bg-[#faf9f6]"
            >
              Browse more properties <ArrowRight size={16} />
            </button>

            <p className="mt-5 text-center text-[10px] leading-5 text-[#8a8b81]">
              Property details and availability should be confirmed with
              Stecon Homes before making a commitment.
            </p>
          </aside>
        </div>
      </section>

      <footer className="bg-[#20251f] px-5 py-8 text-center text-xs text-white/55">
       © 2026 Stecon Homes. All rights reserved.
      </footer>
    </main>
  );
}