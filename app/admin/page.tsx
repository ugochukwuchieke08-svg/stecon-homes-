"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
Plus,
Search,
LogOut,
Home,
MapPin,
BedDouble,
Bath,
Pencil,
Trash2,
Eye,
EyeOff,
LoaderCircle,
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
status: "draft" | "published" | "sold";
created_at: string;
};

const formatPrice = (price: number) =>
  `₦${(Number(price) / 1_000_000).toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}M`;

export default function AdminDashboard() {
const router = useRouter();
const supabase = createClient();

const [properties, setProperties] = useState<Property[]>([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [busyId, setBusyId] = useState<string | null>(null);
const [error, setError] = useState("");

useEffect(() => {
let active = true;

async function loadProperties() {
  setLoading(true);
  setError("");

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/admin/login");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }

    const { data, error: queryError } = await supabase
      .from("properties")
      .select(
        "id, name, location, price, type, beds, baths, area, tag, image_url, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (queryError) throw queryError;

    if (active) setProperties((data ?? []) as Property[]);
  } catch (err) {
    console.error("Failed to load properties:", err);

    if (active) {
      setError(
        "Unable to load properties. Check your connection and Supabase configuration."
      );
    }
  } finally {
    if (active) setLoading(false);
  }
}

void loadProperties();

return () => {
  active = false;
};

}, [router, supabase]);

async function handleSignOut() {
await supabase.auth.signOut();
router.replace("/admin/login");
router.refresh();
}

async function toggleStatus(property: Property) {
if (busyId) return;

const nextStatus =
  property.status === "published" ? "draft" : "published";

setBusyId(property.id);
setError("");

try {
  const { error: updateError } = await supabase
    .from("properties")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", property.id);

  if (updateError) throw updateError;

  setProperties((current) =>
    current.map((item) =>
      item.id === property.id ? { ...item, status: nextStatus } : item
    )
  );
} catch (err) {
  console.error("Failed to update property:", err);
  setError("Could not update this listing. Please try again.");
} finally {
  setBusyId(null);
}

}

async function deleteProperty(property: Property) {
if (busyId) return;

const confirmed = window.confirm(
  `Delete "${property.name}" permanently? This cannot be undone.`
);

if (!confirmed) return;

setBusyId(property.id);
setError("");

try {
  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", property.id);

  if (deleteError) throw deleteError;

  setProperties((current) =>
    current.filter((item) => item.id !== property.id)
  );
} catch (err) {
  console.error("Failed to delete property:", err);
  setError("Could not delete this listing. Please try again.");
} finally {
  setBusyId(null);
}

}

const filteredProperties = properties.filter((property) => {
const query = search.trim().toLowerCase();

return (
  property.name.toLowerCase().includes(query) ||
  property.location.toLowerCase().includes(query)
);

});

const publishedCount = properties.filter(
(property) => property.status === "published"
).length;

const draftCount = properties.filter(
(property) => property.status === "draft"
).length;

const soldCount = properties.filter(
(property) => property.status === "sold"
).length;

return (
<main className="min-h-screen bg-[#f6f5f0] text-[#22251f]">
<header className="border-b border-[#e7e5df] bg-white">
<div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-16">
<Link href="/" className="flex items-center gap-3">
<span className="flex h-10 w-10 items-center justify-center bg-[#272d25] text-[#d6c29a]">
<Home size={20} />
</span>
<span>
<span className="block font-serif text-xl">Stecon Homes</span>
<span className="mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-[#8a8b81]">
Administration
</span>
</span>
</Link>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 border border-[#dedbd2] px-4 py-2.5 text-xs font-semibold transition hover:bg-[#f6f5f0]"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  </header>

  <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-16 lg:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#96825b]">
          Property management
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl">Dashboard</h1>
        <p className="mt-3 text-sm text-[#77786e]">
          Manage your Stecon Homes property listings.
        </p>
      </div>

      <button
        onClick={() => router.push("/admin/properties/new")}
        className="inline-flex items-center justify-center gap-2 bg-[#272d25] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#444b3d]"
      >
        <Plus size={17} />
        Add property
      </button>
    </div>

    <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { label: "Total listings", value: properties.length },
        { label: "Published", value: publishedCount },
        { label: "Drafts / Sold", value: `${draftCount} / ${soldCount}` },
      ].map((item) => (
        <div
          key={item.label}
          className="border border-[#e7e5df] bg-white p-6"
        >
          <p className="text-xs text-[#77786e]">{item.label}</p>
          <p className="mt-3 font-serif text-3xl">{item.value}</p>
        </div>
      ))}
    </div>

    <section className="mt-10 border border-[#e7e5df] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#e7e5df] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="font-serif text-2xl">Property listings</h2>

        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8b81]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or location"
            className="w-full border border-[#dedbd2] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#9a8458]"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="m-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-sm text-[#77786e]">
          <LoaderCircle size={20} className="animate-spin" />
          Loading property listings...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <Home size={32} className="mx-auto text-[#a38c5b]" />
          <h3 className="mt-5 font-serif text-2xl">
            {search ? "No matching properties" : "No properties yet"}
          </h3>
          <p className="mt-2 text-sm text-[#77786e]">
            {search
              ? "Try another property name or location."
              : "Add your first property to get started."}
          </p>
          {!search && (
            <button
              onClick={() => router.push("/admin/properties/new")}
              className="mt-6 inline-flex items-center gap-2 bg-[#272d25] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white"
            >
              <Plus size={16} />
              Add first property
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#e7e5df]">
          {filteredProperties.map((property) => (
            <article
              key={property.id}
              className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6"
            >
              <div className="h-36 w-full shrink-0 overflow-hidden bg-[#e8e5dc] sm:w-48">
                {property.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#a39f93]">
                    <Home size={30} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${
                    property.status === "published"
                      ? "bg-green-50 text-green-700"
                      : property.status === "sold"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {property.status}
                </span>

                <h3 className="mt-2 font-serif text-2xl">
                  {property.name}
                </h3>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#77786e]">
                  <MapPin size={13} />
                  {property.location}
                </p>

                <p className="mt-3 font-semibold">
                  {formatPrice(property.price)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#77786e]">
                  <span className="flex items-center gap-1.5">
                    <BedDouble size={14} /> {property.beds} beds
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath size={14} /> {property.baths} baths
                  </span>
                  <span>{property.area}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                <button
                  onClick={() => toggleStatus(property)}
                  disabled={busyId === property.id}
                  className="flex items-center justify-center gap-2 border border-[#dedbd2] px-3 py-2.5 text-xs transition hover:bg-[#f6f5f0] disabled:opacity-50"
                >
                  {property.status === "published" ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                  {property.status === "published"
                    ? "Unpublish"
                    : "Publish"}
                </button>

                <button
                  onClick={() =>
                    router.push(`/admin/properties/${property.id}/edit`)
                  }
                  className="flex items-center justify-center gap-2 border border-[#dedbd2] px-3 py-2.5 text-xs transition hover:bg-[#f6f5f0]"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                <button
                  onClick={() => deleteProperty(property)}
                  disabled={busyId === property.id}
                  className="flex items-center justify-center gap-2 border border-red-200 px-3 py-2.5 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  </div>
</main>

);
}