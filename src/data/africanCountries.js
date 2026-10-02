// Canonical list of all 54 African countries served by Nelvin.
// French names are aligned with src/data/countries.js so every country
// field, the phone dial picker, and the PSP router share one source of truth.
// "République démocratique du Congo" (CD) is intentionally included here even
// though countries.js only lists "Congo" (CG) — Nelvin serves both.

export const AFRICAN_COUNTRIES = [
  // Afrique du Nord
  { name: "Algérie", iso: "DZ", dial: "213", flag: "🇩🇿", region: "Afrique du Nord" },
  { name: "Égypte", iso: "EG", dial: "20", flag: "🇪🇬", region: "Afrique du Nord" },
  { name: "Libye", iso: "LY", dial: "218", flag: "🇱🇾", region: "Afrique du Nord" },
  { name: "Maroc", iso: "MA", dial: "212", flag: "🇲🇦", region: "Afrique du Nord" },
  { name: "Soudan", iso: "SD", dial: "249", flag: "🇸🇩", region: "Afrique du Nord" },
  { name: "Tunisie", iso: "TN", dial: "216", flag: "🇹🇳", region: "Afrique du Nord" },

  // Afrique de l'Ouest
  { name: "Bénin", iso: "BJ", dial: "229", flag: "🇧🇯", region: "Afrique de l'Ouest" },
  { name: "Burkina Faso", iso: "BF", dial: "226", flag: "🇧🇫", region: "Afrique de l'Ouest" },
  { name: "Cap-Vert", iso: "CV", dial: "238", flag: "🇨🇻", region: "Afrique de l'Ouest" },
  { name: "Côte d'Ivoire", iso: "CI", dial: "225", flag: "🇨🇮", region: "Afrique de l'Ouest" },
  { name: "Gambie", iso: "GM", dial: "220", flag: "🇬🇲", region: "Afrique de l'Ouest" },
  { name: "Ghana", iso: "GH", dial: "233", flag: "🇬🇭", region: "Afrique de l'Ouest" },
  { name: "Guinée", iso: "GN", dial: "224", flag: "🇬🇳", region: "Afrique de l'Ouest" },
  { name: "Guinée-Bissau", iso: "GW", dial: "245", flag: "🇬🇼", region: "Afrique de l'Ouest" },
  { name: "Liberia", iso: "LR", dial: "231", flag: "🇱🇷", region: "Afrique de l'Ouest" },
  { name: "Mali", iso: "ML", dial: "223", flag: "🇲🇱", region: "Afrique de l'Ouest" },
  { name: "Mauritanie", iso: "MR", dial: "222", flag: "🇲🇷", region: "Afrique de l'Ouest" },
  { name: "Niger", iso: "NE", dial: "227", flag: "🇳🇪", region: "Afrique de l'Ouest" },
  { name: "Nigeria", iso: "NG", dial: "234", flag: "🇳🇬", region: "Afrique de l'Ouest" },
  { name: "Sénégal", iso: "SN", dial: "221", flag: "🇸🇳", region: "Afrique de l'Ouest" },
  { name: "Sierra Leone", iso: "SL", dial: "232", flag: "🇸🇱", region: "Afrique de l'Ouest" },
  { name: "Togo", iso: "TG", dial: "228", flag: "🇹🇬", region: "Afrique de l'Ouest" },

  // Afrique Centrale
  { name: "Cameroun", iso: "CM", dial: "237", flag: "🇨🇲", region: "Afrique Centrale" },
  { name: "Gabon", iso: "GA", dial: "241", flag: "🇬🇦", region: "Afrique Centrale" },
  { name: "Tchad", iso: "TD", dial: "235", flag: "🇹🇩", region: "Afrique Centrale" },
  { name: "Congo", iso: "CG", dial: "242", flag: "🇨🇬", region: "Afrique Centrale" },
  { name: "République démocratique du Congo", iso: "CD", dial: "243", flag: "🇨🇩", region: "Afrique Centrale" },
  { name: "République centrafricaine", iso: "CF", dial: "236", flag: "🇨🇫", region: "Afrique Centrale" },
  { name: "Guinée équatoriale", iso: "GQ", dial: "240", flag: "🇬🇶", region: "Afrique Centrale" },
  { name: "São Tomé-et-Príncipe", iso: "ST", dial: "239", flag: "🇸🇹", region: "Afrique Centrale" },

  // Afrique de l'Est
  { name: "Burundi", iso: "BI", dial: "257", flag: "🇧🇮", region: "Afrique de l'Est" },
  { name: "Comores", iso: "KM", dial: "269", flag: "🇰🇲", region: "Afrique de l'Est" },
  { name: "Djibouti", iso: "DJ", dial: "253", flag: "🇩🇯", region: "Afrique de l'Est" },
  { name: "Érythrée", iso: "ER", dial: "291", flag: "🇪🇷", region: "Afrique de l'Est" },
  { name: "Éthiopie", iso: "ET", dial: "251", flag: "🇪🇹", region: "Afrique de l'Est" },
  { name: "Kenya", iso: "KE", dial: "254", flag: "🇰🇪", region: "Afrique de l'Est" },
  { name: "Madagascar", iso: "MG", dial: "261", flag: "🇲🇬", region: "Afrique de l'Est" },
  { name: "Malawi", iso: "MW", dial: "265", flag: "🇲🇼", region: "Afrique de l'Est" },
  { name: "Maurice", iso: "MU", dial: "230", flag: "🇲🇺", region: "Afrique de l'Est" },
  { name: "Mozambique", iso: "MZ", dial: "258", flag: "🇲🇿", region: "Afrique de l'Est" },
  { name: "Rwanda", iso: "RW", dial: "250", flag: "🇷🇼", region: "Afrique de l'Est" },
  { name: "Seychelles", iso: "SC", dial: "248", flag: "🇸🇨", region: "Afrique de l'Est" },
  { name: "Somalie", iso: "SO", dial: "252", flag: "🇸🇴", region: "Afrique de l'Est" },
  { name: "Soudan du Sud", iso: "SS", dial: "211", flag: "🇸🇸", region: "Afrique de l'Est" },
  { name: "Tanzanie", iso: "TZ", dial: "255", flag: "🇹🇿", region: "Afrique de l'Est" },
  { name: "Ouganda", iso: "UG", dial: "256", flag: "🇺🇬", region: "Afrique de l'Est" },

  // Afrique Australe
  { name: "Angola", iso: "AO", dial: "244", flag: "🇦🇴", region: "Afrique Australe" },
  { name: "Botswana", iso: "BW", dial: "267", flag: "🇧🇼", region: "Afrique Australe" },
  { name: "Eswatini", iso: "SZ", dial: "268", flag: "🇸🇿", region: "Afrique Australe" },
  { name: "Lesotho", iso: "LS", dial: "266", flag: "🇱🇸", region: "Afrique Australe" },
  { name: "Namibie", iso: "NA", dial: "264", flag: "🇳🇦", region: "Afrique Australe" },
  { name: "Afrique du Sud", iso: "ZA", dial: "27", flag: "🇿🇦", region: "Afrique Australe" },
  { name: "Zambie", iso: "ZM", dial: "260", flag: "🇿🇲", region: "Afrique Australe" },
  { name: "Zimbabwe", iso: "ZW", dial: "263", flag: "🇿🇼", region: "Afrique Australe" },
];

export const AFRICAN_REGIONS = [
  { name: "Afrique du Nord", countries: AFRICAN_COUNTRIES.filter((c) => c.region === "Afrique du Nord").map((c) => c.name) },
  { name: "Afrique de l'Ouest", countries: AFRICAN_COUNTRIES.filter((c) => c.region === "Afrique de l'Ouest").map((c) => c.name) },
  { name: "Afrique Centrale", countries: AFRICAN_COUNTRIES.filter((c) => c.region === "Afrique Centrale").map((c) => c.name) },
  { name: "Afrique de l'Est", countries: AFRICAN_COUNTRIES.filter((c) => c.region === "Afrique de l'Est").map((c) => c.name) },
  { name: "Afrique Australe", countries: AFRICAN_COUNTRIES.filter((c) => c.region === "Afrique Australe").map((c) => c.name) },
];

export const findAfricanCountry = (iso) =>
  AFRICAN_COUNTRIES.find((c) => c.iso === iso) || AFRICAN_COUNTRIES.find((c) => c.iso === "CM");