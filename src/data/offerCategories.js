export const OFFER_CATEGORIES = [
  { value: "FOOD_DINING", label: "Restauration", emoji: "🍽️" },
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

export const categoryMeta = (value) =>
  OFFER_CATEGORIES.find((c) => c.value === value) || { label: value || "Autre", emoji: "🏷️" };

export const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Pourcentage (%)", suffix: "%" },
  { value: "FIXED", label: "Montant fixe", suffix: "" },
  { value: "CASHBACK", label: "Cashback", suffix: "%" },
  { value: "BOGO", label: "2 pour 1 (BOGO)", suffix: "" },
];

export const AUDIENCES = [
  { value: "ALL", label: "Tout le monde (B2B + B2C)" },
  { value: "B2C", label: "Particuliers (B2C)" },
  { value: "B2B_ONLY", label: "Employés (B2B)" },
];
/** Local illustration for a category (public/images/categories). */
export const categoryImage = (value) =>
  value ? `/images/categories/${String(value).toLowerCase().replace(/_/g, "-")}.webp` : "/images/placeholder.svg";
