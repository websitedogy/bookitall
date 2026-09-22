const plumberServices = [
  'Leakage Repair',
  'Tap Repair / Replacement',
  'Pipe Repair',
  'Bathroom Plumbing',
  'Kitchen Plumbing',
  'Drainage / Blockage',
  'Water Tank Work',
  'Motor / Pump Work',
  'New Installation',
  'Repair & Maintenance',
];

const hourlyCharges = ['₹149', '₹199', '₹249', '₹299', '₹399', '₹499', '₹699', '₹999'];

const fullDayCharges = ['Not Available', '₹999', '₹1,499', '₹1,999', '₹2,499', '₹2,999'];

const teamSizes = ['1 Person', '2 Persons', '3 Persons', '4+ Persons'];

const cleaningServices = [
  'Regular Home Cleaning',
  'Deep Cleaning',
  'Kitchen Cleaning',
  'Bathroom Cleaning',
  'Sofa Cleaning',
  'Carpet Cleaning',
  'Move-in / Move-out',
  'Office Cleaning',
  'Commercial Cleaning',
  'Post-Construction Cleaning',
];

const propertyTypes = ['1 BHK', '2 BHK', '3 BHK', '4 BHK+', 'Office', 'Shop', 'Commercial'];

const startingCharges = ['₹499', '₹699', '₹999', '₹1,499', '₹1,999', '₹2,499', '₹2,999'];

const acServices = [
  'AC Installation',
  'General Service',
  'AC Repair',
  'Gas Filling / Charging',
  'Water Leakage',
  'Cooling Issue',
  'Electrical Issue',
  'AC Uninstallation',
  'Annual Maintenance',
  'Other',
];

const acTypes = ['Split AC', 'Window AC', 'Inverter AC', 'Non-Inverter AC'];

const acBrands = ['LG', 'Samsung', 'Daikin', 'Voltas', 'Blue Star', 'Panasonic', 'Carrier', 'All Brands'];

const electricianServices = [
  'House Wiring',
  'Fan Installation / Repair',
  'Light Installation / Repair',
  'Switch / Socket',
  'MCB / Fuse',
  'Inverter Wiring',
  'Motor Work',
  'New Installation',
  'Repair & Maintenance',
  'Other',
];

const customerTypes = ['Home', 'Shop', 'Office', 'Commercial'];

const experienceOptions = ['0-1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'];

const visitCharges = ['₹99', '₹149', '₹199', '₹249', '₹299', '₹399', '₹499', '₹699', '₹999'];

const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const availableTimes = ['Morning', 'Afternoon', 'Evening', 'Full day', '24 hours'];

class ElectricianDistrict {
  const ElectricianDistrict(this.name, this.state, this.mandals);
  final String name;
  final String state;
  final List<String> mandals;
}

const electricianDistricts = <ElectricianDistrict>[
  ElectricianDistrict('Hyderabad', 'Telangana', ['Amberpet', 'Asifnagar', 'Bahadurpura', 'Bandlaguda', 'Charminar', 'Golconda', 'Himayathnagar', 'Khairatabad', 'Musheerabad', 'Nampally', 'Saidabad', 'Secunderabad', 'Shaikpet']),
  ElectricianDistrict('Rangareddy', 'Telangana', ['Abdullapurmet', 'Chevella', 'Gandipet', 'Hayathnagar', 'Ibrahimpatnam', 'Kandukur', 'Maheshwaram', 'Rajendranagar', 'Shamshabad', 'Serilingampally', 'Tandur']),
  ElectricianDistrict('Medchal-Malkajgiri', 'Telangana', ['Alwal', 'Bachupally', 'Ghatkesar', 'Kapra', 'Keesara', 'Kukatpally', 'Medchal', 'Malkajgiri', 'Quthbullapur', 'Uppal']),
  ElectricianDistrict('Khammam', 'Telangana', ['Khammam Urban', 'Khammam Rural', 'Kusumanchi', 'Nelakondapalli', 'Mudigonda', 'Chinthakani', 'Sathupalli', 'Wyra', 'Enkuru', 'Konijerla', 'Tirumalayapalem', 'Raghunathapalem']),
  ElectricianDistrict('Bhadradri Kothagudem', 'Telangana', ['Kothagudem', 'Palwancha', 'Yellandu', 'Bhadrachalam', 'Manuguru', 'Aswaraopeta', 'Chandrugonda']),
  ElectricianDistrict('Warangal', 'Telangana', ['Warangal', 'Khila Warangal', 'Geesugonda', 'Sangem', 'Wardhannapet', 'Parvathagiri']),
  ElectricianDistrict('Hanumakonda', 'Telangana', ['Hanamkonda', 'Kazipet', 'Hasanparthy', 'Dharmasagar', 'Elkathurthy', 'Inavole']),
  ElectricianDistrict('Nalgonda', 'Telangana', ['Nalgonda', 'Miryalaguda', 'Devarakonda', 'Nakrekal', 'Chityal', 'Nidamanur', 'Kanagal']),
  ElectricianDistrict('Suryapet', 'Telangana', ['Suryapet', 'Kodad', 'Huzurnagar', 'Thirumalagiri', 'Neredcherla', 'Penpahad']),
  ElectricianDistrict('Yadadri Bhuvanagiri', 'Telangana', ['Bhongir', 'Choutuppal', 'Alair', 'Mothkur', 'Valigonda', 'Pochampally', 'Yadagirigutta']),
  ElectricianDistrict('Karimnagar', 'Telangana', ['Karimnagar', 'Choppadandi', 'Huzurabad', 'Jammikunta', 'Manakondur', 'Timmapur']),
  ElectricianDistrict('Peddapalli', 'Telangana', ['Peddapalli', 'Ramagundam', 'Manthani', 'Sultanabad', 'Dharmaram']),
  ElectricianDistrict('Jagtial', 'Telangana', ['Jagtial', 'Dharmapuri', 'Metpally', 'Korutla', 'Mallial']),
  ElectricianDistrict('Rajanna Sircilla', 'Telangana', ['Sircilla', 'Vemulawada', 'Yellareddipet', 'Mustabad', 'Konaraopet']),
  ElectricianDistrict('Nizamabad', 'Telangana', ['Nizamabad North', 'Nizamabad South', 'Armoor', 'Bodhan', 'Bheemgal', 'Dichpally']),
  ElectricianDistrict('Kamareddy', 'Telangana', ['Kamareddy', 'Banswada', 'Yellareddy', 'Bhiknoor', 'Domakonda']),
  ElectricianDistrict('Medak', 'Telangana', ['Medak', 'Narsapur', 'Toopran', 'Ramayampet', 'Shankarampet']),
  ElectricianDistrict('Sangareddy', 'Telangana', ['Sangareddy', 'Patancheru', 'Zahirabad', 'Narayankhed', 'Andole']),
  ElectricianDistrict('Siddipet', 'Telangana', ['Siddipet Urban', 'Siddipet Rural', 'Gajwel', 'Dubbak', 'Husnabad', 'Cherial']),
  ElectricianDistrict('Mahabubnagar', 'Telangana', ['Mahabubnagar', 'Jadcherla', 'Bhoothpur', 'Koilkonda', 'Hanwada']),
  ElectricianDistrict('Nagarkurnool', 'Telangana', ['Nagarkurnool', 'Achampet', 'Kalwakurthy', 'Kollapur', 'Telkapally']),
  ElectricianDistrict('Wanaparthy', 'Telangana', ['Wanaparthy', 'Kothakota', 'Pebbair', 'Atmakur', 'Ghanpur']),
  ElectricianDistrict('Jogulamba Gadwal', 'Telangana', ['Gadwal', 'Alampur', 'Ieeja', 'Waddepalle', 'Itikyal']),
  ElectricianDistrict('Narayanpet', 'Telangana', ['Narayanpet', 'Makthal', 'Kosgi', 'Maddur', 'Dhanwada']),
  ElectricianDistrict('Vikarabad', 'Telangana', ['Vikarabad', 'Tandur', 'Pargi', 'Marpally', 'Kodangal']),
  ElectricianDistrict('Mahabubabad', 'Telangana', ['Mahabubabad', 'Thorrur', 'Maripeda', 'Dornakal', 'Kesamudram']),
  ElectricianDistrict('Jangaon', 'Telangana', ['Jangaon', 'Ghanpur Station', 'Palakurthi', 'Raghunathpally', 'Zaffergadh']),
  ElectricianDistrict('Jayashankar Bhupalpally', 'Telangana', ['Bhupalpally', 'Mulugu', 'Eturnagaram', 'Govindaraopet', 'Kataram']),
  ElectricianDistrict('Mulugu', 'Telangana', ['Mulugu', 'Eturnagaram', 'Tadvai', 'Govindaraopet', 'Venkatapur']),
  ElectricianDistrict('Mancherial', 'Telangana', ['Mancherial', 'Bellampalli', 'Luxettipet', 'Jaipur', 'Naspur']),
  ElectricianDistrict('Nirmal', 'Telangana', ['Nirmal', 'Bhainsa', 'Khanapur', 'Dilawarpur', 'Laxmanchanda']),
  ElectricianDistrict('Adilabad', 'Telangana', ['Adilabad Urban', 'Adilabad Rural', 'Jainad', 'Bela', 'Talamadugu']),
  ElectricianDistrict('Kumuram Bheem', 'Telangana', ['Asifabad', 'Kagaznagar', 'Sirpur', 'Rebbena', 'Kerameri']),
  ElectricianDistrict('Visakhapatnam', 'Andhra Pradesh', ['Visakhapatnam Urban', 'Gajuwaka', 'Anandapuram', 'Bheemunipatnam', 'Pendurthi', 'Padmanabham']),
  ElectricianDistrict('Anakapalli', 'Andhra Pradesh', ['Anakapalli', 'Elamanchili', 'Kasimkota', 'Parawada', 'Sabbavaram', 'Chodavaram']),
  ElectricianDistrict('Kakinada', 'Andhra Pradesh', ['Kakinada Urban', 'Kakinada Rural', 'Samalkota', 'Peddapuram', 'Pithapuram', 'Karapa']),
  ElectricianDistrict('East Godavari', 'Andhra Pradesh', ['Rajahmundry Urban', 'Rajahmundry Rural', 'Korukonda', 'Rajanagaram', 'Seethanagaram']),
  ElectricianDistrict('Dr. B.R. Ambedkar Konaseema', 'Andhra Pradesh', ['Amalapuram', 'Razole', 'Kothapeta', 'Mummidivaram', 'Ravulapalem']),
  ElectricianDistrict('West Godavari', 'Andhra Pradesh', ['Bhimavaram', 'Tadepalligudem', 'Tanuku', 'Narsapuram', 'Palakollu', 'Undi']),
  ElectricianDistrict('Eluru', 'Andhra Pradesh', ['Eluru', 'Denduluru', 'Pedapadu', 'Nidamarru', 'Bhimadole']),
  ElectricianDistrict('Krishna', 'Andhra Pradesh', ['Machilipatnam', 'Gudivada', 'Pedana', 'Movva', 'Ghantasala']),
  ElectricianDistrict('NTR', 'Andhra Pradesh', ['Vijayawada Urban', 'Vijayawada Rural', 'Gannavaram', 'Ibrahimpatnam', 'Mylavaram']),
  ElectricianDistrict('Guntur', 'Andhra Pradesh', ['Guntur East', 'Guntur West', 'Prathipadu', 'Tadepalli', 'Mangalagiri', 'Pedakakani']),
  ElectricianDistrict('Palnadu', 'Andhra Pradesh', ['Narasaraopet', 'Chilakaluripet', 'Sattenapalle', 'Macherla', 'Piduguralla']),
  ElectricianDistrict('Bapatla', 'Andhra Pradesh', ['Bapatla', 'Chirala', 'Parchur', 'Repalle', 'Addanki']),
  ElectricianDistrict('Prakasam', 'Andhra Pradesh', ['Ongole', 'Kandukur', 'Markapur', 'Kanigiri']),
  ElectricianDistrict('Nellore', 'Andhra Pradesh', ['Nellore Urban', 'Nellore Rural', 'Kovur', 'Buchireddypalem', 'Indukurpeta']),
  ElectricianDistrict('Tirupati', 'Andhra Pradesh', ['Tirupati Urban', 'Tirupati Rural', 'Renigunta', 'Chandragiri', 'Srikalahasti']),
  ElectricianDistrict('Chittoor', 'Andhra Pradesh', ['Chittoor', 'Palamaner', 'Punganur', 'Nagari', 'Puttur']),
  ElectricianDistrict('Annamayya', 'Andhra Pradesh', ['Rayachoti', 'Madanapalle', 'Rajampet', 'Kodur', 'Pileru']),
  ElectricianDistrict('YSR Kadapa', 'Andhra Pradesh', ['Kadapa', 'Proddatur', 'Pulivendula', 'Jammalamadugu', 'Mydukur']),
  ElectricianDistrict('Anantapur', 'Andhra Pradesh', ['Anantapur', 'Dharmavaram', 'Guntakal', 'Tadipatri', 'Kadiri']),
  ElectricianDistrict('Sri Sathya Sai', 'Andhra Pradesh', ['Puttaparthi', 'Penukonda', 'Hindupur', 'Madakasira']),
  ElectricianDistrict('Kurnool', 'Andhra Pradesh', ['Kurnool', 'Adoni', 'Nandikotkur', 'Yemmiganur', 'Kodumur']),
  ElectricianDistrict('Nandyal', 'Andhra Pradesh', ['Nandyal', 'Allagadda', 'Atmakur', 'Dhone', 'Banaganapalle']),
  ElectricianDistrict('Srikakulam', 'Andhra Pradesh', ['Srikakulam', 'Palasa', 'Tekkali', 'Amadalavalasa', 'Narasannapeta']),
  ElectricianDistrict('Vizianagaram', 'Andhra Pradesh', ['Vizianagaram', 'Bobbili', 'Salur', 'Cheepurupalli', 'Nellimarla']),
  ElectricianDistrict('Parvathipuram Manyam', 'Andhra Pradesh', ['Parvathipuram', 'Palakonda', 'Kurupam', 'Seethampeta', 'Makkuva']),
  ElectricianDistrict('Alluri Sitharama Raju', 'Andhra Pradesh', ['Paderu', 'Chintapalle', 'Araku Valley', 'Rampachodavaram', 'Maredumilli']),
];

int visitChargeAmount(String label) {
  final digits = label.replaceAll(RegExp(r'[^\d]'), '');
  return int.tryParse(digits) ?? 0;
}

ElectricianDistrict? matchDistrict(String city, [String state = '']) {
  final q = city.trim().toLowerCase();
  final stateQ = state.trim().toLowerCase();
  for (final district in electricianDistricts) {
    if (district.name.toLowerCase() == q && (stateQ.isEmpty || district.state.toLowerCase() == stateQ)) {
      return district;
    }
  }
  for (final district in electricianDistricts) {
    if (district.name.toLowerCase().contains(q) || q.contains(district.name.toLowerCase())) {
      return district;
    }
  }
  return null;
}
