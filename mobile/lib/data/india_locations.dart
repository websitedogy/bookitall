class PlaceChoice {
  const PlaceChoice({
    required this.label,
    required this.area,
    required this.city,
    required this.state,
    this.latitude,
    this.longitude,
  });

  final String label;
  final String area;
  final String city;
  final String state;
  final double? latitude;
  final double? longitude;

  String get full {
    final parts = [if (area.isNotEmpty && area != city) area, city, state];
    return parts.where((part) => part.isNotEmpty).join(', ');
  }
}

const indianStates = [
  'Andaman & Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra & Nagar Haveli',
  'Daman & Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const citiesByState = <String, List<String>>{
  'Andaman & Nicobar Islands': ['Port Blair', 'Havelock'],
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Rajahmundry',
    'Kakinada',
    'Tirupati',
    'Nellore',
    'Kurnool',
    'Anantapur',
    'Ongole',
  ],
  'Arunachal Pradesh': ['Itanagar', 'Tawang'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
  'Dadra & Nagar Haveli': ['Silvassa'],
  'Daman & Diu': ['Daman', 'Diu'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Mizoram': ['Aizawl'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Puri'],
  'Puducherry': ['Puducherry'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Chandigarh', 'Jalandhar'],
  'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'],
  'Sikkim': ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  'Telangana': [
    'Hyderabad',
    'Khammam',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Nalgonda',
    'Mahbubnagar',
    'Ramagundam',
  ],
  'Tripura': ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Varanasi', 'Agra', 'Prayagraj'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
};

List<PlaceChoice> searchPlaces(String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return const [];
  final matches = <PlaceChoice>[];
  for (final entry in citiesByState.entries) {
    for (final city in entry.value) {
      final hay = '${city.toLowerCase()} ${entry.key.toLowerCase()}';
      if (hay.contains(q)) {
        matches.add(PlaceChoice(
          label: city,
          area: city,
          city: city,
          state: entry.key,
          latitude: coordsFor(city, entry.key)?.$1,
          longitude: coordsFor(city, entry.key)?.$2,
        ));
      }
    }
  }
  return matches.take(20).toList();
}

(double, double)? coordsFor(String city, [String state = '']) {
  return cityCoords[city] ?? stateCoords[state];
}

const stateCoords = <String, (double, double)>{
  'Andhra Pradesh': (16.5062, 80.6480),
  'Telangana': (17.3850, 78.4867),
  'Karnataka': (12.9716, 77.5946),
  'Tamil Nadu': (13.0827, 80.2707),
  'Kerala': (9.9312, 76.2673),
  'Maharashtra': (19.0760, 72.8777),
  'Delhi': (28.6139, 77.2090),
  'Gujarat': (23.0225, 72.5714),
  'Rajasthan': (26.9124, 75.7873),
  'West Bengal': (22.5726, 88.3639),
  'Uttar Pradesh': (26.8467, 80.9462),
  'Madhya Pradesh': (23.2599, 77.4126),
  'Bihar': (25.5941, 85.1376),
  'Odisha': (20.2961, 85.8245),
  'Punjab': (30.7333, 76.7794),
  'Haryana': (28.4595, 77.0266),
  'Assam': (26.1445, 91.7362),
  'Jharkhand': (23.3441, 85.3096),
  'Chhattisgarh': (21.2514, 81.6296),
  'Goa': (15.4909, 73.8278),
  'Himachal Pradesh': (31.1048, 77.1734),
  'Uttarakhand': (30.3165, 78.0322),
  'Jammu & Kashmir': (34.0837, 74.7973),
};

const cityCoords = <String, (double, double)>{
  'Hyderabad': (17.3850, 78.4867),
  'Rajahmundry': (16.9891, 81.7821),
  'Visakhapatnam': (17.6868, 83.2185),
  'Vijayawada': (16.5062, 80.6480),
  'Guntur': (16.3067, 80.4365),
  'Kakinada': (16.9891, 82.2475),
  'Tirupati': (13.6288, 79.4192),
  'Nellore': (14.4426, 79.9864),
  'Kurnool': (15.8281, 78.0373),
  'Warangal': (17.9689, 79.5941),
  'Khammam': (17.2473, 80.1514),
  'Nizamabad': (18.6725, 78.0941),
  'Karimnagar': (18.4386, 79.1288),
  'Bengaluru': (12.9716, 77.5946),
  'Mysuru': (12.2958, 76.6394),
  'Chennai': (13.0827, 80.2707),
  'Coimbatore': (11.0168, 76.9558),
  'Madurai': (9.9252, 78.1198),
  'Mumbai': (19.0760, 72.8777),
  'Pune': (18.5204, 73.8567),
  'Nagpur': (21.1458, 79.0882),
  'Kolkata': (22.5726, 88.3639),
  'Delhi': (28.6139, 77.2090),
  'New Delhi': (28.6139, 77.2090),
  'Ahmedabad': (23.0225, 72.5714),
  'Surat': (21.1702, 72.8311),
  'Jaipur': (26.9124, 75.7873),
  'Lucknow': (26.8467, 80.9462),
  'Kochi': (9.9312, 76.2673),
  'Thiruvananthapuram': (8.5241, 76.9366),
  'Panaji': (15.4909, 73.8278),
  'Bhopal': (23.2599, 77.4126),
  'Indore': (22.7196, 75.8577),
  'Patna': (25.5941, 85.1376),
  'Bhubaneswar': (20.2961, 85.8245),
  'Chandigarh': (30.7333, 76.7794),
  'Gurugram': (28.4595, 77.0266),
  'Noida': (28.5355, 77.3910),
  'Guwahati': (26.1445, 91.7362),
};

