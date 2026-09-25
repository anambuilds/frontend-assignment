import type { ListParams, Product, ProductList } from "./types";

const KEY = "product_admin_changes";

type Changes = {
  added: Product[];
  edited: Record<string, Product>;
  original: Record<string, Product>;
  deleted: Record<string, Product>;
};

function read(): Changes {
  const empty: Changes = { added: [], edited: {}, original: {}, deleted: {} };
  if (typeof window === "undefined") return empty;
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || "null") as Changes | null;
    return value && Array.isArray(value.added) && value.edited && value.deleted
      ? { ...value, original: value.original || {} }
      : empty;
  } catch {
    return empty;
  }
}

function write(changes: Changes) {
  window.localStorage.setItem(KEY, JSON.stringify(changes));
  window.dispatchEvent(new Event("products-changed"));
}

export function rememberAdded(product: Product) {
  const changes = read();
  changes.added.unshift(product);
  write(changes);
}

export function rememberEdited(product: Product, previous: Product) {
  const changes = read();
  const index = changes.added.findIndex((item) => item.id === product.id);
  if (index >= 0) changes.added[index] = product;
  else {
    if (!changes.original[product.id]) changes.original[product.id] = previous;
    changes.edited[product.id] = product;
  }
  write(changes);
}

export function rememberDeleted(product: Product) {
  const changes = read();
  const wasAdded = changes.added.some((item) => item.id === product.id);
  changes.added = changes.added.filter((item) => item.id !== product.id);
  delete changes.edited[product.id];
  if (!wasAdded) changes.deleted[product.id] = changes.original[product.id] || product;
  delete changes.original[product.id];
  write(changes);
}

export function findAddedProduct(id: number): Product | undefined {
  return read().added.find((product) => product.id === id);
}

export function localProduct(product: Product): Product | null {
  const changes = read();
  if (changes.deleted[product.id]) return null;
  return changes.edited[product.id] || product;
}

function matches(product: Product, params: ListParams) {
  if (params.category && product.category !== params.category) return false;
  if (params.search) {
    const term = params.search.toLowerCase();
    return `${product.title} ${product.description} ${product.brand || ""}`
      .toLowerCase()
      .includes(term);
  }
  return true;
}

export function withLocalChanges(list: ProductList, params: ListParams): ProductList {
  const changes = read();
  const edited = Object.values(changes.edited);
  const added = changes.added.filter((product) => matches(product, params));
  const deletedCount = Object.values(changes.deleted).filter((product) =>
    matches(product, params),
  ).length;
  const movedIn = edited.filter(
    (product) =>
      matches(product, params) &&
      changes.original[product.id] &&
      !matches(changes.original[product.id], params),
  );
  const movedOut = edited.filter(
    (product) =>
      !matches(product, params) &&
      changes.original[product.id] &&
      matches(changes.original[product.id], params),
  ).length;
  const products = list.products
    .filter((product) => !changes.deleted[product.id])
    .map((product) => changes.edited[product.id] || product)
    .filter((product) => matches(product, params));
  if (params.page === 1) products.unshift(...added, ...movedIn);
  return {
    ...list,
    products: products.slice(0, params.size),
    total: Math.max(0, list.total + added.length + movedIn.length - deletedCount - movedOut),
  };
}
