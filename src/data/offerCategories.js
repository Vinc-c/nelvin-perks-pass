import { translate } from "@/i18n/translate";

export const OFFER_CATEGORIES = [
  { value: "FOOD_DINING", label: "Restaurants et cafés", emoji: "🍽️" },
  { value: "TRAVEL_HOLIDAYS", label: "Voyages & vacances", emoji: "✈️" },
  { value: "HOTELS_HOSPITALITY", label: "Hôtels & hospitalité", emoji: "🏨" },
  { value: "FITNESS_SPORTS", label: "Fitness & sport", emoji: "🏋️" },
  { value: "WELLNESS_MENTAL", label: "Bien-être & mental", emoji: "🧘" },
  { value: "HEALTHCARE", label: "Santé", emoji: "🩺" },
  { value: "FINANCIAL_WELLNESS", label: "Bien-être financier", emoji: "💰" },
  { value: "SHOPPING_RETAIL", label: "Shopping & retail", emoji: "🛍️" },
  { value: "TECHNOLOGY", label: "Technologie", emoji: "💻" },
  { value: "FAMILY_PARENTING", label: "Famille & parentalité", emoji: "👨‍👩‍👧" },
  { value: "EDUCATION_LEARNING", label: "Éducation", emoji: "🎓" },
  { value: "HOME_LIVING", label: "Maison & quotidien", emoji: "🏠" },
  { value: "AUTOMOTIVE_MOBILITY", label: "Auto & mobilité", emoji: "🚗" },
  { value: "BEAUTY_CARE", label: "Beauté & soin", emoji: "💄" },
  { value: "ENTERTAINMENT", label: "Divertissement", emoji: "🎉" },
];

/** English labels used by the (English) public landing page. */
export const CATEGORY_LABELS_EN = {
  FOOD_DINING: "Restaurants and cafés", TRAVEL_HOLIDAYS: "Travel and holidays", HOTELS_HOSPITALITY: "Hotels and hospitality",
  FITNESS_SPORTS: "Fitness and sports", WELLNESS_MENTAL: "Wellness and mind", HEALTHCARE: "Healthcare",
  FINANCIAL_WELLNESS: "Financial well-being", SHOPPING_RETAIL: "Shopping and retail", TECHNOLOGY: "Technology",
  FAMILY_PARENTING: "Family and parenting", EDUCATION_LEARNING: "Education and learning", HOME_LIVING: "Home and living",
  AUTOMOTIVE_MOBILITY: "Auto and mobility", BEAUTY_CARE: "Beauty and care", ENTERTAINMENT: "Entertainment",
};

export const categoryMeta = (value) =>
  OFFER_CATEGORIES.find((c) => c.value === value) || { value, label: value || translate("mc.cat.other"), emoji: "🏷️" };

export const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Percentage (%)", suffix: "%" },
  { value: "FIXED", label: "Fixed amount", suffix: "" },
  { value: "CASHBACK", label: "Cashback", suffix: "%" },
  { value: "PERK", label: "Premium perk (free extra)", suffix: "" },
];

export const AUDIENCES = [
  { value: "ALL", label: "Everyone (B2B + B2C)" },
  { value: "B2C", label: "Individuals (B2C)" },
  { value: "B2B_ONLY", label: "Employees (B2B)" },
];
/** Local illustration for a category (public/images/categories). */
export const categoryImage = (value) =>
  value ? `/images/categories/${String(value).toLowerCase().replace(/_/g, "-")}.webp` : "/images/placeholder.svg";

// Woven-motif colours per category (brand palette), used instead of emoji on
// the landing page and the map.
export const NV = { night: "#08261D", gold: "#C8A24A", indigo: "#14201B", malachite: "#0F4A38", mist: "#F2EBDA", clay: "#A8472A", emerald: "#0F4A38", ink: "#14201B", terracotta: "#A8472A" };
const HUES = {
  FOOD_DINING: [NV.gold, NV.terracotta], TRAVEL_HOLIDAYS: [NV.emerald, NV.gold], HOTELS_HOSPITALITY: [NV.ink, NV.gold],
  FITNESS_SPORTS: [NV.emerald, NV.terracotta], WELLNESS_MENTAL: [NV.emerald, NV.gold], HEALTHCARE: [NV.ink, NV.emerald],
  FINANCIAL_WELLNESS: [NV.ink, NV.gold], SHOPPING_RETAIL: [NV.terracotta, NV.gold], TECHNOLOGY: [NV.ink, NV.terracotta],
  FAMILY_PARENTING: [NV.gold, NV.emerald], EDUCATION_LEARNING: [NV.emerald, NV.ink], HOME_LIVING: [NV.terracotta, NV.ink],
  AUTOMOTIVE_MOBILITY: [NV.ink, NV.emerald], BEAUTY_CARE: [NV.terracotta, NV.gold], ENTERTAINMENT: [NV.gold, NV.ink],
};
export const categoryHues = (value) => HUES[value] || [NV.ink, NV.gold];
