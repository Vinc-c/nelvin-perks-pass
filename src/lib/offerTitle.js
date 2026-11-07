// One consistent offer title: "30% off at Iya · Kumba". Cleans legacy titles
// ("50%", "30 off at Iya", double spaces) without touching stored data.
const collapse = (s) => String(s || "").replace(/\s+/g, " ").trim();

export function offerTitle(offer) {
  const merchant = collapse(offer?.merchant_name);
  let title = collapse(offer?.title);
  const bare = title.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (bare && merchant) title = `${bare[1]}% off at ${merchant}`;
  else title = title.replace(/^(\d+(?:\.\d+)?)\s+off\b/i, "$1% off");
  const city = collapse(offer?.city).split(/\s+/).slice(0, 2).join(" ");
  if (city && merchant && title.toLowerCase().endsWith(`at ${merchant}`.toLowerCase())) title += ` · ${city}`;
  return title;
}
