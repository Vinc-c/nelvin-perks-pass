// Nelvin icon glyphs: 24x24, 1.6 stroke, duotone (currentColor + gold accent).
// Hand-drawn for the platform so category, tier and feature icons are ours,
// not a generic icon pack. `A` marks the accent colour.
const A = 'stroke="var(--nv-accent,#B58A2A)"';
const AF = 'fill="var(--nv-accent,#B58A2A)" stroke="none"';

export const GLYPHS = {
  // Categories
  FOOD_DINING: `<path d="M3.5 12h17a8.5 7.2 0 0 1-17 0z"/><path d="M8 8.6c-1-1.2 1-2 0-3.3M12 8.6c-1-1.2 1-2 0-3.3M16 8.6c-1-1.2 1-2 0-3.3"/><path ${A} d="M9 20.6h6"/>`,
  TRAVEL_HOLIDAYS: `<path d="M10.2 21c.7-3.2.7-6.2 0-9.4h3.6c-.7 3.2-.7 6.2 0 9.4"/><path d="M3.5 10.6C3.5 7.6 7.3 5.6 12 5.6s8.5 2 8.5 5c-1.6.9-3.4.8-4.7-.1-1.2.9-2.6 1.2-3.8 1.2s-2.6-.3-3.8-1.2c-1.3.9-3.1 1-4.7.1z"/><circle ${AF} cx="19" cy="4" r="1.5"/>`,
  HOTELS_HOSPITALITY: `<path d="M4 21V9.5l8-5.5 8 5.5V21"/><path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5"/><path ${AF} d="M12 7l.8 1.6 1.7.3-1.2 1.2.3 1.7L12 11l-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>`,
  FITNESS_SPORTS: `<path d="M4.5 8.5v7M7 6.8v10.4M17 6.8v10.4M19.5 8.5v7"/><path ${A} d="M7 12h10"/><path d="M2.5 11v2M21.5 11v2"/>`,
  WELLNESS_MENTAL: `<path d="M12 20.5c-4-1.5-6.5-4.7-6.5-8.5 2.8.2 5 1.8 6.5 4.2 1.5-2.4 3.7-4 6.5-4.2 0 3.8-2.5 7-6.5 8.5z"/><path ${A} d="M12 3.5c2 2 3 4.2 3 6.5 0 2-1.3 3.7-3 5-1.7-1.3-3-3-3-5 0-2.3 1-4.5 3-6.5z"/>`,
  HEALTHCARE: `<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path ${A} d="M12 8.5v6M9 11.5h6"/>`,
  FINANCIAL_WELLNESS: `<ellipse cx="12" cy="7.5" rx="7" ry="2.7"/><path d="M5 7.5v9.5c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V7.5"/><path ${A} d="M5 12.2c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7"/>`,
  SHOPPING_RETAIL: `<path d="M4 10h16l-1.6 9.2a1.5 1.5 0 0 1-1.5 1.3H7.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8 10l3-5.5M16 10l-3-5.5"/><path ${A} d="M6.2 14.2h11.6M6.8 17.4h10.4"/>`,
  TECHNOLOGY: `<rect x="5.5" y="3" width="13" height="18" rx="2.5"/><path d="M10.5 5.8h3"/><path ${A} d="M9.2 12.8a4 4 0 0 1 5.6 0M7.5 10.3a6.5 6.5 0 0 1 9 0"/><circle ${AF} cx="12" cy="15.8" r="1.1"/>`,
  FAMILY_PARENTING: `<circle cx="7.5" cy="7" r="2.2"/><circle cx="16.5" cy="7" r="2.2"/><path d="M3.5 19v-2.5a3.5 3.5 0 0 1 3.5-3.5h1M20.5 19v-2.5a3.5 3.5 0 0 0-3.5-3.5h-1"/><circle ${A} cx="12" cy="12.5" r="1.8"/><path ${A} d="M9 20v-1.7a3 3 0 0 1 6 0V20"/>`,
  EDUCATION_LEARNING: `<path d="M12 8c-2-1.4-5-1.8-8-1.3v12c3-.500 6 0 8 1.3 2-1.3 5-1.8 8-1.3v-12c-3-.500-6-.100-8 1.3z"/><path d="M12 8v12"/><circle ${AF} cx="12" cy="3.6" r="1.5"/>`,
  HOME_LIVING: `<path d="M2.5 12.5L12 3.8l9.5 8.7"/><path ${A} d="M8 8.8l-1.8 3M12 6.8v5.2M16 8.8l1.8 3"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-3.6a2 2 0 0 1 4 0V20"/>`,
  AUTOMOTIVE_MOBILITY: `<path d="M3 16.5v-3.7l2-4.3A1.6 1.6 0 0 1 6.5 7.5h7a1.6 1.6 0 0 1 1.3.7l2.7 3.6 2.5.7v4H18.6M5.4 16.5H3M10 16.5h4"/><circle ${A} cx="7.7" cy="16.8" r="2"/><circle ${A} cx="16.3" cy="16.8" r="2"/>`,
  BEAUTY_CARE: `<path d="M7 3.5v7M10 3.5v7M13 3.5v7M16 3.5v7"/><path d="M5.5 10.5H17.5a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1z"/><path ${A} d="M9.8 14v6.2a1.5 1.5 0 0 0 3 0V14"/>`,
  ENTERTAINMENT: `<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4z"/><path ${A} stroke-dasharray="1.6 1.8" d="M14.8 7.5v9"/><path ${AF} d="M8.5 9.3l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>`,

  // Tiers
  PASS_FREE: `<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path ${A} d="M6.5 14.5h4"/>`,
  PASS_PREMIUM: `<path d="M6 4h12l3.5 5L12 20.5 2.5 9z"/><path ${A} d="M2.5 9h19M9.5 4L8 9l4 11.5M14.5 4L16 9l-4 11.5"/>`,
  PASS_VIP: `<path d="M3.5 8.5l4.5 4 4-7 4 7 4.5-4-1.8 10H5.3z"/><circle ${AF} cx="12" cy="4.6" r="1.2"/><circle ${AF} cx="3.3" cy="8" r="1.1"/><circle ${AF} cx="20.7" cy="8" r="1.1"/><path ${A} d="M7 16.5h10"/>`,

  // Africa-first features
  MOBILE_MONEY: `<path d="M12.5 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5h6.5A1.5 1.5 0 0 1 14 5v3"/><path d="M8 17.5h2"/><circle ${A} cx="16.8" cy="15" r="4.6"/><path ${A} d="M16.8 12.8v4.4M15.3 14.3h2.2a.8.8 0 0 1 0 1.6h-1.4"/>`,
  WHATSAPP: `<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5z"/><path ${A} d="M9.2 8.8c-.3 3 2.8 6.2 5.9 6.1l.9-1.4-2-1-.9.8c-.9-.4-1.7-1.2-2.1-2.1l.8-.9-1-2z"/>`,
  OFFLINE: `<path d="M7 18a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18"/><path ${A} d="M12 11.5v8M9 16.5l3 3 3-3"/>`,
  DATA_SAVER: `<path d="M20 4c-8 0-14 3.8-14 10.5V16L4 20"/><path d="M20 4c0 7-4.5 11-11 11.5"/><path ${A} d="M8.5 12.5c2.5-.2 5-1.5 6.5-4"/>`,
  QR_CODE: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path ${A} d="M14 14h2.5v2.5H14zM18.5 14h2M14 19h2.5M18.5 17.5v3h2"/>`,
  PIN_CODE: `<circle cx="6.5" cy="6.5" r="1.6"/><circle cx="12" cy="6.5" r="1.6"/><circle cx="17.5" cy="6.5" r="1.6"/><circle cx="6.5" cy="12" r="1.6"/><circle ${A} cx="12" cy="12" r="1.6"/><circle cx="17.5" cy="12" r="1.6"/><circle cx="12" cy="17.5" r="1.6"/>`,
  VERIFIED: `<path d="M12 2.8l2.4 1.7 2.9-.1 1 2.7 2.3 1.8-.9 2.8.9 2.8-2.3 1.8-1 2.7-2.9-.1-2.4 1.7-2.4-1.7-2.9.1-1-2.7-2.3-1.8.9-2.8-.9-2.8 2.3-1.8 1-2.7 2.9.1z"/><path ${A} d="M8.5 12.2l2.4 2.4 4.6-4.8"/>`,
  WALLET: `<path d="M4 6.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 1 4 5.5v0A2.5 2.5 0 0 1 6.5 3H17"/><circle ${AF} cx="16.2" cy="13.5" r="1.3"/>`,
  CASHBACK: `<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 3.5v4h-4"/><circle ${A} cx="12" cy="12" r="2.6"/>`,
  CITY_PIN: `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle ${A} cx="12" cy="10" r="2.4"/>`,
  PERK_GIFT: `<path d="M4.5 10.5h15V20h-15zM3.5 7.5h17v3h-17zM12 7.5V20"/><path ${A} d="M12 7.5c-1-3.2-5-3.6-5-1.6s3.5 1.6 5 1.6zM12 7.5c1-3.2 5-3.6 5-1.6s-3.5 1.6-5 1.6z"/>`,
  PERCENT: `<path d="M18 6L6 18"/><circle ${A} cx="7.5" cy="7.5" r="2.3"/><circle ${A} cx="16.5" cy="16.5" r="2.3"/>`,
  AFRICA: `<path d="M7 5L11 3.5 15 4.5 17 6.5 19 7.5 20.5 10 21.5 11.5 19.5 13.5 18.5 15.5 17 19 14.5 21.5 12.5 21 11.5 17.5 10.5 15.5 8.5 14.5 5.5 13 3.5 10.5 4 8 6 6z"/><circle ${AF} cx="12.5" cy="11" r="1.6"/>`,
  SHIELD_LOCK: `<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><rect ${A} x="9" y="10.5" width="6" height="4.8" rx="1"/><path ${A} d="M10.2 10.5V9.3a1.8 1.8 0 0 1 3.6 0v1.2"/>`,
  STAR_MARK: `<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5 6.9 19.2l1-5.7-4.1-4 5.7-.8z"/><path ${A} d="M12 8.8l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>`,
};
