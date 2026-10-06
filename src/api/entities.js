// Thin data-access layer over Supabase tables. Each entity exposes the small
// API the app uses everywhere: list / filter / get / create / bulkCreate /
// update / bulkUpdate / delete / subscribe. Access control is enforced by
// Postgres Row Level Security (see supabase/migrations).
import { supabase } from "./supabaseClient";

function fail(error) {
  const err = new Error(error?.message || "Database error");
  err.code = error?.code;
  err.details = error?.details;
  throw err;
}

function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith("-");
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc, nullsFirst: false });
}

function applyFilters(query, filters = {}) {
  let q = query;
  for (const [column, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) q = q.in(column, value);
    else if (value === null) q = q.is(column, null);
    else q = q.eq(column, value);
  }
  return q;
}

function createEntity(table) {
  const filter = async (filters = {}, sort, limit) => {
    let q = applyFilters(supabase.from(table).select("*"), filters);
    q = applySort(q, sort);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) fail(error);
    return data || [];
  };

  return {
    table,
    filter,
    list: (sort, limit) => filter({}, sort, limit),

    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) fail(error);
      if (!data) fail({ message: `${table} not found`, code: "PGRST116" });
      return data;
    },

    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) fail(error);
      return data;
    },

    async bulkCreate(rows) {
      const { data, error } = await supabase.from(table).insert(rows).select();
      if (error) fail(error);
      return data || [];
    },

    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq("id", id).select().maybeSingle();
      if (error) fail(error);
      return data;
    },

    async bulkUpdate(rows) {
      return Promise.all(rows.map(({ id, ...values }) => this.update(id, values)));
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) fail(error);
    },

    /** Realtime: calls `callback(payload)` on any change visible to the user. Returns an unsubscribe fn. */
    subscribe(callback, { filter: rowFilter } = {}) {
      const channel = supabase
        .channel(`${table}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table, ...(rowFilter ? { filter: rowFilter } : {}) }, (payload) =>
          callback(payload)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

export const entities = {
  Category: createEntity("categories"),
  Company: createEntity("companies"),
  InviteCode: createEntity("invite_codes"),
  Merchant: createEntity("merchants"),
  Notification: createEntity("notifications"),
  Offer: createEntity("offers"),
  PartnerLogo: createEntity("partner_logos"),
  Redemption: createEntity("redemptions"),
  SalesCode: createEntity("sales_codes"),
  SiteCopy: createEntity("site_copy"),
  SiteImage: createEntity("site_images"),
  Subscription: createEntity("subscriptions"),
  Transaction: createEntity("transactions"),
  User: createEntity("profiles"),
};
