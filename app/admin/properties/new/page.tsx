"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Upload,
  X,
  LoaderCircle,
  Home,
} from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [form, setForm] = useState({
    name: "",
    location: "",
    price: "",
    type: "House",
    beds: "3",
    baths: "2",
    area: "",
    tag: "NEW LISTING",
    description: "",
    features: "",
    status: "draft",
  });

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
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

      setCheckingAuth(false);
    }

    checkAdmin();
  }, [router, supabase]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);
    const remaining = 8 - selectedImages.length;

    if (files.length > remaining) {
      setError("You can upload a maximum of 8 images.");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("Please select image files only.");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      setError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedImages((current) => [...current, ...files]);
    event.target.value = "";
  }

  function removeImage(index: number) {
    setSelectedImages((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!form.name.trim() || !form.location.trim()) {
        setError("Please enter the property name and location.");
        return;
      }

      if (!form.price || Number(form.price) < 0) {
        setError("Please enter a valid property price.");
        return;
      }

      if (selectedImages.length === 0) {
        setError("Please upload at least one property image.");
        return;
      }

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
        setError("You are not authorised to add properties.");
        return;
      }

      const imageUrls: string[] = [];

for (const file of selectedImages) {
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

  const publicUrl = publicUrlData.publicUrl;

 imageUrls.push(publicUrl);
}

      const { error: insertError } = await supabase
        .from("properties")
        .insert({
          name: form.name.trim(),
          location: form.location.trim(),
          price: Number(form.price),
          type: form.type,
          beds: Number(form.beds),
          baths: Number(form.baths),
          area: form.area.trim(),
          tag: form.tag.trim() || "NEW LISTING",
          description: form.description.trim(),
          features: form.features
            .split("\n")
            .map((feature) => feature.trim())
            .filter(Boolean),
          image_url: imageUrls[0],
          gallery: imageUrls,
          status: form.status,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <LoaderCircle className="animate-spin text-[#9a8458]" size={30} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#272d25]">
      <header className="border-b border-[#e7e5df] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-[#77786e] hover:text-[#9a8458]"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>

          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Stecon Homes
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mb-9">
          <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[#272d25] text-[#d6c29a]">
            <Home size={22} />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a8458]">
            Property management
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl">
            Add New Property
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#77786e]">
            Enter the details below to add a property to your listings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="border border-[#e7e5df] bg-white p-5 sm:p-8">
            <h2 className="mb-6 font-serif text-xl">
              Basic Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Property Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Luxury 4-Bedroom Duplex"
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Location *
                </label>

                <input
                  required
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. New Owerri, Imo State"
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Price (₦) *
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="85000000"
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Property Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="w-full border border-[#dedbd2] bg-white px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                >
                  <option>House</option>
                  <option>Duplex</option>
                  <option>Apartment</option>
                  <option>Flat</option>
                  <option>Land</option>
                  <option>Commercial Property</option>
                  <option>Office Space</option>
                  <option>Warehouse</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Bedrooms
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.beds}
                  onChange={(e) => updateField("beds", e.target.value)}
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Bathrooms
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.baths}
                  onChange={(e) => updateField("baths", e.target.value)}
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Property Size
                </label>

                <input
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="e.g. 450 sqm"
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Listing Tag
                </label>

                <input
                  value={form.tag}
                  onChange={(e) => updateField("tag", e.target.value)}
                  placeholder="e.g. FEATURED PROPERTY"
                  className="w-full border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>
            </div>
          </section>

          <section className="border border-[#e7e5df] bg-white p-5 sm:p-8">
            <h2 className="mb-6 font-serif text-xl">
              Description & Features
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Property Description
                </label>

                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the property, its condition, location and selling points..."
                  className="w-full resize-y border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Features
                </label>

                <textarea
                  rows={5}
                  value={form.features}
                  onChange={(e) => updateField("features", e.target.value)}
                  placeholder={"Enter one feature per line:\nFitted kitchen\nSecure parking\n24-hour electricity"}
                  className="w-full resize-y border border-[#dedbd2] px-4 py-3 text-sm outline-none focus:border-[#9a8458]"
                />

                <p className="mt-2 text-xs text-[#77786e]">
                  Enter each feature on a separate line.
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[#e7e5df] bg-white p-5 sm:p-8">
            <h2 className="mb-2 font-serif text-xl">
              Property Images
            </h2>

            <p className="mb-6 text-sm leading-6 text-[#77786e]">
              Upload up to 8 images. Each image must be 5 MB or smaller.
              Your first image will be the main property photo.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#c9c5b9] bg-[#faf9f6] px-5 py-10 text-center transition hover:border-[#9a8458]">
              <Upload size={28} className="mb-3 text-[#9a8458]" />

              <span className="text-sm font-semibold">
                Choose property images
              </span>

              <span className="mt-2 text-xs text-[#77786e]">
                JPG, PNG, WebP and other supported image formats
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {selectedImages.length > 0 && (
              <div className="mt-5 space-y-3">
                {selectedImages.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-4 border border-[#e7e5df] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-[#77786e]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {index === 0 ? " · Main image" : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0 p-2 text-red-600 hover:bg-red-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-[#e7e5df] bg-white p-5 sm:p-8">
            <h2 className="mb-5 font-serif text-xl">
              Publishing
            </h2>

            <label className="mb-2 block text-sm font-medium">
              Listing Status
            </label>

            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full border border-[#dedbd2] bg-white px-4 py-3 text-sm outline-none focus:border-[#9a8458] sm:max-w-sm"
            >
              <option value="draft">Draft — keep hidden</option>
              <option value="published">Published — show on website</option>
              <option value="sold">Sold</option>
            </select>

            <p className="mt-3 text-xs leading-5 text-[#77786e]">
              Draft listings remain hidden from public visitors.
              Published listings can be displayed on the website once
              the public pages are connected to Supabase.
            </p>
          </section>

          {error && (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin"
              className="border border-[#dedbd2] px-6 py-4 text-center text-xs font-semibold uppercase tracking-widest transition hover:bg-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#272d25] px-7 py-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[#444b3d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <LoaderCircle size={16} className="animate-spin" />
              )}

              {saving ? "Saving Property..." : "Save Property"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}