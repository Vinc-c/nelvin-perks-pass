// Nelvin Benefits — mock data for portals

export const mockMerchants = [
  { id: "m1", name: "Le Baobab Gourmet", category: "FOOD_DINING", city: "Douala", country: "Cameroon", lat: 4.0511, lng: 9.7679, rating: 4.8, verified_status: "VERIFIED", logo_url: "", payout_balance: 1240 },
  { id: "m2", name: "Sahara Spa & Wellness", category: "WELLNESS_MENTAL", city: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811, rating: 4.9, verified_status: "VERIFIED", logo_url: "", payout_balance: 3120 },
  { id: "m3", name: "Nairobi Sky Lounge", category: "HOTELS_HOSPITALITY", city: "Nairobi", country: "Kenya", lat: -1.2864, lng: 36.8172, rating: 4.7, verified_status: "VERIFIED", logo_url: "", payout_balance: 5600 },
  { id: "m4", name: "Lagos Fitness Hub", category: "FITNESS_SPORTS", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, rating: 4.6, verified_status: "VERIFIED", logo_url: "", payout_balance: 890 },
  { id: "m5", name: "Cairo Nile Bistro", category: "FOOD_DINING", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, rating: 4.5, verified_status: "PENDING", logo_url: "", payout_balance: 0 },
  { id: "m6", name: "Accra Beach Resort", category: "TRAVEL_HOLIDAYS", city: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, rating: 4.7, verified_status: "VERIFIED", logo_url: "", payout_balance: 4200 },
  { id: "m7", name: "Casablanca Tech Bazaar", category: "TECHNOLOGY", city: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, rating: 4.6, verified_status: "VERIFIED", logo_url: "", payout_balance: 1500 },
  { id: "m8", name: "Dakar Family Fun Park", category: "FAMILY_PARENTING", city: "Dakar", country: "Senegal", lat: 14.7167, lng: -17.4677, rating: 4.5, verified_status: "VERIFIED", logo_url: "", payout_balance: 640 },
  { id: "m9", name: "Kigali Learning Center", category: "EDUCATION_LEARNING", city: "Kigali", country: "Rwanda", lat: -1.9536, lng: 30.0606, rating: 4.8, verified_status: "VERIFIED", logo_url: "", payout_balance: 980 },
  { id: "m10", name: "Addis Home & Living", category: "HOME_LIVING", city: "Addis Ababa", country: "Ethiopia", lat: 9.0192, lng: 38.7525, rating: 4.4, verified_status: "VERIFIED", logo_url: "", payout_balance: 720 },
  { id: "m11", name: "Tunis Auto Care", category: "AUTOMOTIVE_MOBILITY", city: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815, rating: 4.6, verified_status: "VERIFIED", logo_url: "", payout_balance: 1100 },
  { id: "m12", name: "Lagos Beauty Lounge", category: "BEAUTY_CARE", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, rating: 4.7, verified_status: "VERIFIED", logo_url: "", payout_balance: 1340 },
  { id: "m13", name: "Nairobi Cinema Plaza", category: "ENTERTAINMENT", city: "Nairobi", country: "Kenya", lat: -1.2864, lng: 36.8172, rating: 4.5, verified_status: "VERIFIED", logo_url: "", payout_balance: 880 },
  { id: "m14", name: "Cape Town Financial Advisors", category: "FINANCIAL_WELLNESS", city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, rating: 4.8, verified_status: "VERIFIED", logo_url: "", payout_balance: 2600 },
  { id: "m15", name: "Accra Shopping Mall", category: "SHOPPING_RETAIL", city: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, rating: 4.6, verified_status: "VERIFIED", logo_url: "", payout_balance: 1980 },
  { id: "m16", name: "Cairo Health Clinic", category: "HEALTHCARE", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, rating: 4.7, verified_status: "VERIFIED", logo_url: "", payout_balance: 3200 },
];

export const mockOffers = [
  { id: "o1", merchant_id: "m1", merchant_name: "Le Baobab Gourmet", title: "20% off Lunch Menu", discount_type: "PERCENTAGE", discount_value: 20, cashback_rate: 5, target_audience: "ALL", is_featured: true, category: "FOOD_DINING", city: "Douala" },
  { id: "o2", merchant_id: "m2", merchant_name: "Sahara Spa & Wellness", title: "VIP Spa Day - 30% off", discount_type: "PERCENTAGE", discount_value: 30, cashback_rate: 8, target_audience: "B2C", is_featured: true, category: "WELLNESS_MENTAL", city: "Marrakech" },
  { id: "o3", merchant_id: "m3", merchant_name: "Nairobi Sky Lounge", title: "2-for-1 Weekend Brunch", discount_type: "BOGO", discount_value: 50, cashback_rate: 6, target_audience: "B2C", is_featured: true, category: "HOTELS_HOSPITALITY", city: "Nairobi" },
  { id: "o4", merchant_id: "m4", merchant_name: "Lagos Fitness Hub", title: "1 Month Free Membership", discount_type: "PERCENTAGE", discount_value: 100, cashback_rate: 10, target_audience: "B2B_ONLY", is_featured: false, category: "FITNESS_SPORTS", city: "Lagos" },
  { id: "o5", merchant_id: "m5", merchant_name: "Cairo Nile Bistro", title: "15% off Dinner", discount_type: "PERCENTAGE", discount_value: 15, cashback_rate: 4, target_audience: "ALL", is_featured: false, category: "FOOD_DINING", city: "Cairo" },
  { id: "o6", merchant_id: "m6", merchant_name: "Accra Beach Resort", title: "Luxury Suite 25% off", discount_type: "PERCENTAGE", discount_value: 25, cashback_rate: 7, target_audience: "B2C", is_featured: true, category: "TRAVEL_HOLIDAYS", city: "Accra" },
  { id: "o7", merchant_id: "m7", merchant_name: "Casablanca Tech Bazaar", title: "10% off Gadgets", discount_type: "PERCENTAGE", discount_value: 10, cashback_rate: 5, target_audience: "ALL", is_featured: false, category: "TECHNOLOGY", city: "Casablanca" },
  { id: "o8", merchant_id: "m8", merchant_name: "Dakar Family Fun Park", title: "Family Day Pass 30% off", discount_type: "PERCENTAGE", discount_value: 30, cashback_rate: 6, target_audience: "ALL", is_featured: true, category: "FAMILY_PARENTING", city: "Dakar" },
  { id: "o9", merchant_id: "m9", merchant_name: "Kigali Learning Center", title: "20% off Courses", discount_type: "PERCENTAGE", discount_value: 20, cashback_rate: 5, target_audience: "ALL", is_featured: false, category: "EDUCATION_LEARNING", city: "Kigali" },
  { id: "o10", merchant_id: "m10", merchant_name: "Addis Home & Living", title: "15% off Furniture", discount_type: "PERCENTAGE", discount_value: 15, cashback_rate: 4, target_audience: "ALL", is_featured: false, category: "HOME_LIVING", city: "Addis Ababa" },
  { id: "o11", merchant_id: "m11", merchant_name: "Tunis Auto Care", title: "Free Car Service Check", discount_type: "FIXED", discount_value: 40, cashback_rate: 3, target_audience: "ALL", is_featured: false, category: "AUTOMOTIVE_MOBILITY", city: "Tunis" },
  { id: "o12", merchant_id: "m12", merchant_name: "Lagos Beauty Lounge", title: "25% off Beauty Package", discount_type: "PERCENTAGE", discount_value: 25, cashback_rate: 6, target_audience: "B2C", is_featured: true, category: "BEAUTY_CARE", city: "Lagos" },
  { id: "o13", merchant_id: "m13", merchant_name: "Nairobi Cinema Plaza", title: "Buy 1 Get 1 Cinema Tickets", discount_type: "BOGO", discount_value: 50, cashback_rate: 5, target_audience: "ALL", is_featured: true, category: "ENTERTAINMENT", city: "Nairobi" },
  { id: "o14", merchant_id: "m14", merchant_name: "Cape Town Financial Advisors", title: "Free Financial Consultation", discount_type: "FIXED", discount_value: 100, cashback_rate: 0, target_audience: "ALL", is_featured: false, category: "FINANCIAL_WELLNESS", city: "Cape Town" },
  { id: "o15", merchant_id: "m15", merchant_name: "Accra Shopping Mall", title: "Mall Wide 10% off", discount_type: "PERCENTAGE", discount_value: 10, cashback_rate: 4, target_audience: "ALL", is_featured: false, category: "SHOPPING_RETAIL", city: "Accra" },
  { id: "o16", merchant_id: "m16", merchant_name: "Cairo Health Clinic", title: "20% off Health Checkup", discount_type: "PERCENTAGE", discount_value: 20, cashback_rate: 5, target_audience: "ALL", is_featured: true, category: "HEALTHCARE", city: "Cairo" },
];

export const mockTransactions = [
  { id: "t1", merchant_name: "Le Baobab Gourmet", amount: 45, cashback_amount: 2.25, currency: "USD", type: "REDEMPTION", status: "COMPLETED", date: "2026-09-28" },
  { id: "t2", merchant_name: "Sahara Spa & Wellness", amount: 120, cashback_amount: 9.6, currency: "USD", type: "REDEMPTION", status: "COMPLETED", date: "2026-09-25" },
  { id: "t3", merchant_name: "Recharge", amount: 50, cashback_amount: 0, currency: "USD", type: "RECHARGE", status: "COMPLETED", date: "2026-09-20" },
  { id: "t4", merchant_name: "Nairobi Sky Lounge", amount: 80, cashback_amount: 4.8, currency: "USD", type: "REDEMPTION", status: "COMPLETED", date: "2026-09-18" },
  { id: "t5", merchant_name: "Withdrawal to MoMo", amount: 30, cashback_amount: 0, currency: "USD", type: "WITHDRAWAL", status: "COMPLETED", date: "2026-09-15" },
];

export const mockEmployees = [
  { id: "e1", full_name: "Amara Diallo", email: "amara@nelvin.co", status: "active", department: "Engineering", allowances: { dining: 120, health: 200, sport: 80 } },
  { id: "e2", full_name: "Kwame Mensah", email: "kwame@nelvin.co", status: "active", department: "Sales", allowances: { dining: 100, health: 150, sport: 60 } },
  { id: "e3", full_name: "Fatima Zahra", email: "fatima@nelvin.co", status: "active", department: "Marketing", allowances: { dining: 110, health: 180, sport: 90 } },
  { id: "e4", full_name: "John Mwangi", email: "john@nelvin.co", status: "pending", department: "Operations", allowances: { dining: 90, health: 160, sport: 70 } },
  { id: "e5", full_name: "Aisha Bello", email: "aisha@nelvin.co", status: "active", department: "HR", allowances: { dining: 130, health: 220, sport: 100 } },
];

export const mockRedemptions = [
  { id: "r1", offer_title: "20% off Lunch Menu", merchant_name: "Le Baobab Gourmet", code: "NEL-X7K2P9", status: "REDEEMED", date: "2026-09-28", cashback: 2.25 },
  { id: "r2", offer_title: "VIP Spa Day - 30% off", merchant_name: "Sahara Spa & Wellness", code: "NEL-Q3M8T1", status: "REDEEMED", date: "2026-09-25", cashback: 9.6 },
  { id: "r3", offer_title: "2-for-1 Weekend Brunch", merchant_name: "Nairobi Sky Lounge", code: "NEL-B9R4W2", status: "GENERATED", date: "2026-10-01", cashback: 0 },
];

export const mockPSPs = [
  { id: "paddle", name: "Paddle", region: "Global", status: "operational", volume: 45200, latency: 320, color: "#5F6FFF" },
  { id: "stripe", name: "Stripe", region: "Global", status: "operational", volume: 38900, latency: 280, color: "#635BFF" },
  { id: "paystack", name: "Paystack", region: "West Africa", status: "operational", volume: 21400, latency: 410, color: "#00C9A7" },
  { id: "flutterwave", name: "Flutterwave", region: "Pan-Africa", status: "degraded", volume: 28700, latency: 690, color: "#F5A623" },
  { id: "payunit", name: "Payunit", region: "CEMAC", status: "operational", volume: 8300, latency: 350, color: "#FF6B6B" },
  { id: "campay", name: "CamPay", region: "Central Africa", status: "operational", volume: 12600, latency: 290, color: "#10B981" },
];

export const mockCurrencies = [
  { code: "USD", name: "US Dollar", rate: 1, symbol: "$" },
  { code: "EUR", name: "Euro", rate: 0.92, symbol: "€" },
  { code: "XAF", name: "CFA Franc BEAC", rate: 605, symbol: "FCFA" },
  { code: "XOF", name: "CFA Franc BCEAO", rate: 605, symbol: "CFA" },
  { code: "NGN", name: "Nigerian Naira", rate: 1580, symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", rate: 128, symbol: "KSh" },
  { code: "EGP", name: "Egyptian Pound", rate: 48, symbol: "E£" },
  { code: "AED", name: "UAE Dirham", rate: 3.67, symbol: "AED" },
];

export const pricingPlans = {
  hr: [
    { id: "starter", name: "Starter Team", range: "0-15 employees", monthly: 79, annual: 805, features: ["Employee invitations", "Basic allowance wallet", "QR redemption", "Email support"], popular: false },
    { id: "growth", name: "Growth Business", range: "15-59 employees", monthly: 129, annual: 1315, features: ["Everything in Starter", "Benefits Builder", "Analytics dashboard", "HRIS integration", "Priority support"], popular: true },
    { id: "enterprise", name: "Enterprise Unlimited", range: "60+ employees", monthly: 189, annual: 1927, features: ["Everything in Growth", "Unlimited employees", "SSO + SAML", "Dedicated CSM", "Custom SLA"], popular: false },
  ],
  b2c: [
    { id: "basic", name: "Pass Basic", monthly: 9, annual: 91, features: ["Access to 500+ deals", "Cashback tracking", "1 currency wallet"], popular: false },
    { id: "premium", name: "Pass Premium", monthly: 19, annual: 193, features: ["Everything in Basic", "2-for-1 deals", "Multi-currency wallet", "Mobile Money payouts", "Priority deals"], popular: true },
    { id: "vip", name: "Pass VIP Gold", monthly: 39, annual: 397, features: ["Everything in Premium", "Luxury hotel perks", "Concierge support", "Exclusive VIP events", "Higher cashback rates"], popular: false },
  ],
  merchant: [
    { id: "basic", name: "Merchant Basic", monthly: 29, annual: 295, features: ["Store listing", "QR scanner", "Basic campaigns", "Monthly payouts"], popular: false },
    { id: "pro", name: "Merchant Pro", monthly: 49, annual: 497, features: ["Everything in Basic", "Advanced campaigns", "Off-peak scheduling", "Instant payouts", "P&L analytics"], popular: true },
  ],
};

export const categoryIcons = {
  FOOD_DINING: "🍽️",
  TRAVEL_HOLIDAYS: "✈️",
  HOTELS_HOSPITALITY: "🏨",
  FITNESS_SPORTS: "🏋️",
  WELLNESS_MENTAL: "🧘",
  HEALTHCARE: "🏥",
  FINANCIAL_WELLNESS: "💰",
  SHOPPING_RETAIL: "🛍️",
  TECHNOLOGY: "💻",
  FAMILY_PARENTING: "👨‍👩‍👧",
  EDUCATION_LEARNING: "🎓",
  HOME_LIVING: "🏡",
  AUTOMOTIVE_MOBILITY: "🚗",
  BEAUTY_CARE: "💄",
  ENTERTAINMENT: "🎉",
};

export const categoryLabels = {
  FOOD_DINING: "Food & Dining",
  TRAVEL_HOLIDAYS: "Travel & Holidays",
  HOTELS_HOSPITALITY: "Hotels & Hospitality",
  FITNESS_SPORTS: "Fitness & Sports",
  WELLNESS_MENTAL: "Wellness & Mental Health",
  HEALTHCARE: "Healthcare",
  FINANCIAL_WELLNESS: "Financial Wellness",
  SHOPPING_RETAIL: "Shopping & Retail",
  TECHNOLOGY: "Technology",
  FAMILY_PARENTING: "Family & Parenting",
  EDUCATION_LEARNING: "Education & Learning",
  HOME_LIVING: "Home & Living",
  AUTOMOTIVE_MOBILITY: "Automotive & Mobility",
  BEAUTY_CARE: "Beauty & Personal Care",
  ENTERTAINMENT: "Entertainment",
};