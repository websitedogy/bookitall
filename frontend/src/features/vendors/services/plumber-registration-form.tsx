"use client";

import { CUSTOMER_TYPES, PLUMBER_SERVICES, VISIT_CHARGES } from "./electrician-form-data";
import { TradeRegistrationForm, type TradeSpec } from "./trade-registration-form";

const PLUMBER_SPEC: TradeSpec = {
  id: "plumber",
  title: "Plumber",
  subtitle: "Complete your service profile in a few simple steps.",
  nameLabel: "Plumber / Business Name",
  nameField: "plumberName",
  servicesTitle: "Services Offered",
  services: PLUMBER_SERVICES,
  audienceTitle: "Customer Type",
  audienceOptions: CUSTOMER_TYPES,
  chargesTitle: "Charges & Availability",
  chargeLabel: "Visit Charge",
  charges: VISIT_CHARGES,
  chargeAsAmount: true,
  useMapLocation: true,
  hideDistrictCoverage: true,
  showServiceKm: true,
  hideProfilePhoto: true,
  showAdditionalInfo: true,
  emergencyLabel: "Emergency Service",
  extraCharges: true,
  icon: "wrench",
};

export function PlumberRegistrationForm() {
  return <TradeRegistrationForm spec={PLUMBER_SPEC} />;
}
