// Brand logo from a domain. Clearbit's free logo API was shut down, so we use
// the favicon service (always answers; low-res brands fall back to initials).
export const domainLogo = (domain, size = 128) => {
  const d = String(domain || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return d ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${size}` : "";
};
