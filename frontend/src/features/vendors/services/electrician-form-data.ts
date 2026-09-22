export const ELECTRICIAN_SERVICES = [
  "House Wiring",
  "Fan Installation / Repair",
  "Light Installation / Repair",
  "Switch / Socket",
  "MCB / Fuse",
  "Inverter Wiring",
  "Motor Work",
  "New Installation",
  "Repair & Maintenance",
  "Other",
] as const;

export const PLUMBER_SERVICES = [
  "Leakage Repair",
  "Tap Repair / Replacement",
  "Pipe Repair",
  "Bathroom Plumbing",
  "Kitchen Plumbing",
  "Drainage / Blockage",
  "Water Tank Work",
  "Motor / Pump Work",
  "New Installation",
  "Repair & Maintenance",
] as const;

export const HOURLY_CHARGES = ["₹149", "₹199", "₹249", "₹299", "₹399", "₹499", "₹699", "₹999"] as const;

export const FULL_DAY_CHARGES = ["Not Available", "₹999", "₹1,499", "₹1,999", "₹2,499", "₹2,999"] as const;

export const TEAM_SIZES = ["1 Person", "2 Persons", "3 Persons", "4+ Persons"] as const;

export const CLEANING_SERVICES = [
  "Regular Home Cleaning",
  "Deep Cleaning",
  "Kitchen Cleaning",
  "Bathroom Cleaning",
  "Sofa Cleaning",
  "Carpet Cleaning",
  "Move-in / Move-out",
  "Office Cleaning",
  "Commercial Cleaning",
  "Post-Construction Cleaning",
] as const;

export const PROPERTY_TYPES = ["1 BHK", "2 BHK", "3 BHK", "4 BHK+", "Office", "Shop", "Commercial"] as const;

export const STARTING_CHARGES = ["₹499", "₹699", "₹999", "₹1,499", "₹1,999", "₹2,499", "₹2,999"] as const;

export const AC_SERVICES = [
  "AC Installation",
  "General Service",
  "AC Repair",
  "Gas Filling / Charging",
  "Water Leakage",
  "Cooling Issue",
  "Electrical Issue",
  "AC Uninstallation",
  "Annual Maintenance",
  "Other",
] as const;

export const AC_TYPES = ["Split AC", "Window AC", "Inverter AC", "Non-Inverter AC"] as const;

export const AC_BRANDS = ["LG", "Samsung", "Daikin", "Voltas", "Blue Star", "Panasonic", "Carrier", "All Brands"] as const;

export const CUSTOMER_TYPES = ["Home", "Shop", "Office", "Commercial"] as const;

export const EXPERIENCE_OPTIONS = ["0-1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"] as const;

export const VISIT_CHARGES = ["₹99", "₹149", "₹199", "₹249", "₹299", "₹399", "₹499", "₹699", "₹999"] as const;

export const AVAILABLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const AVAILABLE_TIMES = ["Morning", "Afternoon", "Evening", "Full day", "24 hours"] as const;

export const EMERGENCY_OPTIONS = ["Yes", "No"] as const;

export type CoverageType = "Entire District" | "Selected Mandals";

export type DistrictInfo = { name: string; state: string; mandals: string[] };

export const ELECTRICIAN_DISTRICTS: DistrictInfo[] = [
  { name: "Hyderabad", state: "Telangana", mandals: ["Amberpet", "Asifnagar", "Bahadurpura", "Bandlaguda", "Charminar", "Golconda", "Himayathnagar", "Khairatabad", "Musheerabad", "Nampally", "Saidabad", "Secunderabad", "Shaikpet"] },
  { name: "Rangareddy", state: "Telangana", mandals: ["Abdullapurmet", "Chevella", "Gandipet", "Hayathnagar", "Ibrahimpatnam", "Kandukur", "Maheshwaram", "Rajendranagar", "Shamshabad", "Serilingampally", "Tandur"] },
  { name: "Medchal-Malkajgiri", state: "Telangana", mandals: ["Alwal", "Bachupally", "Ghatkesar", "Kapra", "Keesara", "Kukatpally", "Medchal", "Malkajgiri", "Quthbullapur", "Uppal"] },
  { name: "Khammam", state: "Telangana", mandals: ["Khammam Urban", "Khammam Rural", "Kusumanchi", "Nelakondapalli", "Mudigonda", "Chinthakani", "Sathupalli", "Wyra", "Enkuru", "Konijerla", "Tirumalayapalem", "Raghunathapalem"] },
  { name: "Bhadradri Kothagudem", state: "Telangana", mandals: ["Kothagudem", "Palwancha", "Yellandu", "Bhadrachalam", "Manuguru", "Aswaraopeta", "Chandrugonda"] },
  { name: "Warangal", state: "Telangana", mandals: ["Warangal", "Khila Warangal", "Geesugonda", "Sangem", "Wardhannapet", "Parvathagiri"] },
  { name: "Hanumakonda", state: "Telangana", mandals: ["Hanamkonda", "Kazipet", "Hasanparthy", "Dharmasagar", "Elkathurthy", "Inavole"] },
  { name: "Nalgonda", state: "Telangana", mandals: ["Nalgonda", "Miryalaguda", "Devarakonda", "Nakrekal", "Chityal", "Nidamanur", "Kanagal"] },
  { name: "Suryapet", state: "Telangana", mandals: ["Suryapet", "Kodad", "Huzurnagar", "Thirumalagiri", "Neredcherla", "Penpahad"] },
  { name: "Yadadri Bhuvanagiri", state: "Telangana", mandals: ["Bhongir", "Choutuppal", "Alair", "Mothkur", "Valigonda", "Pochampally", "Yadagirigutta"] },
  { name: "Karimnagar", state: "Telangana", mandals: ["Karimnagar", "Choppadandi", "Huzurabad", "Jammikunta", "Manakondur", "Timmapur"] },
  { name: "Peddapalli", state: "Telangana", mandals: ["Peddapalli", "Ramagundam", "Manthani", "Sultanabad", "Dharmaram"] },
  { name: "Jagtial", state: "Telangana", mandals: ["Jagtial", "Dharmapuri", "Metpally", "Korutla", "Mallial"] },
  { name: "Rajanna Sircilla", state: "Telangana", mandals: ["Sircilla", "Vemulawada", "Yellareddipet", "Mustabad", "Konaraopet"] },
  { name: "Nizamabad", state: "Telangana", mandals: ["Nizamabad North", "Nizamabad South", "Armoor", "Bodhan", "Bheemgal", "Dichpally"] },
  { name: "Kamareddy", state: "Telangana", mandals: ["Kamareddy", "Banswada", "Yellareddy", "Bhiknoor", "Domakonda"] },
  { name: "Medak", state: "Telangana", mandals: ["Medak", "Narsapur", "Toopran", "Ramayampet", "Shankarampet"] },
  { name: "Sangareddy", state: "Telangana", mandals: ["Sangareddy", "Patancheru", "Ameerpet", "Zahirabad", "Narayankhed", "Andole"] },
  { name: "Siddipet", state: "Telangana", mandals: ["Siddipet Urban", "Siddipet Rural", "Gajwel", "Dubbak", "Husnabad", "Cherial"] },
  { name: "Mahabubnagar", state: "Telangana", mandals: ["Mahabubnagar", "Jadcherla", "Bhoothpur", "Koilkonda", "Hanwada"] },
  { name: "Nagarkurnool", state: "Telangana", mandals: ["Nagarkurnool", "Achampet", "Kalwakurthy", "Kollapur", "Telkapally"] },
  { name: "Wanaparthy", state: "Telangana", mandals: ["Wanaparthy", "Kothakota", "Pebbair", "Atmakur", "Ghanpur"] },
  { name: "Jogulamba Gadwal", state: "Telangana", mandals: ["Gadwal", "Alampur", "Ieeja", "Waddepalle", "Itikyal"] },
  { name: "Narayanpet", state: "Telangana", mandals: ["Narayanpet", "Makthal", "Kosgi", "Maddur", "Dhanwada"] },
  { name: "Vikarabad", state: "Telangana", mandals: ["Vikarabad", "Tandur", "Pargi", "Marpally", "Kodangal"] },
  { name: "Mahabubabad", state: "Telangana", mandals: ["Mahabubabad", "Thorrur", "Maripeda", "Dornakal", "Kesamudram"] },
  { name: "Jangaon", state: "Telangana", mandals: ["Jangaon", "Ghanpur Station", "Palakurthi", "Raghunathpally", "Zaffergadh"] },
  { name: "Jayashankar Bhupalpally", state: "Telangana", mandals: ["Bhupalpally", "Mulugu", "Eturnagaram", "Govindaraopet", "Kataram"] },
  { name: "Mulugu", state: "Telangana", mandals: ["Mulugu", "Eturnagaram", "Tadvai", "Govindaraopet", "Venkatapur"] },
  { name: "Mancherial", state: "Telangana", mandals: ["Mancherial", "Bellampalli", "Luxettipet", "Jaipur", "Naspur"] },
  { name: "Nirmal", state: "Telangana", mandals: ["Nirmal", "Bhainsa", "Khanapur", "Dilawarpur", "Laxmanchanda"] },
  { name: "Adilabad", state: "Telangana", mandals: ["Adilabad Urban", "Adilabad Rural", "Jainad", "Bela", "Talamadugu"] },
  { name: "Kumuram Bheem", state: "Telangana", mandals: ["Asifabad", "Kagaznagar", "Sirpur", "Rebbena", "Kerameri"] },
  { name: "Visakhapatnam", state: "Andhra Pradesh", mandals: ["Visakhapatnam Urban", "Gajuwaka", "Anandapuram", "Bheemunipatnam", "Pendurthi", "Padmanabham"] },
  { name: "Anakapalli", state: "Andhra Pradesh", mandals: ["Anakapalli", "Elamanchili", "Kasimkota", "Parawada", "Sabbavaram", "Chodavaram"] },
  { name: "Kakinada", state: "Andhra Pradesh", mandals: ["Kakinada Urban", "Kakinada Rural", "Samalkota", "Peddapuram", "Pithapuram", "Karapa"] },
  { name: "East Godavari", state: "Andhra Pradesh", mandals: ["Rajahmundry Urban", "Rajahmundry Rural", "Korukonda", "Rajanagaram", "Seethanagaram"] },
  { name: "Dr. B.R. Ambedkar Konaseema", state: "Andhra Pradesh", mandals: ["Amalapuram", "Razole", "Kothapeta", "Mummidivaram", "Ravulapalem"] },
  { name: "West Godavari", state: "Andhra Pradesh", mandals: ["Bhimavaram", "Tadepalligudem", "Tanuku", "Narsapuram", "Palakollu", "Undi"] },
  { name: "Eluru", state: "Andhra Pradesh", mandals: ["Eluru", "Denduluru", "Pedapadu", "Nidamarru", "Bhimadole"] },
  { name: "Krishna", state: "Andhra Pradesh", mandals: ["Machilipatnam", "Gudivada", "Pedana", "Movva", "Ghantasala"] },
  { name: "NTR", state: "Andhra Pradesh", mandals: ["Vijayawada Urban", "Vijayawada Rural", "Gannavaram", "Ibrahimpatnam", "Mylavaram"] },
  { name: "Guntur", state: "Andhra Pradesh", mandals: ["Guntur East", "Guntur West", "Prathipadu", "Tadepalli", "Mangalagiri", "Pedakakani"] },
  { name: "Palnadu", state: "Andhra Pradesh", mandals: ["Narasaraopet", "Chilakaluripet", "Sattenapalle", "Macherla", "Piduguralla"] },
  { name: "Bapatla", state: "Andhra Pradesh", mandals: ["Bapatla", "Chirala", "Parchur", "Repalle", "Addanki"] },
  { name: "Prakasam", state: "Andhra Pradesh", mandals: ["Ongole", "Chirala", "Kandukur", "Markapur", "Kanigiri"] },
  { name: "Nellore", state: "Andhra Pradesh", mandals: ["Nellore Urban", "Nellore Rural", "Kovur", "Buchireddypalem", "Indukurpeta"] },
  { name: "Tirupati", state: "Andhra Pradesh", mandals: ["Tirupati Urban", "Tirupati Rural", "Renigunta", "Chandragiri", "Srikalahasti"] },
  { name: "Chittoor", state: "Andhra Pradesh", mandals: ["Chittoor", "Palamaner", "Punganur", "Nagari", "Puttur"] },
  { name: "Annamayya", state: "Andhra Pradesh", mandals: ["Rayachoti", "Madanapalle", "Rajampet", "Kodur", "Pileru"] },
  { name: "YSR Kadapa", state: "Andhra Pradesh", mandals: ["Kadapa", "Proddatur", "Pulivendula", "Jammalamadugu", "Mydukur"] },
  { name: "Anantapur", state: "Andhra Pradesh", mandals: ["Anantapur", "Dharmavaram", "Guntakal", "Tadipatri", "Kadiri"] },
  { name: "Sri Sathya Sai", state: "Andhra Pradesh", mandals: ["Puttaparthi", "Dharmavaram", "Penukonda", "Hindupur", "Madakasira"] },
  { name: "Kurnool", state: "Andhra Pradesh", mandals: ["Kurnool", "Adoni", "Nandikotkur", "Yemmiganur", "Kodumur"] },
  { name: "Nandyal", state: "Andhra Pradesh", mandals: ["Nandyal", "Allagadda", "Atmakur", "Dhone", "Banaganapalle"] },
  { name: "Srikakulam", state: "Andhra Pradesh", mandals: ["Srikakulam", "Palasa", "Tekkali", "Amadalavalasa", "Narasannapeta"] },
  { name: "Vizianagaram", state: "Andhra Pradesh", mandals: ["Vizianagaram", "Bobbili", "Salur", "Cheepurupalli", "Nellimarla"] },
  { name: "Parvathipuram Manyam", state: "Andhra Pradesh", mandals: ["Parvathipuram", "Palakonda", "Kurupam", "Seethampeta", "Makkuva"] },
  { name: "Alluri Sitharama Raju", state: "Andhra Pradesh", mandals: ["Paderu", "Chintapalle", "Araku Valley", "Rampachodavaram", "Maredumilli"] },
];

export function visitChargeAmount(label: string) {
  const n = Number(label.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function matchDistrict(city: string, state = "") {
  const q = city.trim().toLowerCase();
  const stateQ = state.trim().toLowerCase();
  return (
    ELECTRICIAN_DISTRICTS.find((d) => d.name.toLowerCase() === q && (!stateQ || d.state.toLowerCase() === stateQ)) ||
    ELECTRICIAN_DISTRICTS.find((d) => d.name.toLowerCase().includes(q) || q.includes(d.name.toLowerCase())) ||
    null
  );
}
