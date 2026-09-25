"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  ImageIcon,
  Package,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import Shell from "@/components/Shell";
import ProductForm from "@/components/ProductForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteProduct, editProduct, getCategories, getProduct, getSession } from "@/lib/api";
import { findAddedProduct, localProduct, rememberDeleted, rememberEdited } from "@/lib/changes";
import type { Category, Product, ProductInput } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function ProductDetailsPage() {
  const router = useRouter();
  const route = useParams<{ id: string }>();
  const id = Number(route.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setMissing(false);
    if (!Number.isSafeInteger(id) || id === 0) {
      setMissing(true);
      setLoading(false);
      return;
    }
    if (id < 0) {
      const local = findAddedProduct(id);
      setProduct(local || null);
      setMissing(!local);
      setLoading(false);
      return;
    }
    getProduct(id, controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        const current = localProduct(value);
        setProduct(current);
        setMissing(!current);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        if (reason instanceof Error && reason.message.toLowerCase().includes("not found"))
          setMissing(true);
        else setError(reason instanceof Error ? reason.message : "Could not load this product.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry, router]);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function expired() {
      router.replace("/login");
      router.refresh();
    }
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [router]);

  async function save(value: ProductInput) {
    if (!product) return;
    const result = product.id < 0 ? { ...product, ...value } : await editProduct(product.id, value);
    const updated = { ...product, ...result, ...value };
    rememberEdited(updated, product);
    setProduct(updated);
    setEditing(false);
  }

  async function remove() {
    if (!product || busy.current) return;
    busy.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      if (product.id > 0) await deleteProduct(product.id);
      rememberDeleted(product);
      router.push("/products");
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "Could not delete this product.");
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  }

  const images = product
    ? [...new Set([...(product.images || []), product.thumbnail].filter(Boolean))]
    : [];
  const selectedImage = images[imageIndex] || images[0];

  return (
    <Shell>
      <Link href="/products" className="back-link">
        <ArrowLeft size={17} /> Back to products
      </Link>
      {loading ? (
        <div className="state-panel detail-state" role="status">
          <span className="spinner" />
          <h3>Loading product</h3>
          <p>Getting the details ready.</p>
        </div>
      ) : error ? (
        <div className="state-panel detail-state">
          <span className="state-icon error-icon">
            <CircleAlert size={25} />
          </span>
          <h3>Could not load this product</h3>
          <p>{error}</p>
          <button className="button button-primary" onClick={() => setRetry((value) => value + 1)}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : missing || !product ? (
        <div className="state-panel detail-state">
          <span className="state-icon">
            <Package size={25} />
          </span>
          <h3>Product not found</h3>
          <p>That product may have been removed or the link may be wrong.</p>
          <Link href="/products" className="button button-primary">
            View all products
          </Link>
        </div>
      ) : (
        <>
          <div className="detail-heading">
            <div>
              <p className="eyebrow">PRODUCT DETAILS</p>
              <h1>{product.title}</h1>
              <p>
                Product #{product.id < 0 ? "NEW" : product.id} <span>•</span>{" "}
                {product.category.replaceAll("-", " ")}
              </p>
            </div>
            <div className="detail-actions">
              <button className="button button-quiet" onClick={() => setEditing(true)}>
                <Pencil size={17} /> Edit
              </button>
              <button className="button button-danger-soft" onClick={() => setConfirming(true)}>
                <Trash2 size={17} /> Delete
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="gallery-card">
              <div className="gallery-main">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon size={42} />
                )}
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      className={index === imageIndex ? "active" : ""}
                      aria-label={`View image ${index + 1}`}
                      onClick={() => setImageIndex(index)}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-info">
              <div className="detail-price">
                <span>Price</span>
                <strong>{money(product.price)}</strong>
              </div>
              <div className="detail-pills">
                <span className="category-tag">{product.category.replaceAll("-", " ")}</span>
                <span className="rating">
                  <Star size={16} fill="currentColor" /> {product.rating?.toFixed(1) || "0.0"}{" "}
                  rating
                </span>
              </div>
              <h2>About this product</h2>
              <p>{product.description}</p>
              <div className="detail-specs">
                <div>
                  <span>Brand</span>
                  <strong>{product.brand || "Not listed"}</strong>
                </div>
                <div>
                  <span>Stock available</span>
                  <strong>{product.stock} units</strong>
                </div>
                <div>
                  <span>SKU</span>
                  <strong>{product.sku || "Not listed"}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>
                    {product.discountPercentage ? `${product.discountPercentage}%` : "None"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
          <section className="reviews-card">
            <div className="card-heading">
              <div>
                <h2>Customer reviews</h2>
                <p>What customers have shared about this product.</p>
              </div>
              <span className="count-pill">{product.reviews?.length || 0} reviews</span>
            </div>
            {product.reviews?.length ? (
              <div className="reviews-list">
                {product.reviews.map((review, index) => (
                  <article key={`${review.reviewerName}-${index}`} className="review">
                    <div className="review-top">
                      <strong>{review.reviewerName}</strong>
                      <span className="rating">
                        <Star size={14} fill="currentColor" /> {review.rating}
                      </span>
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet for this product.</p>
            )}
          </section>
        </>
      )}
      {editing && product && (
        <ProductForm
          product={product}
          categories={categories}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      )}
      {confirming && product && (
        <ConfirmDialog
          name={product.title}
          busy={deleting}
          error={deleteError}
          onCancel={() => {
            if (!deleting) setConfirming(false);
          }}
          onConfirm={remove}
        />
      )}
    </Shell>
  );
}
