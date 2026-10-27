"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import {
ArrowDown,
ArrowRight,
ArrowUpRight,
BedDouble,
Check,
ChevronDown,
Heart,
MapPin,
Menu,
Search,
ShieldCheck,
SlidersHorizontal,
X,
} from "lucide-react";

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
gallery: string[];
description: string;
features: string[];
status: "draft" | "published" | "sold";
};

const formatPrice = (price: number) =>
  `₦${(Number(price) / 1_000_000).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}M`;

const whatsappLink = (message: string) =>
"https://wa.me/2348102587157?text=${encodeURIComponent(message)}";

export default function Home() {
const supabase = useMemo(() => createClient(), []);

const [properties, setProperties] = useState<Property[]>([]);
const [loadingProperties, setLoadingProperties] = useState(true);
const [propertyLoadError, setPropertyLoadError] = useState("");

const [search, setSearch] = useState("");
const [propertyType, setPropertyType] = useState("All properties");
const [budget, setBudget] = useState("Any budget");
const [activeCategory, setActiveCategory] = useState("All");
const [favorites, setFavorites] = useState<string[]>([]);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [showAll, setShowAll] = useState(false);
const [isScrolled, setIsScrolled] = useState(false);

// Load published properties from Supabase.
useEffect(() => {
let cancelled = false;

async function loadProperties() {
  setLoadingProperties(true);
  setPropertyLoadError("");

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, name, location, price, type, beds, baths, area, tag, image_url, gallery, description, features, status, created_at"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (cancelled) return;

  if (error) {
    console.error("Failed to load properties:", error.message);
    setPropertyLoadError(
      "We couldn't load the properties. Please refresh the page and try again."
    );
  } else {
    setProperties((data ?? []) as Property[]);
  }

  setLoadingProperties(false);
}

loadProperties();

return () => {
  cancelled = true;
};

}, [supabase]);

// Update the navigation appearance when scrolling.
useEffect(() => {
const handleScroll = () => {
setIsScrolled(window.scrollY > 50);
};

handleScroll();

window.addEventListener("scroll", handleScroll, { passive: true });

return () => {
  window.removeEventListener("scroll", handleScroll);
};

}, []);

const filteredProperties = useMemo(() => {
return properties.filter((property) => {
const matchesSearch =
"${property.name} ${property.location}"
.toLowerCase()
.includes(search.toLowerCase().trim());

  const matchesType =
    propertyType === "All properties" ||
    property.type === propertyType;

  const matchesBudget =
    budget === "Any budget" ||
    (budget === "Under ₦100M" && Number(property.price) < 100_000_000) ||
    (budget === "₦100M – ₦200M" &&
      Number(property.price) >= 100_000_000 &&
      Number(property.price) <= 200_000_000) ||
    (budget === "Above ₦200M" && Number(property.price) > 200_000_000);

  const matchesCategory =
    activeCategory === "All" ||
    (activeCategory === "Houses" && property.type === "House") ||
    (activeCategory === "Apartments" &&
      property.type === "Apartment");

  return (
    matchesSearch &&
    matchesType &&
    matchesBudget &&
    matchesCategory
  );
});

}, [properties, search, propertyType, budget, activeCategory]);

const displayedProperties = showAll
? filteredProperties
: filteredProperties.slice(0, 3);

function toggleFavorite(id: string) {
setFavorites((current) =>
current.includes(id)
? current.filter((favorite) => favorite !== id)
: [...current, id]
);
}

function resetFilters() {
setSearch("");
setPropertyType("All properties");
setBudget("Any budget");
setActiveCategory("All");
setShowAll(false);
}

function scrollToProperties() {
document.getElementById("properties")?.scrollIntoView({
behavior: "smooth",
});
}

return (
<main className="min-h-screen bg-[#faf9f6] text-[#22251f]">
{/* Navigation */}
<header
  className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
    isScrolled
      ? "border-white/20 bg-[#20251f]/95 shadow-md backdrop-blur-md"
      : "border-white/40 bg-transparent shadow-none"
  }`}
> 
<div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16">
<a
  href="/"
  className="relative block h-[110px] w-[340px] sm:w-[390px]"
  aria-label="Stecon Homes home"
>
  <Image
    src="/stecon-logo2.png"
    alt="Stecon Homes"
    fill
    priority
    sizes="390px"
    className="object-contain object-left"
  />
</a>

      <nav className="hidden items-center gap-9 lg:flex">
        <a href="#properties" className="text-sm text-white/90 transition hover:text-[#e0c99b]">
          Properties
        </a>
        <a href="#about" className="text-sm text-white/90 transition hover:text-[#e0c99b]">
          About us
        </a>
        <a href="#services" className="text-sm text-white/90 transition hover:text-[#e0c99b]">
          Our services
        </a>
        <a href="#contact" className="text-sm text-white/90 transition hover:text-[#e0c99b]">
          Contact
        </a>
      </nav>

      <a
        href="#contact"
        className="hidden items-center gap-3 bg-[#d6c29a] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#22251f] transition hover:bg-white sm:flex"
      >
        Find your home <ArrowUpRight size={15} />
      </a>

      <button
        onClick={() => setMobileMenuOpen((open) => !open)}
        className="text-white lg:hidden"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
      </button>
    </div>

    {mobileMenuOpen && (
      <nav className="border-t border-white/10 bg-[#20251f] px-6 py-6 lg:hidden">
        {[
          ["Properties", "#properties"],
          ["About us", "#about"],
          ["Our services", "#services"],
          ["Contact", "#contact"],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            onClick={() => setMobileMenuOpen(false)}
            className="block border-b border-white/10 py-4 text-sm text-white"
          >
            {label}
          </a>
        ))}
      </nav>
    )}
  </header>

  {/* Hero */}
  <section className="relative flex min-h-[690px] items-center overflow-hidden bg-[#272b25] sm:min-h-[760px]">
    <Image
      src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90"
      alt="Contemporary luxury home surrounded by beautiful landscaping"
      fill
      priority
      unoptimized
      sizes="100vw"
      className="object-cover object-center"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-[#171c18]/90 via-[#171c18]/55 to-[#171c18]/15" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#171c18]/55 via-transparent to-[#171c18]/20" />

    <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-14 pt-36 sm:px-8 lg:px-16">
      <div className="max-w-3xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="h-px w-12 bg-[#d6c29a]" />
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#e0cda7] sm:text-xs">
            A better way to find home
          </p>
        </div>

        <h1 className="max-w-3xl font-serif text-[49px] font-normal leading-[1.08] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[88px]">
          Find a place
          <br />
          <span className="italic text-[#dfcba5]">to call your own.</span>
        </h1>

        <p className="mt-7 max-w-lg text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
          Discover exceptional properties, thoughtful spaces, and
          opportunities that bring you closer to the life you envision.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-5">
          <button
            onClick={scrollToProperties}
            className="flex items-center gap-4 bg-[#d6c29a] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#242820] transition hover:bg-white"
          >
            Explore properties <ArrowRight size={16} />
          </button>
          <a
            href="#about"
            className="flex items-center gap-2 text-sm text-white transition hover:text-[#e0c99b]"
          >
            Discover Stecon <ArrowDown size={15} />
          </a>
        </div>
      </div>

      <div className="mt-14 grid max-w-2xl grid-cols-3 border-t border-white/25 pt-6 sm:mt-20">
        {[
          ["01", "Find your place"],
          ["02", "Make your move"],
          ["03", "Feel at home"],
        ].map(([number, label]) => (
          <div
            key={number}
            className="border-r border-white/20 px-3 first:pl-0 last:border-0 sm:px-6"
          >
            <p className="text-xs text-[#dfcba5]">{number}</p>
            <p className="mt-2 text-[10px] text-white/75 sm:text-xs">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>

    <div className="absolute bottom-7 right-8 hidden items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/65 lg:flex">
      Scroll to discover <ArrowDown size={14} />
    </div>
  </section>

  {/* Search panel */}
  <section className="relative z-20 mx-auto -mt-1 max-w-[1440px] px-5 sm:px-8 lg:px-16">
    <div className="grid gap-0 bg-white p-5 shadow-[0_15px_60px_rgba(0,0,0,0.06)] sm:p-7 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end lg:gap-5">
      <div>
        <label
          htmlFor="property-search"
          className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c7d74]"
        >
          Location or keyword
        </label>
        <div className="flex items-center gap-3 border-b border-[#e7e5df] pb-3">
          <Search size={18} className="shrink-0 text-[#9c8b68]" />
          <input
            id="property-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try Lekki, Ikoyi..."
            className="w-full bg-transparent text-sm text-[#22251f] outline-none placeholder:text-[#aaa99f]"
          />
        </div>
      </div>

      <div className="mt-5 lg:mt-0">
        <label
          htmlFor="property-type"
          className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c7d74]"
        >
          Property type
        </label>
        <div className="flex items-center border-b border-[#e7e5df] pb-3">
          <select
            id="property-type"
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            className="w-full appearance-none bg-transparent text-sm outline-none"
          >
            <option>All properties</option>
            <option>House</option>
            <option>Apartment</option>
          </select>
          <ChevronDown size={16} className="pointer-events-none text-[#9c8b68]" />
        </div>
      </div>

      <div className="mt-5 lg:mt-0">
        <label
          htmlFor="property-budget"
          className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c7d74]"
        >
          Price range
        </label>
        <div className="flex items-center border-b border-[#e7e5df] pb-3">
          <select
            id="property-budget"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="w-full appearance-none bg-transparent text-sm outline-none"
          >
            <option>Any budget</option>
            <option>Under ₦100M</option>
            <option>₦100M – ₦200M</option>
            <option>Above ₦200M</option>
          </select>
          <ChevronDown size={16} className="pointer-events-none text-[#9c8b68]" />
        </div>
      </div>

      <button
        onClick={scrollToProperties}
        className="mt-6 flex h-[49px] items-center justify-center gap-3 bg-[#272d25] px-7 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#444b3d] lg:mt-0"
      >
        <Search size={16} /> Search
      </button>
    </div>
  </section>

  {/* Properties */}
  <section id="properties" className="scroll-mt-8 py-24 sm:py-28">
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16">
      <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-9 bg-[#b59b69]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#96825b]">
              Carefully selected
            </p>
          </div>
          <h2 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl">
            Find your next{" "}
            <span className="italic text-[#9a8458]">address.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#77786e]">
            Explore distinctive homes selected for the way you want to
            live, invest, and grow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["All", "Houses", "Apartments"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-3 text-xs transition ${
                activeCategory === category
                  ? "bg-[#272d25] text-white"
                  : "border border-[#e7e5df] text-[#696b61] hover:border-[#a18b5d]"
              }`}
            >
              {category}
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="ml-1 flex items-center gap-2 px-3 py-3 text-xs text-[#77786e] hover:text-[#9a8458]"
          >
            <SlidersHorizontal size={14} /> Reset
          </button>
        </div>
      </div>

      {loadingProperties && (
        <div
          className="mt-12 py-16 text-center text-sm text-[#77786e]"
          role="status"
        >
          Loading properties...
        </div>
      )}

      {propertyLoadError && (
        <div
          role="alert"
          className="mt-12 border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
        >
          {propertyLoadError}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {!loadingProperties && !propertyLoadError && (
        <>
          <div className="mt-12 grid gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {displayedProperties.map((property) => (
              <article key={property.id} className="group min-w-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e5dc]">
                  {property.image_url ? (
                    <Image
                      src={property.image_url}
                      alt={property.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#77786e]">
                      No image available
                    </div>
                  )}

                  <span className="absolute left-4 top-4 bg-[#faf9f6] px-3 py-2 text-[9px] font-semibold tracking-[0.14em] text-[#34392e]">
                    {property.tag}
                  </span>

                  <button
                    onClick={() => toggleFavorite(property.id)}
                    aria-label={
                      favorites.includes(property.id)
                        ? "Remove from favourites"
                        : "Add to favourites"
                    }
                    aria-pressed={favorites.includes(property.id)}
                    className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center transition ${
                      favorites.includes(property.id)
                        ? "bg-[#b94e43] text-white"
                        : "bg-white/95 text-[#33372e] hover:bg-[#d6c29a]"
                    }`}
                  >
                    <Heart
                      size={17}
                      fill={
                        favorites.includes(property.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#272d25]/95 px-5 py-4 text-white transition-transform duration-300 group-hover:translate-y-0">
                    <a
                      href={whatsappLink(
                        `Hello Stecon Homes, I would like to enquire about ${property.name} in ${property.location}, listed at ${formatPrice(Number(property.price))}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs"
                    >
                      Enquire about this property <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs text-[#898a80]">
                        <MapPin size={13} className="shrink-0 text-[#a38c5b]" />
                        {property.location}
                      </p>
                      <a
                        href={`/properties/${property.id}`}
                        className="mt-3 block font-serif text-[23px] tracking-tight transition hover:text-[#9a8458]"
                      >
                        {property.name}
                      </a>
                    </div>
                    <p className="shrink-0 pt-0.5 text-sm font-semibold">
                      {formatPrice(Number(property.price))}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#e7e5df] pt-4 text-xs text-[#77786e]">
                    <span className="flex items-center gap-2">
                      <BedDouble size={15} /> {property.beds} Beds
                    </span>
                    <span>{property.baths} Baths</span>
                    <span>{property.area}</span>
                  </div>

                  <a
                    href={`/properties/${property.id}`}
                    className="mt-5 flex w-full items-center justify-between border border-[#dedbd2] px-4 py-3.5 text-xs font-medium transition hover:border-[#b59b69] hover:bg-white"
                  >
                    View property details <ArrowRight size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {displayedProperties.length === 0 && (
            <div className="py-20 text-center">
              <Search size={32} className="mx-auto text-[#a38c5b]" />
              <h3 className="mt-5 font-serif text-2xl">
                {properties.length === 0
                  ? "No properties available yet"
                  : "No properties found"}
              </h3>
              <p className="mt-2 text-sm text-[#77786e]">
                {properties.length === 0
                  ? "Published properties will appear here. Check your admin dashboard to publish a listing."
                  : "Try another location, property type, or budget."}
              </p>
              {properties.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-5 text-sm underline underline-offset-4"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {!showAll && filteredProperties.length > 3 && (
            <div className="mt-14 flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-4 border border-[#d9d5ca] px-7 py-4 text-xs font-semibold uppercase tracking-wider transition hover:bg-[#272d25] hover:text-white"
              >
                View all properties <ArrowRight size={16} />
              </button>
            </div>
          )}

          {showAll && filteredProperties.length > 3 && (
            <div className="mt-14 flex justify-center">
              <button
                onClick={() => setShowAll(false)}
                className="border border-[#d9d5ca] px-7 py-4 text-xs font-semibold uppercase tracking-wider transition hover:bg-[#272d25] hover:text-white"
              >
                Show fewer properties
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </section>

  {/* About */}
  <section id="about" className="scroll-mt-8 bg-[#252b24] text-white">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-16">
      <div className="relative min-h-[360px] overflow-hidden sm:min-h-[480px]">
        <Image
          src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85"
          alt="Beautifully designed contemporary living space"
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute bottom-5 left-5 bg-[#d6c29a] px-5 py-4 text-[#252b24] sm:bottom-8 sm:left-8">
          <p className="font-serif text-3xl">Your next chapter</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest">
            Begins at home
          </p>
        </div>
      </div>

      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-9 bg-[#d6c29a]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6c29a]">
            The Stecon difference
          </p>
        </div>
        <h2 className="font-serif text-4xl font-normal leading-tight sm:text-5xl">
          More than a property.
          <br />
          <span className="italic text-[#d6c29a]">A place to belong.</span>
        </h2>
        <p className="mt-7 text-sm leading-8 text-white/65">
          Finding the right property is about more than square metres and
          locations. It is about discovering a space that reflects your
          ambitions, supports your lifestyle, and feels right for your
          future.
        </p>
        <p className="mt-4 text-sm leading-8 text-white/65">
          At Stecon Homes, we aim to make your property journey more
          considered, more transparent, and more personal.
        </p>

        <div className="mt-9 space-y-5">
          {[
            "Thoughtfully selected properties",
            "Personalised property guidance",
            "Clear communication at every step",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 text-sm text-white/85"
            >
              <span className="flex h-6 w-6 items-center justify-center border border-[#8e805e] text-[#d6c29a]">
                <Check size={13} />
              </span>
              {item}
            </div>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-10 inline-flex items-center gap-4 bg-[#d6c29a] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#252b24] transition hover:bg-white"
        >
          Talk to our team <ArrowRight size={16} />
        </a>
      </div>
    </div>
  </section>

  {/* Services */}
  <section id="services" className="scroll-mt-8 py-24 sm:py-28">
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#96825b]">
          How we can help
        </p>
        <h2 className="mt-5 font-serif text-4xl font-normal sm:text-5xl">
          Property, made{" "}
          <span className="italic text-[#9a8458]">personal.</span>
        </h2>
        <p className="mt-5 text-sm leading-7 text-[#77786e]">
          Whether you are finding a home, expanding your portfolio, or
          exploring a new opportunity, we are here to help you take the
          next step.
        </p>
      </div>

      <div className="mt-14 grid gap-px bg-[#e6e2d8] sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            number: "01",
            title: "Buying a property",
            description:
              "Discover homes and investment opportunities that match your needs and ambitions.",
          },
          {
            number: "02",
            title: "Selling your property",
            description:
              "Present your property to interested buyers with a considered marketing approach.",
          },
          {
            number: "03",
            title: "Property investment",
            description:
              "Explore opportunities with a focus on your budget, objectives, and long-term plans.",
          },
        ].map((service) => (
          <div
            key={service.number}
            className="bg-[#faf9f6] p-8 transition hover:bg-white sm:p-10"
          >
            <p className="font-serif text-3xl text-[#b59b69]">
              {service.number}
            </p>
            <h3 className="mt-7 font-serif text-2xl">
              {service.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#77786e]">
              {service.description}
            </p>
            <a
              href="#contact"
              className="mt-7 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-wider"
            >
              Learn more <ArrowUpRight size={15} />
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* Contact call to action */}
  <section id="contact" className="scroll-mt-8 px-5 pb-24 sm:px-8 lg:px-16">
    <div className="relative mx-auto max-w-[1312px] overflow-hidden bg-[#ded2b7] px-7 py-14 sm:px-12 sm:py-16 lg:px-20">
      <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#b7a581]/50 sm:h-80 sm:w-80" />
      <div className="absolute -right-2 -top-10 h-48 w-48 rounded-full border border-[#b7a581]/50 sm:h-64 sm:w-64" />

      <div className="relative z-10 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#736448]">
          Let us help you find it
        </p>
        <h2 className="mt-5 font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Your next move
          <br />
          <span className="italic">starts here.</span>
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[#5e5b4f]">
          Tell us what you are looking for. We would love to help you
          explore your options and find a property that feels right.
        </p>
        <a
          href={whatsappLink(
            "Hello Stecon Homes, I would like help finding a property. Please tell me how we can get started."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-4 bg-[#272d25] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#454b3e]"
        >
          Contact Stecon Homes <ArrowRight size={16} />
        </a>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-[#20251f] text-white">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-16">
      <div>
        <a
          href="#"
          className="relative block h-[100px] w-[180px]"
          aria-label="Stecon Homes home"
        >
          <Image
            src="/stecon-logo2.png"
            alt="Stecon Homes"
            fill
            sizes="180px"
            className="object-contain object-left"
          />
        </a>
        <p className="mt-6 max-w-xs text-sm leading-7 text-white/55">
          Helping you discover exceptional spaces and find a place to call
          your own.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29a]">
          Explore
        </h3>
        <div className="mt-5 space-y-4 text-sm text-white/65">
          <a href="#properties" className="block hover:text-white">
            Properties
          </a>
          <a href="#about" className="block hover:text-white">
            About us
          </a>
          <a href="#services" className="block hover:text-white">
            Our services
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29a]">
          Property types
        </h3>
        <div className="mt-5 space-y-4 text-sm text-white/65">
          <button
            onClick={() => {
              setActiveCategory("Houses");
              scrollToProperties();
            }}
            className="block hover:text-white"
          >
            Houses
          </button>
          <button
            onClick={() => {
              setActiveCategory("Apartments");
              scrollToProperties();
            }}
            className="block hover:text-white"
          >
            Apartments
          </button>
          <button
            onClick={() => {
              setActiveCategory("All");
              scrollToProperties();
            }}
            className="block hover:text-white"
          >
            All properties
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29a]">
          Get in touch
        </h3>
        <p className="mt-5 text-sm leading-7 text-white/65">
          Have a question or a property in mind? Speak with our team.
        </p>
        <a
          href={whatsappLink(
            "Hello Stecon Homes, I would like to make a property enquiry."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#d6c29a] hover:text-white"
        >
          Start an enquiry <ArrowUpRight size={15} />
        </a>
      </div>
    </div>

    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-[10px] text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-16">
        <p>
          © {new Date().getFullYear()} Stecon Homes. All rights reserved.
        </p>
        <p>Thoughtful spaces. Better living.</p>
      </div>
    </div>
  </footer>

  {/* Trust indicator */}
  <div className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 border border-[#e6e2d8] bg-white/95 px-4 py-3 text-[10px] text-[#4f5548] shadow-lg sm:flex">
    <ShieldCheck size={16} className="text-[#9a8458]" />
    Find your next home with confidence
  </div>
</main>

);
}