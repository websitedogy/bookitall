"use client";

import { CUSTOMER_TYPES, ELECTRICIAN_SERVICES, VISIT_CHARGES } from "./electrician-form-data";
import { TradeRegistrationForm, type TradeSpec } from "./trade-registration-form";

const ELECTRICIAN_SPEC: TradeSpec = {
  id: "electrician",
  title: "Electrician",
  subtitle: "Complete your service profile in a few simple steps.",
  nameLabel: "Business / Electrician Name",
  nameField: "electricianName",
  servicesTitle: "Services Offered",
  services: ELECTRICIAN_SERVICES,
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
  extraCharges: false,
  icon: "zap",
};

export function ElectricianRegistrationForm() {
  return <TradeRegistrationForm spec={ELECTRICIAN_SPEC} />;
}
