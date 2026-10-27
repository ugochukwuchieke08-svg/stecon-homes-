"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
ArrowLeft,
Upload,
X,
LoaderCircle,
Save,
Home,
Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type PropertyStatus = "draft" | "published" | "sold";

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
status: PropertyStatus;
};

type ExistingImage = {
url: string;
isMain: boolean;
};

const inputClass =
"mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10";

const labelClass = "text-sm font-medium text-gray-700";

export default function EditPropertyClient({ id }: { id: string }) {
const router = useRouter();
const supabase = useMemo(() => createClient(), []);

const [property, setProperty] = useState<Property | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [name, setName] = useState("");
const [location, setLocation] = useState("");
const [price, setPrice] = useState("");
const [type, setType] = useState("House");
const [beds, setBeds] = useState("3");
const [baths, setBaths] = useState("2");
const [area, setArea] = useState("");
const [tag, setTag] = useState("NEW LISTING");
const [description, setDescription] = useState("");
const [features, setFeatures] = useState("");
const [status, setStatus] = useState<PropertyStatus>("draft");

const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
const [newImages, setNewImages] = useState<File[]>([]);

useEffect(() => {
let cancelled = false;

async function loadProperty() {
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

    const { data, error: propertyError } = await supabase
      .from("properties")
      .select(
        "id, name, location, price, type, beds, baths, area, tag, image_url, gallery, description, features, status"
      )
      .eq("id", id)
      .maybeSingle();

    if (propertyError) throw propertyError;

    if (!data) {
      throw new Error(
        "Property not found. Check that the property still exists."
      );
    }

    if (cancelled) return;

    const loaded = data as Property;

    setProperty(loaded);
    setName(loaded.name ?? "");
    setLocation(loaded.location ?? "");
    setPrice(String(loaded.price ?? ""));
    setType(loaded.type ?? "House");
    setBeds(String(loaded.beds ?? 0));
    setBaths(String(loaded.baths ?? 0));
    setArea(loaded.area ?? "");
    setTag(loaded.tag ?? "NEW LISTING");
    setDescription(loaded.description ?? "");
    setFeatures((loaded.features ?? []).join("\n"));
    setStatus(loaded.status ?? "draft");

    const gallery = loaded.gallery ?? [];
    const urls = [
      ...(loaded.image_url ? [loaded.image_url] : []),
      ...gallery,
    ].filter((url, index, all) => all.indexOf(url) === index);

    setExistingImages(
      urls.map((url, index) => ({
        url,
        isMain: index === 0,
      }))
    );
  } catch (err) {
    if (!cancelled) {
      setError(
        err instanceof Error ? err.message : "Failed to load property."
      );
    }
  } finally {
    if (!cancelled) setLoading(false);
  }
}

loadProperty();

return () => {
  cancelled = true;
};

}, [id, router, supabase]);

function removeExistingImage(url: string) {
setExistingImages((current) =>
current.filter((image) => image.url !== url)
);
}

function setMainImage(url: string) {
setExistingImages((current) =>
current.map((image) => ({
...image,
isMain: image.url === url,
}))
);
}

function handleNewImages(files: FileList | null) {
if (!files) return;

const selected = Array.from(files);

if (selected.some((file) => !file.type.startsWith("image/"))) {
  setError("Please select image files only.");
  return;
}

if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
  setError("Each image must be 5 MB or smaller.");
  return;
}

if (existingImages.length + newImages.length + selected.length > 8) {
  setError("You can keep a maximum of 8 property images.");
  return;
}

setError("");
setNewImages((current) => [...current, ...selected]);

}

function removeNewImage(indexToRemove: number) {
setNewImages((current) =>
current.filter((_, index) => index !== indexToRemove)
);
}

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setError("");
setSuccess("");

if (!name.trim() || !location.trim()) {
  setError("Property name and location are required.");
  return;
}

const numericPrice = Number(price);
const numericBeds = Number(beds);
const numericBaths = Number(baths);

if (!Number.isFinite(numericPrice) || numericPrice < 0) {
  setError("Enter a valid property price.");
  return;
}

if (
  !Number.isInteger(numericBeds) ||
  numericBeds < 0 ||
  !Number.isInteger(numericBaths) ||
  numericBaths < 0
) {
  setError("Bedrooms and bathrooms must be valid non-negative numbers.");
  return;
}

if (existingImages.length + newImages.length > 8) {
  setError("A maximum of 8 images is allowed.");
  return;
}

if (existingImages.length + newImages.length === 0) {
  setError("Keep at least one image or upload a new one.");
  return;
}

setSaving(true);

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
    throw new Error("You are not authorized to edit properties.");
  }

  const uploadedUrls: string[] = [];

  for (const file of newImages) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  const allImages = [
    ...existingImages.map((image) => image.url),
    ...uploadedUrls,
  ];

  const mainImage =
    existingImages.find((image) => image.isMain)?.url ?? allImages[0];

  const orderedImages = [
    ...(mainImage ? [mainImage] : []),
    ...allImages.filter((url) => url !== mainImage),
  ];

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      name: name.trim(),
      location: location.trim(),
      price: numericPrice,
      type,
      beds: numericBeds,
      baths: numericBaths,
      area: area.trim(),
      tag: tag.trim() || "NEW LISTING",
      description: description.trim(),
      features: features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      status,
      image_url: orderedImages[0],
      gallery: orderedImages,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) throw updateError;

  setSuccess("Property updated successfully.");
  router.refresh();
  router.push("/admin");
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to update property."
  );
} finally {
  setSaving(false);
}

}

if (loading) {
return (
<main className="flex min-h-screen items-center justify-center bg-gray-50">
<LoaderCircle className="h-8 w-8 animate-spin text-emerald-800" />
</main>
);
}

if (!property) {
return (
<main className="min-h-screen bg-gray-50 px-5 py-16">
<div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
<h1 className="text-xl font-semibold text-gray-900">
Unable to open property
</h1>
<p className="mt-3 text-sm text-red-600">
{error || "This property could not be found."}
</p>
<Link
href="/admin"
className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white"
>
<ArrowLeft size={16} /> Back to dashboard
</Link>
</div>
</main>
);
}

return (
<main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
<div className="mx-auto max-w-5xl">
<Link
href="/admin"
className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-900"
>
<ArrowLeft size={17} /> Back to dashboard
</Link>

    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-emerald-800">
          <Home size={19} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Stecon Homes
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Edit property
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Update listing details, images, and publication status.
        </p>
      </div>

      <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-medium capitalize text-gray-600 shadow-sm">
        Current status: {property.status}
      </span>
    </div>

    {error && (
      <div
        role="alert"
        className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </div>
    )}

    {success && (
      <div
        role="status"
        className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        {success}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-7">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Basic information
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The essential details visitors see on the listing.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Property name *
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Luxury 4 Bedroom Duplex"
            />
          </label>

          <label className={labelClass}>
            Location *
            <input
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g. New Owerri, Imo State"
            />
          </label>

          <label className={labelClass}>
            Price in naira (₦) *
            <input
              className={inputClass}
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>

          <label className={labelClass}>
            Property type
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>House</option>
              <option>Duplex</option>
              <option>Apartment</option>
              <option>Flat</option>
              <option>Land</option>
              <option>Commercial</option>
              <option>Terrace</option>
              <option>Penthouse</option>
              <option>Villa</option>
            </select>
          </label>

          <label className={labelClass}>
            Bedrooms
            <input
              className={inputClass}
              type="number"
              min="0"
              step="1"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
            />
          </label>

          <label className={labelClass}>
            Bathrooms
            <input
              className={inputClass}
              type="number"
              min="0"
              step="1"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
            />
          </label>

          <label className={labelClass}>
            Area / size
            <input
              className={inputClass}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. 450 sqm"
            />
          </label>

          <label className={labelClass}>
            Listing tag
            <input
              className={inputClass}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. FEATURED PROPERTY"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Description and features
        </h2>

        <label className={`${labelClass} mt-6 block`}>
          Property description
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the property..."
          />
        </label>

        <label className={`${labelClass} mt-5 block`}>
          Features (one per line)
          <textarea
            className={inputClass}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={5}
            placeholder={"Swimming pool\n24-hour security\nAmple parking"}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Property images
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select an image as the main cover. You can keep or remove existing
          images and add new ones.
        </p>

        {existingImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {existingImages.map((image) => (
              <div
                key={image.url}
                className={`overflow-hidden rounded-xl border ${
                  image.isMain
                    ? "border-emerald-700 ring-2 ring-emerald-700/10"
                    : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMainImage(image.url)}
                  className="relative block aspect-square w-full bg-gray-100"
                  title="Set as main image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Property"
                    className="h-full w-full object-cover"
                  />
                </button>

                <div className="flex items-center justify-between gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setMainImage(image.url)}
                    className="text-xs font-medium text-emerald-800"
                  >
                    {image.isMain ? "Main image" : "Set as main"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.url)}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {newImages.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              New images to upload
            </h3>

            {newImages.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
              >
                <span className="truncate text-sm text-gray-700">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>

                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center transition hover:border-emerald-700 hover:bg-emerald-50/30">
          <Upload className="mb-3 text-emerald-800" size={25} />

          <span className="text-sm font-medium text-gray-800">
            Add more images
          </span>

          <span className="mt-1 text-xs text-gray-500">
            JPG, PNG, or other image files · maximum 5 MB each · 8 images
            total
          </span>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleNewImages(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        <p className="mt-3 text-xs text-gray-500">
          Removing an image from this listing does not delete its file from
          Storage. The file is left there so other listings or references
          are not accidentally broken.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Publication status
        </h2>

        <label className={`${labelClass} mt-5 block`}>
          Status
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as PropertyStatus)}
          >
            <option value="draft">Draft — hidden from visitors</option>
            <option value="published">
              Published — visible to visitors
            </option>
            <option value="sold">Sold</option>
          </select>
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  </div>
</main>

);
}