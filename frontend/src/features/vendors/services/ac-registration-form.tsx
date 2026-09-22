"use client";

import { AC_BRANDS, AC_SERVICES, AC_TYPES, VISIT_CHARGES } from "./electrician-form-data";
import { TradeRegistrationForm, type TradeSpec } from "./trade-registration-form";

const AC_SPEC: TradeSpec = {
  id: "ac",
  title: "AC",
  subtitle: "Complete your AC service profile in a few simple steps.",
  nameLabel: "Business / Technician Name",
  nameField: "technicianName",
  servicesTitle: "AC Services Offered",
  services: AC_SERVICES,
  audienceTitle: "AC Types & Brands",
  audienceOptions: [],
  extraGroups: [
    { title: "AC Types", field: "acType", required: true, options: AC_TYPES },
    { title: "Brands Supported", field: "brand", options: AC_BRANDS },
  ],
  chargesTitle: "Charges & Availability",
  chargeLabel: "Visit Charge",
  charges: VISIT_CHARGES,
  chargeAsAmount: true,
  useMapLocation: true,
  hideDistrictCoverage: true,
  showServiceKm: true,
  hideProfilePhoto: true,
  showAdditionalInfo: true,
  emergencyLabel: "Emergency / Same-Day Service",
  extraCharges: true,
  icon: "snow",
};

export function AcRegistrationForm() {
  return <TradeRegistrationForm spec={AC_SPEC} />;
}
