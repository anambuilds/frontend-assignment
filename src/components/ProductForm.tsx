"use client";

import { FormEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Category, Product, ProductInput } from "@/lib/types";

type Props = {
  product?: Product;
  categories: Category[];
  onClose: () => void;
  onSave: (value: ProductInput) => Promise<void>;
};

export default function ProductForm({ product, categories, onClose, onSave }: Props) {
  const [form, setForm] = useState<ProductInput>({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    thumbnail: product?.thumbnail || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  function change<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const title = form.title.trim();
    const description = form.description.trim();
    const thumbnail = form.thumbnail.trim();
    if (!title || !description || !form.category || !Number.isFinite(form.price) || form.price <= 0 || !Number.isInteger(form.stock) || form.stock < 0) {
      setError("Please complete the required fields with a valid price and stock amount.");
      return;
    }
    if (thumbnail) {
      try {
        const url = new URL(thumbnail);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        setError("Enter a valid image URL or leave it blank.");
        return;
      }
    }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, title, description, thumbnail });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this product.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
      <div className="modal-heading"><div><p className="eyebrow">PRODUCT DETAILS</p><h2 id="product-form-title">{product ? "Edit product" : "Add a product"}</h2><p>Keep the details clear and easy to find.</p></div><button className="icon-button" aria-label="Close form" onClick={onClose}><X size={20} /></button></div>
      <form onSubmit={submit} className="product-form">
        <div className="field"><label htmlFor="product-title">Product name <span>*</span></label><input id="product-title" autoFocus value={form.title} onChange={(event) => change("title", event.target.value)} maxLength={100} required placeholder="e.g. Everyday headphones" /></div>
        <div className="field"><label htmlFor="product-description">Description <span>*</span></label><textarea id="product-description" value={form.description} onChange={(event) => change("description", event.target.value)} rows={3} required placeholder="A short description of your product" /></div>
        <div className="field-grid"><div className="field"><label htmlFor="product-category">Category <span>*</span></label><select id="product-category" value={form.category} onChange={(event) => change("category", event.target.value)} required><option value="">Select a category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div><div className="field"><label htmlFor="product-price">Price ($) <span>*</span></label><input id="product-price" type="number" min="0.01" step="0.01" value={form.price || ""} onChange={(event) => change("price", Number(event.target.value))} required /></div></div>
        <div className="field-grid"><div className="field"><label htmlFor="product-stock">Stock <span>*</span></label><input id="product-stock" type="number" min="0" step="1" value={form.stock} onChange={(event) => change("stock", Number(event.target.value))} required /></div><div className="field"><label htmlFor="product-image">Image URL</label><input id="product-image" type="url" value={form.thumbnail} onChange={(event) => change("thumbnail", event.target.value)} placeholder="https://example.com/image.jpg" /></div></div>
        {error && <div className="alert error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving..." : product ? "Save changes" : "Add product"}</button></div>
      </form>
    </section>
  </div>;
}
