"use client";

import { AlertTriangle, X } from "lucide-react";

type Props = {
  name: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ name, busy, error, onCancel, onConfirm }: Props) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        className="modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
      >
        <button
          className="icon-button modal-close"
          aria-label="Close dialog"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={20} />
        </button>
        <span className="danger-icon">
          <AlertTriangle size={25} />
        </span>
        <h2 id="delete-title">Delete this product?</h2>
        <p id="delete-description">
          <strong>{name}</strong> will be removed from this workspace. This action cannot be undone
          here.
        </p>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="button button-quiet" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="button button-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete product"}
          </button>
        </div>
      </section>
    </div>
  );
}
