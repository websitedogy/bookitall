export type FieldType = "text" | "tel" | "email" | "number" | "textarea" | "select";

export type VendorField = {
  name: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
};

export type VendorFormSection = {
  title: string;
  description?: string;
  fields: VendorField[];
};

export type VendorFormConfig = {
  id: string;
  title: string;
  subtitle: string;
  sections: VendorFormSection[];
};

const contactSection: VendorFormSection = {
  title: "Vendor details",
  description: "This is used to verify you and show your listing to customers.",
  fields: [
    { name: "businessName", label: "Business name", placeholder: "Registered or trading name", type: "text", required: true },
    { name: "ownerName", label: "Owner / contact name", placeholder: "Full name", type: "text", required: true },
    { name: "phone", label: "Phone", placeholder: "10-digit mobile", type: "tel", required: true },
    { name: "email", label: "Email", placeholder: "business@email.com", type: "email", required: true },
    { name: "houseNumber", label: "Door / house number", placeholder: "10-5-11", type: "text", required: true, hint: "As on your board, e.g. 10-5-11 or 8-2-293/82" },
    { name: "street", label: "Street / road", placeholder: "Road No. 12", type: "text", required: true },
    { name: "city", label: "City", placeholder: "Hyderabad", type: "text", required: true },
    { name: "area", label: "Area / locality", placeholder: "Banjara Hills", type: "text", required: true },
    { name: "address", label: "Landmark / rest of address", placeholder: "Near community hall, pincode 500034", type: "textarea", required: true },
  ],
};

export const VENDOR_FORMS: Record<string, VendorFormConfig> = {
  hotels: {
    id: "hotels",
    title: "Hotels",
    subtitle: "",
    sections: [
      {
        title: "Hotel",
        fields: [
          { name: "hotelName", label: "Hotel Name", placeholder: "Rajahmundry Grand Inn", type: "text", required: true },
          { name: "phone", label: "Mobile Number", placeholder: "10-digit mobile", type: "tel", required: true },
          { name: "hotelType", label: "Hotel Type", type: "select", required: true, options: ["Hotel", "Lodge", "Guest House", "Resort", "Homestay", "Hostel", "Apartment", "Serviced Apartment", "Villa", "Farmhouse", "Cottage", "Boutique Hotel", "Heritage / Palace", "Bed & Breakfast", "Motel", "Studio", "Penthouse", "Dormitory", "Paying Guest (PG)", "Camp / Tent", "Houseboat", "Treehouse"] },
          { name: "roomType", label: "Room Type", type: "select", required: true, options: ["Standard", "Deluxe", "Super Deluxe", "Suite", "AC", "Non-AC", "Dormitory"] },
          { name: "location", label: "Location", placeholder: "Danavaipeta, Rajahmundry", type: "text", required: true },
          { name: "price", label: "Price", placeholder: "2499", type: "number", required: true, hint: "Choose Per Room or Per Day on the hotel form" },
          { name: "entryPrice", label: "Entry Price", placeholder: "Optional", type: "number" },
        ],
      },
    ],
  },
  tours: {
    id: "tours",
    title: "Tours",
    subtitle: "",
    sections: [
      contactSection,
      {
        title: "Package",
        fields: [
          { name: "packageName", label: "Package name", placeholder: "Tirupati darshan — 2 days", type: "text", required: true },
          { name: "destinations", label: "Destinations", placeholder: "Tirupati, Tirumala", type: "text", required: true },
          { name: "duration", label: "Duration", placeholder: "2 days / 1 night", type: "text", required: true },
          { name: "groupSize", label: "Group size", placeholder: "2–12 people", type: "text" },
          { name: "priceFrom", label: "Starting price (₹)", placeholder: "8999", type: "number", required: true },
          { name: "inclusions", label: "Inclusions", placeholder: "Transport, hotel, meals, darshan", type: "textarea", required: true },
          { name: "description", label: "Itinerary summary", type: "textarea", required: true },
        ],
      },
    ],
  },
  cabs: {
    id: "cabs",
    title: "Cabs",
    subtitle: "",
    sections: [
      contactSection,
      {
        title: "Vehicle & driver",
        fields: [
          {
            name: "vehicleType",
            label: "Vehicle type",
            type: "select",
            required: true,
            options: ["Hatchback", "Sedan", "SUV", "Innova / MPV", "Tempo traveller"],
          },
          { name: "vehicleNumber", label: "Vehicle number", placeholder: "TS09 AB 1234", type: "text", required: true },
          { name: "seats", label: "Seating capacity", placeholder: "4", type: "number", required: true },
          {
            name: "serviceType",
            label: "Service type",
            type: "select",
            required: true,
            options: ["Local", "Outstation", "Hourly rental", "All"],
          },
          { name: "perKm", label: "Rate per km (₹)", placeholder: "14", type: "number", required: true },
          { name: "driverName", label: "Driver name", type: "text", required: true },
          { name: "licenseNumber", label: "Driving licence number", type: "text", required: true },
          { name: "description", label: "Notes for customers", placeholder: "AC, luggage, night charges", type: "textarea" },
        ],
      },
    ],
  },
  electrician: {
    id: "electrician",
    title: "Electrician",
    subtitle: "",
    sections: [
      contactSection,
      homeServiceSection("Electrical", ["Fan & lights", "MCB / fuse", "New point wiring", "Inverter", "All of the above"]),
    ],
  },
  plumber: {
    id: "plumber",
    title: "Plumber",
    subtitle: "",
    sections: [
      contactSection,
      homeServiceSection("Plumbing", ["Leak repair", "Tap & mixer", "Drain cleaning", "Bathroom fitting", "All of the above"]),
    ],
  },
  ac: {
    id: "ac",
    title: "AC",
    subtitle: "",
    sections: [],
  },
  cleaning: {
    id: "cleaning",
    title: "Cleaning",
    subtitle: "",
    sections: [],
  },
  jobs: {
    id: "jobs",
    title: "Jobs",
    subtitle: "",
    sections: [
      contactSection,
      {
        title: "Consultancy",
        fields: [
          { name: "sectors", label: "Sectors you hire for", placeholder: "IT, BPO, sales, campus", type: "text", required: true },
          { name: "servicesOffered", label: "Services", placeholder: "Resume, interview prep, walk-ins", type: "textarea", required: true },
          { name: "experienceYears", label: "Years in placement", placeholder: "5", type: "number", required: true },
          { name: "feeFrom", label: "Starting fee (₹)", placeholder: "999", type: "number", required: true },
          { name: "description", label: "About your desk", type: "textarea", required: true },
        ],
      },
    ],
  },
  beautician: {
    id: "beautician",
    title: "Beauty",
    subtitle: "",
    sections: [
      contactSection,
      {
        title: "Beauty",
        fields: [
          {
            name: "workType",
            label: "Where you work",
            type: "select",
            required: true,
            options: ["At home", "Salon", "Both"],
          },
          { name: "servicesOffered", label: "Services", placeholder: "Bridal makeup, facial, mehendi", type: "textarea", required: true },
          { name: "experienceYears", label: "Years of experience", placeholder: "4", type: "number", required: true },
          { name: "priceFrom", label: "Starting price (₹)", placeholder: "799", type: "number", required: true },
          { name: "description", label: "About your work", type: "textarea", required: true },
        ],
      },
    ],
  },
  painting: {
    id: "painting",
    title: "Painting",
    subtitle: "",
    sections: [],
  },
  carpenter: {
    id: "carpenter",
    title: "Carpenter",
    subtitle: "",
    sections: [],
  },
  appliance: {
    id: "appliance",
    title: "Appliance",
    subtitle: "",
    sections: [],
  },
  "public-transport": {
    id: "public-transport",
    title: "Public Transport",
    subtitle: "",
    sections: [],
  },
  "goods-transport": {
    id: "goods-transport",
    title: "Goods Transport",
    subtitle: "",
    sections: [],
  },
  "packers-movers": {
    id: "packers-movers",
    title: "Packers & Movers",
    subtitle: "",
    sections: [],
  },
  "cloud-kitchen": {
    id: "cloud-kitchen",
    title: "Cloud Kitchen",
    subtitle: "",
    sections: [],
  },
};

function homeServiceSection(skillLabel: string, options: string[]): VendorFormSection {
  return {
    title: "Service",
    fields: [
      { name: "primarySkill", label: `${skillLabel} focus`, type: "select", required: true, options },
      { name: "experienceYears", label: "Years of experience", placeholder: "5", type: "number", required: true },
      { name: "visitCharge", label: "Visit / starting charge (₹)", placeholder: "299", type: "number", required: true },
      { name: "availability", label: "Availability", type: "select", required: true, options: ["Same day", "Next day", "Weekdays", "Weekends", "Anytime"] },
      { name: "description", label: "What you offer", placeholder: "Tools, parts, typical jobs", type: "textarea", required: true },
    ],
  };
}

export function vendorFormById(id: string) {
  return VENDOR_FORMS[id] ?? null;
}
