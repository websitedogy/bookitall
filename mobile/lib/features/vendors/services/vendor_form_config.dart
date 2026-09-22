class VendorField {
  const VendorField({
    required this.name,
    required this.label,
    required this.type,
    this.placeholder,
    this.required = false,
    this.options,
    this.hint,
  });

  final String name;
  final String label;
  final String type;
  final String? placeholder;
  final bool required;
  final List<String>? options;
  final String? hint;
}

class VendorFormSection {
  const VendorFormSection({
    required this.title,
    required this.fields,
    this.description,
  });

  final String title;
  final String? description;
  final List<VendorField> fields;
}

class VendorFormConfig {
  const VendorFormConfig({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.sections,
  });

  final String id;
  final String title;
  final String subtitle;
  final List<VendorFormSection> sections;
}

const _contactSection = VendorFormSection(
  title: 'Vendor details',
  description: 'This is used to verify you and show your listing to customers.',
  fields: [
    VendorField(name: 'businessName', label: 'Business name', placeholder: 'Registered or trading name', type: 'text', required: true),
    VendorField(name: 'ownerName', label: 'Owner / contact name', placeholder: 'Full name', type: 'text', required: true),
    VendorField(name: 'phone', label: 'Phone', placeholder: '10-digit mobile', type: 'tel', required: true),
    VendorField(name: 'email', label: 'Email', placeholder: 'business@email.com', type: 'email', required: true),
    VendorField(name: 'houseNumber', label: 'Door / house number', placeholder: '10-5-11', type: 'text', required: true, hint: 'As on your board, e.g. 10-5-11 or 8-2-293/82'),
    VendorField(name: 'street', label: 'Street / road', placeholder: 'Road No. 12', type: 'text', required: true),
    VendorField(name: 'city', label: 'City', placeholder: 'Hyderabad', type: 'text', required: true),
    VendorField(name: 'area', label: 'Area / locality', placeholder: 'Banjara Hills', type: 'text', required: true),
    VendorField(name: 'address', label: 'Landmark / rest of address', placeholder: 'Near community hall, pincode 500034', type: 'textarea', required: true),
  ],
);

final vendorForms = <String, VendorFormConfig>{
  'hotels': const VendorFormConfig(
    id: 'hotels',
    title: 'Hotel Booking Provider Registration',
    subtitle: 'Register your property, rooms, nightly rates, facilities and booking availability.',
    sections: [
      VendorFormSection(
        title: 'Hotel',
        fields: [
          VendorField(name: 'hotelName', label: 'Hotel Name', placeholder: 'Rajahmundry Grand Inn', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(
            name: 'hotelType',
            label: 'Hotel Type',
            type: 'select',
            required: true,
            options: ['Hotel', 'Lodge', 'Guest House', 'Resort', 'Homestay', 'Hostel', 'Apartment', 'Serviced Apartment', 'Villa', 'Farmhouse', 'Cottage', 'Boutique Hotel', 'Heritage / Palace', 'Bed & Breakfast', 'Motel', 'Studio', 'Penthouse', 'Dormitory', 'Paying Guest (PG)', 'Camp / Tent', 'Houseboat', 'Treehouse'],
          ),
          VendorField(
            name: 'roomType',
            label: 'Room Type',
            type: 'select',
            required: true,
            options: ['Standard', 'Deluxe', 'Super Deluxe', 'Suite', 'AC', 'Non-AC', 'Dormitory'],
          ),
          VendorField(name: 'price', label: 'Price', placeholder: '2499', type: 'number', required: true),
          VendorField(
            name: 'priceUnit',
            label: 'Price unit',
            type: 'select',
            required: true,
            options: ['Per Room', 'Per Day'],
          ),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'tours': const VendorFormConfig(
    id: 'tours',
    title: 'Tours & Travel Provider Registration',
    subtitle: 'Register tour packages, pricing, transport, inclusions and booking availability.',
    sections: [
      _contactSection,
      VendorFormSection(
        title: 'Package',
        fields: [
          VendorField(name: 'packageName', label: 'Package name', placeholder: 'Tirupati darshan — 2 days', type: 'text', required: true),
          VendorField(name: 'destinations', label: 'Destinations', placeholder: 'Tirupati, Tirumala', type: 'text', required: true),
          VendorField(name: 'duration', label: 'Duration', placeholder: '2 days / 1 night', type: 'text', required: true),
          VendorField(name: 'groupSize', label: 'Group size', placeholder: '2–12 people', type: 'text'),
          VendorField(name: 'priceFrom', label: 'Starting price (₹)', placeholder: '8999', type: 'number', required: true),
          VendorField(name: 'inclusions', label: 'Inclusions', placeholder: 'Transport, hotel, meals, darshan', type: 'textarea', required: true),
          VendorField(name: 'description', label: 'Itinerary summary', type: 'textarea', required: true),
        ],
      ),
    ],
  ),
  'cabs': const VendorFormConfig(
    id: 'cabs',
    title: 'Cab Booking Provider Registration',
    subtitle: 'Register vehicles, fares, drivers and booking availability.',
    sections: [
      VendorFormSection(
        title: 'Cab',
        fields: [
          VendorField(name: 'driverName', label: 'Driver Name', placeholder: 'Ravi Kumar', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'cabType', label: 'Cab Type', type: 'select', required: true, options: ['Hatchback', 'Sedan', 'SUV', 'Innova / MPV', 'Tempo traveller']),
          VendorField(name: 'vehicleModel', label: 'Vehicle Model', placeholder: 'Dzire / Innova', type: 'text'),
          VendorField(name: 'vehicleNumber', label: 'Vehicle Number', placeholder: 'AP05 AB 1234', type: 'text'),
          VendorField(name: 'bookingType', label: 'Booking Type', type: 'select', required: true, options: ['Local', 'Outstation', 'Airport']),
          VendorField(name: 'price', label: 'Price', placeholder: '14', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per KM', 'Per Day', 'Per Trip']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'electrician': const VendorFormConfig(
    id: 'electrician',
    title: 'Electrician',
    subtitle: 'Electrician details are saved to your account in the database.',
    sections: [
      VendorFormSection(
        title: 'Electrician',
        fields: [
          VendorField(name: 'shopName', label: 'Shop Name', placeholder: 'SparkFix', type: 'text'),
          VendorField(name: 'electricianName', label: 'Electrician Name', placeholder: 'Suresh', type: 'text'),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Home', 'Commercial']),
          VendorField(name: 'workType', label: 'Work Type', type: 'select', required: true, options: ['Wiring', 'Repair', 'Installation']),
          VendorField(name: 'price', label: 'Price', placeholder: '299', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Visit', 'Per Hour']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'plumber': const VendorFormConfig(
    id: 'plumber',
    title: 'Plumber',
    subtitle: 'Plumber details are saved to your account in the database.',
    sections: [
      VendorFormSection(
        title: 'Plumber',
        fields: [
          VendorField(name: 'shopName', label: 'Shop Name', placeholder: 'QuickFlow', type: 'text'),
          VendorField(name: 'plumberName', label: 'Plumber Name', placeholder: 'Ramesh', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Home', 'Commercial']),
          VendorField(name: 'workType', label: 'Work Type', type: 'select', required: true, options: ['Repair', 'Installation', 'Pipeline']),
          VendorField(name: 'price', label: 'Price', placeholder: '299', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Visit', 'Per Hour']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'ac': const VendorFormConfig(
    id: 'ac',
    title: 'AC Repair',
    subtitle: 'AC details are saved to your account in the database.',
    sections: [
      VendorFormSection(
        title: 'AC Repair',
        fields: [
          VendorField(name: 'shopName', label: 'Shop / Service Name', placeholder: 'CoolAir Hyd', type: 'text'),
          VendorField(name: 'technicianName', label: 'Technician Name', placeholder: 'Suresh', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'acType', label: 'AC Type', type: 'select', required: true, options: ['Split', 'Window', 'Cassette', 'Tower']),
          VendorField(
            name: 'serviceType',
            label: 'Service Type',
            type: 'select',
            required: true,
            options: ['Repair', 'Installation', 'Service', 'Gas Filling', 'Cleaning', 'Maintenance', 'AMC', 'Uninstallation', 'Replacement', 'General Checkup'],
          ),
          VendorField(name: 'brand', label: 'Brand', placeholder: 'Voltas / LG / Daikin', type: 'text'),
          VendorField(name: 'price', label: 'Price', placeholder: '499', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Visit', 'Per Service']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'cleaning': const VendorFormConfig(
    id: 'cleaning',
    title: 'Cleaning',
    subtitle: 'Cleaning details are saved to your account in the database.',
    sections: [
      VendorFormSection(
        title: 'Cleaning',
        fields: [
          VendorField(name: 'serviceName', label: 'Service Name', placeholder: 'Sparkle Crew', type: 'text'),
          VendorField(name: 'cleanerName', label: 'Cleaner Name', placeholder: 'Lakshmi', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female']),
          VendorField(
            name: 'cleaningType',
            label: 'Cleaning Type',
            type: 'select',
            required: true,
            options: ['Bathroom', 'Kitchen', 'Water Tank', 'House', 'Sofa', 'All type'],
          ),
          VendorField(name: 'price', label: 'Price', placeholder: '499', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Hour', 'Per Day', 'Per Service', 'Monthly']),
        ],
      ),
    ],
  ),
  'jobs': const VendorFormConfig(
    id: 'jobs',
    title: 'Jobs',
    subtitle: 'These stay on your listing. Customers see them after admin accepts.',
    sections: [
      VendorFormSection(
        title: 'Service details',
        description: 'These stay on your listing. Customers see them after admin accepts.',
        fields: [
          VendorField(name: 'companyName', label: 'Company Name', placeholder: 'Company name', type: 'text', required: true),
          VendorField(name: 'companyDescription', label: 'Company Description', placeholder: 'Tell candidates about your company', type: 'textarea', required: true),
          VendorField(name: 'industry', label: 'Industry', placeholder: 'IT, Hospitality, Retail', type: 'text', required: true),
          VendorField(name: 'companyWebsite', label: 'Company Website', placeholder: 'https://example.com', type: 'text'),
          VendorField(name: 'companySize', label: 'Company Size (optional)', type: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+']),
          VendorField(name: 'establishedYear', label: 'Established Year (optional)', placeholder: '2015', type: 'number'),
          VendorField(name: 'jobTitle', label: 'Job Title', placeholder: 'Front Office Executive', type: 'text', required: true),
          VendorField(name: 'department', label: 'Department', placeholder: 'Front Office', type: 'text', required: true),
          VendorField(name: 'jobType', label: 'Job Type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract']),
          VendorField(name: 'experienceRequired', label: 'Experience Required', type: 'select', required: true, options: ['Fresher', '1-3 Years', '3-5 Years', '5+ Years']),
          VendorField(name: 'qualification', label: 'Qualification', placeholder: 'Any Degree / BHM etc.', type: 'text', required: true),
          VendorField(name: 'numberOfVacancies', label: 'Number of Vacancies', placeholder: '2', type: 'number', required: true),
          VendorField(name: 'salaryRange', label: 'Salary / Salary Range', placeholder: '20000 - 30000', type: 'text', required: true),
          VendorField(name: 'workLocation', label: 'Work Location', placeholder: 'Hyderabad', type: 'text', required: true),
          VendorField(name: 'workMode', label: 'Work Mode', type: 'select', required: true, options: ['On-site', 'Hybrid', 'Remote']),
          VendorField(name: 'shift', label: 'Shift', type: 'select', required: true, options: ['Day', 'Night', 'Rotational']),
          VendorField(name: 'jobDescription', label: 'Job Description', placeholder: 'Describe the role', type: 'textarea', required: true),
          VendorField(name: 'responsibilities', label: 'Responsibilities', placeholder: 'List key responsibilities', type: 'textarea', required: true),
          VendorField(name: 'requiredSkills', label: 'Required Skills', placeholder: 'Communication, MS Office', type: 'textarea', required: true),
          VendorField(name: 'preferredSkills', label: 'Preferred Skills', placeholder: 'Prior hotel experience', type: 'textarea'),
          VendorField(name: 'lastDateToApply', label: 'Last Date to Apply', placeholder: 'DD-MM-YYYY', type: 'text', required: true),
          VendorField(name: 'howToApply', label: 'How to Apply', type: 'select', required: true, options: ['Apply Button', 'Email', 'External Link']),
          VendorField(name: 'applicationEmail', label: 'Application Email / External Application Link', placeholder: 'hr@example.com or https://...', type: 'text', required: true),
          VendorField(name: 'contactPerson', label: 'Contact Person (optional)', placeholder: 'HR contact', type: 'text'),
          VendorField(name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', required: true),
        ],
      ),
    ],
  ),
  'beautician': const VendorFormConfig(
    id: 'beautician',
    title: 'Beautician Service Registration',
    subtitle: 'Add your services, individual prices, duration and availability.',
    sections: [
      VendorFormSection(
        title: 'Beautician',
        fields: [
          VendorField(name: 'beauticianName', label: 'Beautician Name', placeholder: 'Ananya', type: 'text', required: true),
          VendorField(name: 'shopName', label: 'Beautician shop Name', placeholder: 'Glow Studio', type: 'text'),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'serviceFor', label: 'Service For', type: 'select', required: true, options: ['Gents', 'Women', 'Kids', 'All']),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Makeup', 'Hair', 'Facial', 'Mehndi']),
          VendorField(name: 'specialization', label: 'Specialization', placeholder: 'Bridal makeup', type: 'text'),
          VendorField(name: 'price', label: 'Price', placeholder: '799', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Service', 'Per Day']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'painting': const VendorFormConfig(
    id: 'painting',
    title: 'Painting Service Registration',
    subtitle: 'Complete your painting service profile in a few simple steps.',
    sections: [
      VendorFormSection(
        title: 'Painting',
        fields: [
          VendorField(name: 'shopName', label: 'Shop / Service Name', placeholder: 'ColorWorks', type: 'text'),
          VendorField(name: 'painterName', label: 'Painter Name', placeholder: 'Naresh', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'paintingType', label: 'Painting Type', type: 'select', required: true, options: ['Interior', 'Exterior', 'Commercial', 'All type']),
          VendorField(name: 'workType', label: 'Work Type', type: 'select', required: true, options: ['Wall', 'Ceiling', 'Full House', 'Office', 'All type']),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['New Painting', 'Repainting', 'Touch-up', 'All type']),
          VendorField(name: 'price', label: 'Price', placeholder: '12', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Sq.Ft', 'Per Day', 'Per Work']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'carpenter': const VendorFormConfig(
    id: 'carpenter',
    title: 'Carpenter / Woodwork Registration',
    subtitle: 'Complete your carpentry service profile in a few simple steps.',
    sections: [
      VendorFormSection(
        title: 'Carpenter',
        fields: [
          VendorField(name: 'shopName', label: 'Shop / Service Name', placeholder: 'WoodRight', type: 'text'),
          VendorField(name: 'carpenterName', label: 'Carpenter Name', placeholder: 'Ravi', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'workType', label: 'Work Type', type: 'select', required: true, options: ['Furniture', 'Door', 'Window', 'Modular Kitchen', 'Interior', 'Repair', 'All type']),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['New Work', 'Repair', 'Installation', 'Modification', 'All type']),
          VendorField(name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Plywood', 'MDF', 'PVC', 'All type']),
          VendorField(name: 'price', label: 'Price', placeholder: '499', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Work', 'Per Day', 'Per Hour']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'appliance': const VendorFormConfig(
    id: 'appliance',
    title: 'Appliance Repair Service Registration',
    subtitle: 'Complete your appliance service profile in a few simple steps.',
    sections: [
      VendorFormSection(
        title: 'Appliance Repair',
        fields: [
          VendorField(name: 'shopName', label: 'Shop / Service Name', placeholder: 'FixIt Home', type: 'text'),
          VendorField(name: 'technicianName', label: 'Technician Name', placeholder: 'Kiran', type: 'text', required: true),
          VendorField(name: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', required: true),
          VendorField(name: 'applianceType', label: 'Appliance Type', type: 'select', required: true, options: ['TV', 'Fridge', 'Washing Machine', 'Microwave', 'Cooler', 'Other']),
          VendorField(name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Repair', 'Installation', 'Maintenance', 'Cleaning', 'All type']),
          VendorField(name: 'brand', label: 'Brand', placeholder: 'Samsung / LG / Whirlpool', type: 'text'),
          VendorField(name: 'price', label: 'Price', placeholder: '499', type: 'number', required: true),
          VendorField(name: 'priceUnit', label: 'Price unit', type: 'select', required: true, options: ['Per Visit', 'Per Service']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'public-transport': const VendorFormConfig(
    id: 'public-transport',
    title: 'Public Transport',
    subtitle: 'These stay on your listing. Customers see them after admin accepts.',
    sections: [
      VendorFormSection(
        title: 'Service details',
        fields: [
          VendorField(name: 'operatorName', label: 'Operator / service name', placeholder: 'City Auto Hub', type: 'text', required: true),
          VendorField(name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', required: true),
          VendorField(name: 'vehicleType', label: 'Vehicle type', type: 'select', required: true, options: ['Auto', 'Share cab', 'Mini bus', 'Bus', 'Tempo']),
          VendorField(name: 'routeType', label: 'Route type', type: 'select', required: true, options: ['City', 'Intercity', 'Airport', 'All']),
          VendorField(name: 'seats', label: 'Seats', placeholder: '4', type: 'number'),
          VendorField(name: 'price', label: 'Price', placeholder: '199', type: 'price', required: true, options: ['Per Seat', 'Per Trip', 'Per Day']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'goods-transport': const VendorFormConfig(
    id: 'goods-transport',
    title: 'Goods Transport',
    subtitle: 'These stay on your listing. Customers see them after admin accepts.',
    sections: [
      VendorFormSection(
        title: 'Service details',
        fields: [
          VendorField(name: 'operatorName', label: 'Operator / service name', placeholder: 'Hyd Freight', type: 'text', required: true),
          VendorField(name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', required: true),
          VendorField(name: 'vehicleType', label: 'Vehicle type', type: 'select', required: true, options: ['Mini truck', 'Pickup', 'Tempo', 'Lorry', 'Container']),
          VendorField(name: 'loadType', label: 'Load type', type: 'select', required: true, options: ['Household', 'Commercial', 'All']),
          VendorField(name: 'capacity', label: 'Capacity', placeholder: '1.5 ton / 8 ft', type: 'text'),
          VendorField(name: 'price', label: 'Price', placeholder: '499', type: 'price', required: true, options: ['Per KM', 'Per Trip', 'Per Day']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'packers-movers': const VendorFormConfig(
    id: 'packers-movers',
    title: 'Packers & Movers',
    subtitle: 'These stay on your listing. Customers see them after admin accepts.',
    sections: [
      VendorFormSection(
        title: 'Service details',
        fields: [
          VendorField(name: 'companyName', label: 'Company name', placeholder: 'SafeShift Hyd', type: 'text', required: true),
          VendorField(name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', required: true),
          VendorField(name: 'moveType', label: 'Move type', type: 'select', required: true, options: ['Local', 'Domestic', 'Office', 'Vehicle', 'All']),
          VendorField(name: 'serviceType', label: 'Service type', type: 'select', required: true, options: ['Packing', 'Moving', 'Packing & Moving', 'Storage']),
          VendorField(name: 'price', label: 'Price', placeholder: '2999', type: 'price', required: true, options: ['Per Service', 'Per KM', 'Per Shift']),
          VendorField(name: 'entryPrice', label: 'Entry Price', placeholder: 'Optional', type: 'number'),
        ],
      ),
    ],
  ),
  'cloud-kitchen': const VendorFormConfig(
    id: 'cloud-kitchen',
    title: 'Cloud Kitchen',
    subtitle: '',
    sections: [],
  ),
};

VendorFormConfig? vendorFormById(String id) => vendorForms[id];
