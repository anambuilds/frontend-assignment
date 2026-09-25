"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FilterX,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Shell from "./Shell";
import ProductForm from "./ProductForm";
import ConfirmDialog from "./ConfirmDialog";
import {
  addProduct,
  deleteProduct,
  editProduct,
  getCategories,
  getProducts,
  getSession,
} from "@/lib/api";
import { rememberAdded, rememberDeleted, rememberEdited, withLocalChanges } from "@/lib/changes";
import type { Category, Product, ProductInput, ProductList, SortOption } from "@/lib/types";

const sizes = [10, 20, 50];
const sorts: SortOption[] = ["title-asc", "title-desc", "price-asc", "price-desc", "rating-desc"];
const sortLabels: Record<SortOption, string> = {
  "title-asc": "Name: A to Z",
  "title-desc": "Name: Z to A",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "rating-desc": "Rating: high to low",
};

function parsePositive(value: string | null, fallback: number) {
  const number = Number(value);
  return value && Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ProductImage({ product }: { product: Product }) {
  return (
    <div className="product-image">
      {product.thumbnail ? (
        <img
          src={product.thumbnail}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <Package size={22} />
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePositive(searchParams.get("page"), 1);
  const sizeValue = parsePositive(searchParams.get("size"), 10);
  const size = sizes.includes(sizeValue) ? sizeValue : 10;
  const search = (searchParams.get("search") || "").trim();
  const category = searchParams.get("category") || "";
  const sortValue = searchParams.get("sort") as SortOption;
  const sort = sorts.includes(sortValue) ? sortValue : "title-asc";
  const [searchInput, setSearchInput] = useState(search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [list, setList] = useState<ProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [formProduct, setFormProduct] = useState<Product | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState("");
  const request = useRef<AbortController | null>(null);
  const deleting = useRef(false);

  const updateUrl = useCallback(
    (
      changes: Partial<Record<"page" | "size" | "search" | "category" | "sort", string | number>>,
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (
          !value ||
          (key === "page" && value === 1) ||
          (key === "size" && value === 10) ||
          (key === "sort" && value === "title-asc")
        )
          next.delete(key);
        else next.set(key, String(value));
      }
      router.replace(`/products${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    if (searchInput === search) return;
    request.current?.abort();
    setLoading(true);
    const timer = window.setTimeout(
      () => updateUrl({ search: searchInput.trim(), category: "", page: 1 }),
      450,
    );
    return () => window.clearTimeout(timer);
  }, [searchInput, search, updateUrl]);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        if (!controller.signal.aborted) setCategoryError("Categories could not load.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    getProducts({ page, size, search, category: search ? "" : category, sort }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const changed = withLocalChanges(data, {
          page,
          size,
          search,
          category: search ? "" : category,
          sort,
        });
        const lastPage = Math.max(1, Math.ceil(changed.total / size));
        if (page > lastPage) {
          updateUrl({ page: lastPage });
          return;
        }
        setList(changed);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : "Products could not load.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, size, search, category, sort, retry, router, updateUrl]);

  useEffect(() => {
    function expired() {
      router.replace("/login");
      router.refresh();
    }
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function saveProduct(value: ProductInput) {
    if (formProduct && formProduct !== "new") {
      const response =
        formProduct.id < 0
          ? { ...formProduct, ...value }
          : await editProduct(formProduct.id, value);
      rememberEdited({ ...formProduct, ...response, ...value }, formProduct);
      setToast("Product updated.");
    } else {
      const response = await addProduct(value);
      rememberAdded({
        ...response,
        ...value,
        id: -Date.now(),
        rating: 0,
        images: value.thumbnail ? [value.thumbnail] : [],
        reviews: [],
      });
      setToast("Product added to this workspace.");
      setSearchInput("");
      if (page !== 1 || search || category) {
        updateUrl({ page: 1, search: "", category: "" });
      }
    }
    setFormProduct(null);
    setRetry((value) => value + 1);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting.current) return;
    deleting.current = true;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      if (deleteTarget.id > 0) await deleteProduct(deleteTarget.id);
      rememberDeleted(deleteTarget);
      setDeleteTarget(null);
      setToast("Product removed from this workspace.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "Could not delete this product.");
    } finally {
      deleting.current = false;
      setDeleteBusy(false);
    }
  }

  const total = list?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const first = total ? (page - 1) * size + 1 : 0;
  const last = total ? Math.min(page * size, total) : 0;
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => Math.min(Math.max(page - 2, 1), Math.max(pageCount - 4, 1)) + index,
  );

  return (
    <Shell>
      <div className="breadcrumb">
        Workspace <ChevronRight size={14} /> <strong>Products</strong>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR CATALOG</p>
          <h1>Products</h1>
          <p>Everything you sell, organized in one place.</p>
        </div>
        <button className="button button-primary add-button" onClick={() => setFormProduct("new")}>
          <Plus size={18} /> Add product
        </button>
      </div>
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-icon">
            <Package size={21} />
          </span>
          <div>
            <span>Total products</span>
            <strong>{list ? total : "..."}</strong>
            <small>In the current view</small>
          </div>
        </div>
        <div className="summary-note">
          <span className="note-sparkle">✦</span>
          <div>
            <strong>Make room for what matters.</strong>
            <span>Search, sort, and update your catalog with ease.</span>
          </div>
        </div>
      </div>
      <section className="content-card" aria-label="Product list">
        <div className="card-heading">
          <div>
            <h2>All products</h2>
            <p>Browse and manage your product details.</p>
          </div>
          <span className="count-pill">{total} products</span>
        </div>
        <div className="toolbar">
          <div className="search-box">
            <Search size={19} />
            <input
              aria-label="Search products"
              placeholder="Search products..."
              value={searchInput}
              onChange={(event) => {
                request.current?.abort();
                setLoading(true);
                setSearchInput(event.target.value);
              }}
            />
            {searchInput && (
              <button
                aria-label="Clear search"
                onClick={() => {
                  request.current?.abort();
                  setLoading(true);
                  setSearchInput("");
                }}
              >
                ×
              </button>
            )}
          </div>
          <div className="toolbar-selects">
            <label className="select-wrap">
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(event) => {
                  request.current?.abort();
                  setSearchInput("");
                  updateUrl({ category: event.target.value, search: "", page: 1 });
                }}
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-wrap">
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(event) => updateUrl({ sort: event.target.value, page: 1 })}
              >
                {sorts.map((item) => (
                  <option key={item} value={item}>
                    {sortLabels[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {categoryError && (
          <div className="inline-note" role="status">
            {categoryError}{" "}
            <button
              onClick={() => {
                setCategoryError("");
                getCategories()
                  .then(setCategories)
                  .catch(() => setCategoryError("Categories could not load."));
              }}
            >
              Try again
            </button>
          </div>
        )}
        {search && category && (
          <p className="inline-note">
            Search takes priority over the category filter. Choose a category to clear the search.
          </p>
        )}
        {error ? (
          <div className="state-panel">
            <span className="state-icon error-icon">
              <CircleAlert size={25} />
            </span>
            <h3>Could not load products</h3>
            <p>{error}</p>
            <button
              className="button button-primary"
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        ) : loading ? (
          <div className="state-panel" role="status">
            <span className="spinner" />
            <h3>Loading products</h3>
            <p>Getting your catalog ready.</p>
          </div>
        ) : !list?.products.length ? (
          <div className="state-panel">
            <span className="state-icon">
              <FilterX size={25} />
            </span>
            <h3>No products found</h3>
            <p>Try another search or category to see more products.</p>
            <button
              className="button button-quiet"
              onClick={() => {
                setSearchInput("");
                updateUrl({ search: "", category: "", page: 1 });
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>RATING</th>
                    <th>STOCK</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <ProductImage product={product} />
                          <div>
                            <Link href={`/products/${product.id}`} className="product-title">
                              {product.title}
                            </Link>
                            <span className="product-id">
                              #{product.id < 0 ? "NEW" : String(product.id).padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">
                          {product.category.replaceAll("-", " ")}
                        </span>
                      </td>
                      <td className="price-cell">{money(product.price)}</td>
                      <td>
                        <span className="rating">
                          <Star size={15} fill="currentColor" />{" "}
                          {product.rating?.toFixed(1) || "0.0"}
                        </span>
                      </td>
                      <td>
                        <span className={`stock-tag ${product.stock < 10 ? "stock-low" : ""}`}>
                          {product.stock < 10 ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            title="Edit product"
                            aria-label={`Edit ${product.title}`}
                            onClick={() => setFormProduct(product)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="icon-button delete-action"
                            title="Delete product"
                            aria-label={`Delete ${product.title}`}
                            onClick={() => {
                              setDeleteTarget(product);
                              setDeleteError("");
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-product-list">
              {list.products.map((product) => (
                <article className="mobile-product" key={product.id}>
                  <div className="mobile-product-top">
                    <ProductImage product={product} />
                    <div>
                      <Link href={`/products/${product.id}`} className="product-title">
                        {product.title}
                      </Link>
                      <span className="product-id">{product.category.replaceAll("-", " ")}</span>
                    </div>
                  </div>
                  <div className="mobile-product-bottom">
                    <strong>{money(product.price)}</strong>
                    <span className="rating">
                      <Star size={14} fill="currentColor" /> {product.rating?.toFixed(1) || "0.0"}
                    </span>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${product.title}`}
                        onClick={() => setFormProduct(product)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button delete-action"
                        aria-label={`Delete ${product.title}`}
                        onClick={() => {
                          setDeleteTarget(product);
                          setDeleteError("");
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        <div className="pagination">
          <div className="pagination-summary">
            Showing{" "}
            <strong>
              {first}-{last}
            </strong>{" "}
            of <strong>{total}</strong>
          </div>
          <div className="pagination-controls">
            <label className="per-page">
              Rows per page{" "}
              <select
                aria-label="Rows per page"
                value={size}
                onChange={(event) => updateUrl({ size: Number(event.target.value), page: 1 })}
              >
                {sizes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="page-button arrow"
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => updateUrl({ page: page - 1 })}
            >
              <ChevronLeft size={17} />
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                className={`page-button ${number === page ? "selected" : ""}`}
                aria-label={`Page ${number}`}
                aria-current={number === page ? "page" : undefined}
                disabled={loading}
                onClick={() => updateUrl({ page: number })}
              >
                {number}
              </button>
            ))}
            <button
              className="page-button arrow"
              aria-label="Next page"
              disabled={page >= pageCount || loading}
              onClick={() => updateUrl({ page: page + 1 })}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <p className="dashboard-footnote">
        Product changes are saved in this browser because the demo API does not keep writes.
      </p>
      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
        </div>
      )}
      {formProduct && (
        <ProductForm
          product={formProduct === "new" ? undefined : formProduct}
          categories={categories}
          onClose={() => setFormProduct(null)}
          onSave={saveProduct}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          name={deleteTarget.title}
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => {
            if (!deleteBusy) setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </Shell>
  );
}
