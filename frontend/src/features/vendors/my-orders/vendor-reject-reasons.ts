export const VENDOR_REJECT_OTHER = "Other";

export const VENDOR_REJECT_REASONS = [
  "Too far / outside my coverage",
  "Not available at this time",
  "Already booked / no rooms or slots",
  "Incomplete customer details",
  "Cannot take this type of work",
  VENDOR_REJECT_OTHER,
] as const;

export function validateVendorReject(reason: string, comment: string) {
  if (!reason.trim()) return "Select a reason for rejecting this order.";
  if (reason === VENDOR_REJECT_OTHER && !comment.trim()) return "Write why you are rejecting this order.";
  return "";
}

export function vendorRejectPayload(reason: string, comment: string) {
  return {
    reason: reason.trim(),
    comment: reason === VENDOR_REJECT_OTHER ? comment.trim() : "",
  };
}
