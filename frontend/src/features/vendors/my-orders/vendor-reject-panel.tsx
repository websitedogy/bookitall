"use client";

import { useState } from "react";
import {
  VENDOR_REJECT_OTHER,
  VENDOR_REJECT_REASONS,
  validateVendorReject,
  vendorRejectPayload,
} from "./vendor-reject-reasons";

const selectClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

export function VendorRejectPanel({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (payload: { reason: string; comment: string }) => void;
}) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [localError, setLocalError] = useState("");
  const other = reason === VENDOR_REJECT_OTHER;

  function submit() {
    const message = validateVendorReject(reason, comment);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    onConfirm(vendorRejectPayload(reason, comment));
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          Reason <span className="text-red-500">*</span>
        </span>
        <select
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setLocalError("");
          }}
          className={selectClass}
        >
          <option value="">Select why you are rejecting</option>
          {VENDOR_REJECT_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {other ? (
        <label className="block">
          <span className="text-sm font-medium text-slate-800">
            Comment <span className="text-red-500">*</span>
          </span>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setLocalError("");
            }}
            rows={3}
            placeholder="Write why you are rejecting this order"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
          />
        </label>
      ) : null}
      {localError || error ? <p className="text-sm text-red-600">{localError || error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex h-10 flex-1 items-center justify-center border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="inline-flex h-10 flex-1 items-center justify-center bg-red-600 text-xs font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Rejecting…" : "Confirm reject"}
        </button>
      </div>
    </div>
  );
}
