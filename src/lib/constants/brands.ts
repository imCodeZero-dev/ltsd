/**
 * Popular Amazon brands — used as fallback in onboarding + settings brand dropdowns.
 * DB brands are shown first; these fill the gap for brands not yet in our deal data.
 * Sorted roughly by category for readability, deduped at merge time.
 */
export const FALLBACK_BRANDS = [
  // Electronics & Tech
  "Apple", "Samsung", "Sony", "LG", "Bose", "JBL", "Anker",
  "Logitech", "Corsair", "Razer", "HyperX", "SteelSeries",
  "Sennheiser", "Audio-Technica", "Beats", "Skullcandy", "Jabra",
  "Google", "Amazon Basics", "Ring", "Roku", "Fire TV",
  "TCL", "Hisense", "Vizio", "Panasonic", "Sharp", "Toshiba",
  "Canon", "Nikon", "GoPro", "DJI", "Fujifilm",
  "SanDisk", "Western Digital", "Seagate", "Kingston",
  "TP-Link", "Netgear", "Linksys",

  // Computers & Accessories
  "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI",
  "Intel", "AMD", "NVIDIA", "Crucial", "EVGA",
  "Microsoft", "Belkin", "Plugable", "CalDigit",
  "BenQ", "AOC", "ViewSonic", "LG UltraGear",

  // Phones & Tablets
  "Motorola", "OnePlus", "Nokia", "OtterBox", "Spigen",
  "ZAGG", "Anker Soundcore", "Baseus",

  // Home & Kitchen
  "Dyson", "iRobot", "Shark", "Ninja", "KitchenAid", "Instant Pot",
  "Cuisinart", "Breville", "Hamilton Beach", "Keurig", "Nespresso",
  "Vitamix", "Crock-Pot", "BLACK+DECKER", "Rubbermaid",
  "OXO", "Pyrex", "Lodge", "Le Creuset", "T-fal",
  "Philips Hue", "GE", "Honeywell", "Levoit", "Govee",
  "Casper", "Tempur-Pedic", "Beckham Hotel Collection",

  // Fashion & Apparel
  "Nike", "Adidas", "Puma", "Under Armour", "New Balance",
  "Levi's", "Calvin Klein", "Tommy Hilfiger", "Ralph Lauren",
  "Columbia", "The North Face", "Carhartt", "Hanes", "Fruit of the Loom",
  "Champion", "Skechers", "Crocs", "Birkenstock", "Dr. Martens",
  "Ray-Ban", "Oakley", "Fossil", "Timex", "Casio",

  // Beauty & Personal Care
  "CeraVe", "Neutrogena", "Olay", "L'Oreal", "Maybelline",
  "Revlon", "NYX", "e.l.f.", "Dove", "Nivea",
  "Philips Norelco", "Braun", "Oral-B", "Waterpik", "Crest",
  "Gillette", "Harry's", "Native", "Old Spice", "Degree",

  // Sports & Outdoors
  "Coleman", "Yeti", "Stanley", "Hydro Flask",
  "Fitbit", "Garmin", "Bowflex", "NordicTrack",
  "Wilson", "Callaway", "TaylorMade",

  // Tools & Home Improvement
  "DeWalt", "Makita", "Milwaukee", "Bosch", "Ryobi",
  "Craftsman", "Klein Tools", "Stanley", "Gorilla",
  "3M", "WD-40", "Rust-Oleum",

  // Baby & Kids
  "Pampers", "Huggies", "Graco", "Fisher-Price",
  "LEGO", "Hasbro", "Mattel", "Play-Doh", "Crayola",
  "Melissa & Doug", "VTech", "LeapFrog",

  // Automotive
  "Michelin", "Armor All", "Chemical Guys", "Meguiar's",
  "Garmin", "Scosche",

  // Pet Supplies
  "Purina", "Blue Buffalo", "KONG", "Greenies", "Furminator",

  // Grocery & Health
  "KIND", "Clif", "Optimum Nutrition", "Garden of Life",
  "Nature Made", "Centrum", "Emergen-C",

  // Office
  "Sharpie", "Post-it", "Avery", "Brother", "Epson",
];
