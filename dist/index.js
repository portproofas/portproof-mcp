#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { randomUUID } from "node:crypto";

import { isValid as isValidUlid, monotonicFactory, ulid as plainUlid } from "ulid";
var ID_PREFIXES = [
  "org",
  "usr",
  "prj",
  "key",
  "site",
  "host",
  "car",
  "sim",
  "dev",
  "prt",
  "sub",
  "rot",
  "rcp",
  "evt",
  "whk",
  "inc",
  "inv",
  "cmd",
  "cus",
  "ses",
  "etk",
  "sup",
  "prod",
  "fx",
  "cart",
  "ci",
  "ord",
  "oi",
  "pay",
  "wal",
  "pool",
  "cpn",
  "aff",
  "bt",
  "aud",
  "upp",
  "led",
  "wl",
  "opc",
  "opm",
  "opt",
  "opx"
];
var ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
var prefixSet = /* @__PURE__ */ new Set(ID_PREFIXES);
function isId(value, prefix) {
  if (typeof value !== "string")
    return false;
  const idx = value.indexOf("_");
  if (idx <= 0)
    return false;
  const p = value.slice(0, idx);
  const body = value.slice(idx + 1);
  if (prefix !== void 0 ? p !== prefix : !prefixSet.has(p))
    return false;
  return ULID_RE.test(body) && isValidUlid(body);
}

var SKUS = ["lt-4g", "pl-4g", "uk-4g", "es-4g", "de-4g", "nl-4g", "us-4g", "trial-24h"];
var GIB = 1024 ** 3;
var DEFAULT_DAILY_CAP_BYTES = 20 * GIB;
var MAX_ALLOWLIST_CIDRS = 10;
var ROTATION_INTERVAL_MIN_S = 60;
var ROTATION_INTERVAL_MAX_S = 86400;
var TELEMETRY_HOURS_MIN = 72;
var EXCLUSIVITY = "modem+sim+credentials";
var RECEIPT_ALG = "Ed25519";
var WELL_KNOWN_KEYS_PATH = "/.well-known/portproof-keys.json";
var PRODUCT_KINDS = ["port", "bandwidth", "topup", "sms", "esim"];
var PRODUCT_TERMS = ["monthly", "weekly", "daily", "gb", "none"];
var CUSTOMER_SUPPLY_KINDS = ["owned", "generic_pool", "mock"];
var EVIDENCE_LEVELS = ["signed", "observed"];
var PORT_NETWORKS = ["own", "partner"];
var PAYMENT_METHODS = ["stripe", "coingate", "nowpayments", "wallet", "bank_transfer", "mock"];
var ORDER_STATUSES = [
  "draft",
  "awaiting_payment",
  "awaiting_kyb",
  "paid",
  "provisioning",
  "fulfilled",
  "partially_fulfilled",
  "failed_refunded",
  "cancelled",
  "refunded"
];
var TRAFFIC_TRIAL = { sku: "traffic-trial", gb: 0.5, price_cents: 290 };
var TRAFFIC_MOBILE_COUNTRIES = ["US", "GB", "FR", "NL", "PL", "GE"];
var TRAFFIC_PROTOCOLS = ["http", "socks5"];
var OPS_PRINCIPALS = ["admin-key", "claude", "codex"];
var OPS_ACTORS = [...OPS_PRINCIPALS, "system"];

import { z } from "zod";
var IsoDateTime = /* @__PURE__ */ z.string().datetime({ offset: true });
var CountryCode = /* @__PURE__ */ z.string().regex(/^[A-Z]{2}$/, "ISO-3166 alpha-2");
var MccMnc = /* @__PURE__ */ z.string().regex(/^\d{5,6}$/, "MCC+MNC");
var Cents = /* @__PURE__ */ z.number().int().min(0);
var Currency = /* @__PURE__ */ z.enum(["EUR", "USD"]);
var Cidr = /* @__PURE__ */ z.string().regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-fA-F:]+(\/\d{1,3})?$/, "IPv4/IPv6 CIDR");
function idSchema(prefix) {
  return z.string().refine((v) => isId(v, prefix), { message: prefix ? `expected ${prefix}_<ULID>` : `expected <prefix>_<ULID>` });
}
var Operator = /* @__PURE__ */ z.enum(["owned", "partner"]);
var Evidence = /* @__PURE__ */ z.enum(EVIDENCE_LEVELS);
var IpStack = /* @__PURE__ */ z.enum(["v4", "v6_464xlat", "dual"]);
var ContractType = /* @__PURE__ */ z.enum(["prepaid", "business", "m2m"]);
var PortState = /* @__PURE__ */ z.enum([
  "provisioning",
  "available",
  "reserved",
  "sold",
  "leased",
  "migrating",
  "quarantined",
  "retired"
]);
var Term = /* @__PURE__ */ z.enum(["monthly", "weekly", "daily"]);
var PricingTerm = /* @__PURE__ */ z.enum(["monthly", "weekly", "daily", "hourly"]);
var SubscriptionState = /* @__PURE__ */ z.enum(["active", "grace", "suspended", "ended"]);
var RequestedBy = /* @__PURE__ */ z.enum(["manual", "api", "token", "schedule", "health", "migration"]);
var RotationReason = /* @__PURE__ */ z.enum(["ok", "carrier_sticky", "attach_timeout", "driver_error", "cooldown"]);
var SiteStatus = /* @__PURE__ */ z.enum(["provisioning", "live", "degraded", "offline"]);
var SkuSchema = /* @__PURE__ */ z.enum(SKUS);
var ProductSku = /* @__PURE__ */ z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/, "lower-case slug");
var PortNetwork = /* @__PURE__ */ z.enum(PORT_NETWORKS);
var IncidentScope = /* @__PURE__ */ z.enum(["port", "site", "carrier", "platform"]);
var PlatformStatus = /* @__PURE__ */ z.enum(["ok", "degraded", "outage"]);
function paginated(item) {
  return z.object({ data: z.array(item), next_cursor: z.string().nullable() });
}

import { z as z3 } from "zod";

import { z as z2 } from "zod";
var ProxyCredentialDto = /* @__PURE__ */ z2.object({
  host: /* @__PURE__ */ z2.string().min(1),
  port: /* @__PURE__ */ z2.number().int().min(1).max(65535),
  username: /* @__PURE__ */ z2.string().min(1),
  password: /* @__PURE__ */ z2.string().min(1)
});
var PortCapabilitiesDto = /* @__PURE__ */ z2.object({
  replace: /* @__PURE__ */ z2.boolean(),
  cancel: /* @__PURE__ */ z2.boolean(),
  allowlist: /* @__PURE__ */ z2.boolean(),
  auto_swap: /* @__PURE__ */ z2.boolean(),
  rotation_interval: /* @__PURE__ */ z2.boolean(),
  password_change: /* @__PURE__ */ z2.boolean()
});

var Subscription = /* @__PURE__ */ z3.object({
  id: /* @__PURE__ */ idSchema("sub"),
  org_id: /* @__PURE__ */ idSchema("org"),
  port_id: /* @__PURE__ */ idSchema("prt"),
  sku: /* @__PURE__ */ z3.string().min(1),
  term: Term,
  price_cents: Cents,
  currency: Currency,
  starts_at: IsoDateTime,
  ends_at: IsoDateTime,
  auto_renew: /* @__PURE__ */ z3.boolean(),
  state: SubscriptionState,
  provider_ref: /* @__PURE__ */ z3.string().nullable(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime
});
var PortCarrier = /* @__PURE__ */ z3.object({
  id: /* @__PURE__ */ idSchema("car"),
  name: /* @__PURE__ */ z3.string().min(1),
  mcc_mnc: MccMnc,
  ip_stack: IpStack
});
var PortListeners = /* @__PURE__ */ z3.object({
  host: /* @__PURE__ */ z3.string().min(1),
  http_port: /* @__PURE__ */ z3.number().int().min(1).max(65535),
  socks_port: /* @__PURE__ */ z3.number().int().min(1).max(65535)
});
var PortCredentials = /* @__PURE__ */ z3.object({
  username: /* @__PURE__ */ z3.string().min(1),
  password: /* @__PURE__ */ z3.string().min(1),
  http: /* @__PURE__ */ ProxyCredentialDto.optional(),
  socks5: /* @__PURE__ */ ProxyCredentialDto.optional()
});
var PortRenewal = /* @__PURE__ */ z3.object({
  auto_renew: /* @__PURE__ */ z3.boolean(),
  ends_at: IsoDateTime,
  price_cents: Cents,
  can_renew: /* @__PURE__ */ z3.boolean()
});
var UsageToday = /* @__PURE__ */ z3.object({ bytes: /* @__PURE__ */ z3.number().int().min(0), cap_bytes: /* @__PURE__ */ z3.number().int().min(0) });
var Port = /* @__PURE__ */ z3.object({
  id: /* @__PURE__ */ idSchema("prt"),
  state: PortState,
  site_code: /* @__PURE__ */ z3.string().min(1),
  country: CountryCode,
  carrier: PortCarrier,
  operator: Operator,
  listeners: PortListeners,
  credentials: /* @__PURE__ */ PortCredentials.nullable(),
  allowlist: /* @__PURE__ */ z3.array(Cidr).max(MAX_ALLOWLIST_CIDRS),
  egress_v4: /* @__PURE__ */ z3.string().nullable(),
  egress_v6_prefix: /* @__PURE__ */ z3.string().nullable(),
  v4_is_nat64: /* @__PURE__ */ z3.boolean(),
  ip_since: /* @__PURE__ */ IsoDateTime.nullable(),
  rotation_interval_s: /* @__PURE__ */ z3.number().int().min(0),
  sticky_until: /* @__PURE__ */ IsoDateTime.nullable(),
  cooldown_until: /* @__PURE__ */ IsoDateTime.nullable(),
  last_rotation_at: /* @__PURE__ */ IsoDateTime.nullable(),
  telemetry_since: /* @__PURE__ */ IsoDateTime.nullable(),
  usage_today: UsageToday,
  uptime_30d_pct: /* @__PURE__ */ z3.number().min(0).max(100).nullable(),
  subscription: /* @__PURE__ */ Subscription.nullable(),
  evidence: Evidence,
  attestation: Evidence,
  network: /* @__PURE__ */ PortNetwork.optional(),
  capabilities: /* @__PURE__ */ PortCapabilitiesDto.nullable().optional(),
  renewal: /* @__PURE__ */ PortRenewal.nullable().optional(),
  rotation_url: /* @__PURE__ */ z3.string().url().nullable().optional()
});
var RotatePendingResponse = /* @__PURE__ */ z3.object({ rotation_id: /* @__PURE__ */ idSchema("rot"), status: /* @__PURE__ */ z3.literal("pending") });
var RotationScheduleRequest = /* @__PURE__ */ z3.object({
  interval_s: /* @__PURE__ */ z3.number().int().refine((v) => v === 0 || v >= ROTATION_INTERVAL_MIN_S && v <= ROTATION_INTERVAL_MAX_S, {
    message: `interval_s must be 0 (sticky) or ${ROTATION_INTERVAL_MIN_S}..${ROTATION_INTERVAL_MAX_S}`
  })
});

import { z as z4 } from "zod";
var Pct = /* @__PURE__ */ z4.number().min(0).max(100);
var PassportCarrier = /* @__PURE__ */ z4.object({
  name: /* @__PURE__ */ z4.string().min(1),
  mcc_mnc: MccMnc,
  asn: /* @__PURE__ */ z4.string().nullable(),
  gateway_region: /* @__PURE__ */ z4.string().nullable(),
  ip_stack: IpStack
});
var PassportEgress = /* @__PURE__ */ z4.object({
  v4: /* @__PURE__ */ z4.string().nullable(),
  v6_prefix: /* @__PURE__ */ z4.string().nullable(),
  v4_is_nat64: /* @__PURE__ */ z4.boolean(),
  ip_since: IsoDateTime
});
var GeoSource = /* @__PURE__ */ z4.object({
  provider: /* @__PURE__ */ z4.string().min(1),
  country: /* @__PURE__ */ z4.string().nullable(),
  region: /* @__PURE__ */ z4.string().nullable(),
  city: /* @__PURE__ */ z4.string().nullable()
});
var PassportGeo = /* @__PURE__ */ z4.object({
  country: /* @__PURE__ */ z4.string().nullable(),
  region: /* @__PURE__ */ z4.string().nullable(),
  city: /* @__PURE__ */ z4.string().nullable(),
  sources: /* @__PURE__ */ z4.array(GeoSource)
});
var PassportReputation = /* @__PURE__ */ z4.object({
  flagged: /* @__PURE__ */ z4.boolean(),
  hosting: /* @__PURE__ */ z4.boolean(),
  providers: /* @__PURE__ */ z4.array(/* @__PURE__ */ z4.string()),
  scored_at: /* @__PURE__ */ IsoDateTime.nullable()
});
var PassportRotation = /* @__PURE__ */ z4.object({
  interval_s: /* @__PURE__ */ z4.number().int().min(0),
  sticky_until: /* @__PURE__ */ IsoDateTime.nullable(),
  last_rotation_at: /* @__PURE__ */ IsoDateTime.nullable(),
  last_30d: /* @__PURE__ */ z4.object({
    count: /* @__PURE__ */ z4.number().int().min(0),
    first_attempt_success_pct: /* @__PURE__ */ Pct.nullable(),
    p50_ms: /* @__PURE__ */ z4.number().min(0).nullable()
  })
});
var Passport = /* @__PURE__ */ z4.object({
  port_id: /* @__PURE__ */ idSchema("prt"),
  generated_at: IsoDateTime,
  site_code: /* @__PURE__ */ z4.string().min(1),
  country: CountryCode,
  operator: Operator,
  evidence: /* @__PURE__ */ z4.enum(["signed", "observed"]).optional(),
  network: /* @__PURE__ */ PortNetwork.optional(),
  carrier: PassportCarrier,
  sim_contract_class: ContractType,
  egress: PassportEgress,
  geo: PassportGeo,
  reputation: PassportReputation,
  rotation: PassportRotation,
  uptime: /* @__PURE__ */ z4.object({
    d30_pct: /* @__PURE__ */ Pct.nullable(),
    d90_pct: /* @__PURE__ */ Pct.nullable(),
    probes_30d: /* @__PURE__ */ z4.number().int().min(0)
  }),
  throughput: /* @__PURE__ */ z4.object({
    last_sample_mbps: /* @__PURE__ */ z4.number().min(0).nullable(),
    p50_7d_mbps: /* @__PURE__ */ z4.number().min(0).nullable()
  }),
  usage: /* @__PURE__ */ z4.object({ bytes_today: /* @__PURE__ */ z4.number().int().min(0), cap_bytes: /* @__PURE__ */ z4.number().int().min(0) }),
  sessions: /* @__PURE__ */ z4.object({ concurrent_now: /* @__PURE__ */ z4.number().int().min(0), peak_24h: /* @__PURE__ */ z4.number().int().min(0) }),
  ip_shared_with_own_ports: /* @__PURE__ */ z4.number().int().min(0),
  exclusivity: /* @__PURE__ */ z4.literal(EXCLUSIVITY),
  receipts_url: /* @__PURE__ */ z4.string().url()
});

import { z as z5 } from "zod";
var ReceiptGeo = /* @__PURE__ */ z5.object({
  country: /* @__PURE__ */ z5.string().nullable(),
  region: /* @__PURE__ */ z5.string().nullable(),
  sources: /* @__PURE__ */ z5.number().int().min(0)
});
var ReceiptReputation = /* @__PURE__ */ z5.object({
  flagged: /* @__PURE__ */ z5.boolean(),
  hosting: /* @__PURE__ */ z5.boolean(),
  scored_at: /* @__PURE__ */ IsoDateTime.nullable()
});
var ReceiptUnsigned = /* @__PURE__ */ z5.object({
  id: /* @__PURE__ */ idSchema("rot"),
  port_id: /* @__PURE__ */ idSchema("prt"),
  site_code: /* @__PURE__ */ z5.string().min(1),
  requested_by: RequestedBy,
  old_ip4: /* @__PURE__ */ z5.string().nullable(),
  new_ip4: /* @__PURE__ */ z5.string().nullable(),
  old_ip6_prefix: /* @__PURE__ */ z5.string().nullable(),
  new_ip6_prefix: /* @__PURE__ */ z5.string().nullable(),
  v4_is_nat64: /* @__PURE__ */ z5.boolean(),
  rotated: /* @__PURE__ */ z5.boolean(),
  attempts: /* @__PURE__ */ z5.number().int().min(0),
  elapsed_ms: /* @__PURE__ */ z5.number().int().min(0),
  reason: RotationReason,
  driver: /* @__PURE__ */ z5.string().min(1),
  carrier: /* @__PURE__ */ z5.string().min(1),
  mcc_mnc: MccMnc,
  asn: /* @__PURE__ */ z5.string().nullable(),
  geo: ReceiptGeo,
  reputation: /* @__PURE__ */ ReceiptReputation.nullable(),
  sticky_window_s: /* @__PURE__ */ z5.number().int().min(0),
  ip_shared_with_own_ports: /* @__PURE__ */ z5.number().int().min(0),
  sim_contract_class: ContractType,
  signed_at: IsoDateTime,
  key_id: /* @__PURE__ */ z5.string().regex(/^[a-z0-9-]+-\d{4}$/, "<site_code>-<yyyy>"),
  attestation: /* @__PURE__ */ z5.enum(["signed", "observed"]).optional()
});
var Receipt = /* @__PURE__ */ ReceiptUnsigned.extend({
  sig: /* @__PURE__ */ z5.string().regex(/^[A-Za-z0-9+/]+={0,2}$/, "base64").min(86)
});

import { z as z9 } from "zod";

import { z as z8 } from "zod";

import { z as z6 } from "zod";
var ProductKind = /* @__PURE__ */ z6.enum(PRODUCT_KINDS);
var ProductTerm = /* @__PURE__ */ z6.enum(PRODUCT_TERMS);
var CustomerSupplyKind = /* @__PURE__ */ z6.enum(CUSTOMER_SUPPLY_KINDS);
var SupplyHealth = /* @__PURE__ */ z6.enum(["ok", "degraded", "down", "unknown"]);
var OrderStatus = /* @__PURE__ */ z6.enum(ORDER_STATUSES);
var OrderItemStatus = /* @__PURE__ */ z6.enum(["pending", "provisioning", "fulfilled", "failed", "refunded", "held"]);
var PaymentMethod = /* @__PURE__ */ z6.enum(PAYMENT_METHODS);
var PriceTier = /* @__PURE__ */ z6.object({ min_qty: /* @__PURE__ */ z6.number().int().min(1).max(1e5), unit_cents: Cents });
var SkuSnapshot = /* @__PURE__ */ z6.object({
  sku: ProductSku,
  kind: ProductKind,
  title: /* @__PURE__ */ z6.string().min(1),
  country: /* @__PURE__ */ CountryCode.nullable(),
  carrier_hint: /* @__PURE__ */ z6.string().nullable(),
  term: ProductTerm,
  sell_cents: Cents,
  currency: Currency,
  evidence: Evidence,
  operator_label: /* @__PURE__ */ z6.string().min(1),
  supply_kind: CustomerSupplyKind
});

import { z as z7 } from "zod";

var ORDER_NUMBER_RE = /^PP-\d{4}-\d{6,}$/;

var OrderNumber = /* @__PURE__ */ z7.string().regex(ORDER_NUMBER_RE, "PP-YYYY-NNNNNN");
var ANALYTICS_REF_RE = /^[0-9a-f]{20}$/;
var FulfilmentCredentials = /* @__PURE__ */ z7.object({
  host: /* @__PURE__ */ z7.string().min(1),
  http_port: /* @__PURE__ */ z7.number().int().positive().nullable(),
  socks_port: /* @__PURE__ */ z7.number().int().positive().nullable(),
  username: /* @__PURE__ */ z7.string().min(1),
  password: /* @__PURE__ */ z7.string().min(1),
  expires_at: /* @__PURE__ */ IsoDateTime.nullable(),
  http: /* @__PURE__ */ ProxyCredentialDto.optional(),
  socks5: /* @__PURE__ */ ProxyCredentialDto.optional()
});
var OrderItemUnit = /* @__PURE__ */ z7.object({
  unit: /* @__PURE__ */ z7.number().int().min(1),
  port_id: /* @__PURE__ */ idSchema("prt"),
  resource_url: /* @__PURE__ */ z7.string().nullable(),
  credentials: /* @__PURE__ */ FulfilmentCredentials.nullable()
});
var OrderItem = /* @__PURE__ */ z7.object({
  id: /* @__PURE__ */ idSchema("oi"),
  product_id: /* @__PURE__ */ idSchema("prod"),
  sku_snapshot: SkuSnapshot,
  quantity: /* @__PURE__ */ z7.number().int().min(1),
  unit_cents: Cents,
  total_cents: Cents,
  status: OrderItemStatus,
  fulfilment_ref: /* @__PURE__ */ z7.string().nullable(),
  attempts: /* @__PURE__ */ z7.number().int().min(0),
  last_error: /* @__PURE__ */ z7.string().nullable().optional(),
  customer_reason: /* @__PURE__ */ z7.string().nullable().optional(),
  resource_url: /* @__PURE__ */ z7.string().nullable(),
  credentials: /* @__PURE__ */ FulfilmentCredentials.nullable(),
  units: /* @__PURE__ */ z7.array(OrderItemUnit).optional(),
  updated_at: IsoDateTime
});
var Order = /* @__PURE__ */ z7.object({
  id: /* @__PURE__ */ idSchema("ord"),
  number: OrderNumber,
  customer_id: /* @__PURE__ */ idSchema("cus"),
  org_id: /* @__PURE__ */ idSchema("org"),
  status: OrderStatus,
  subtotal_cents: Cents,
  discount_cents: Cents,
  vat_rate_bps: /* @__PURE__ */ z7.number().int().min(0).max(1e4),
  vat_cents: Cents,
  total_cents: Cents,
  currency: Currency,
  payment_method: PaymentMethod,
  coupon_code: /* @__PURE__ */ z7.string().nullable(),
  items: /* @__PURE__ */ z7.array(OrderItem),
  paid_at: /* @__PURE__ */ IsoDateTime.nullable(),
  notes: /* @__PURE__ */ z7.string().nullable(),
  invoice_url: /* @__PURE__ */ z7.string().nullable(),
  payment_url: /* @__PURE__ */ z7.string().url().nullable().optional(),
  analytics_ref: /* @__PURE__ */ z7.string().regex(ANALYTICS_REF_RE).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime
});

var TrafficProtocolName = /* @__PURE__ */ z8.enum(TRAFFIC_PROTOCOLS);
var TrafficCredentials = /* @__PURE__ */ z8.object({
  host: /* @__PURE__ */ z8.string().min(1),
  http_port: /* @__PURE__ */ z8.number().int().positive(),
  socks_port: /* @__PURE__ */ z8.number().int().positive(),
  username_base: /* @__PURE__ */ z8.string().min(1),
  password: /* @__PURE__ */ z8.string().min(1)
});
var TrafficStatus = /* @__PURE__ */ z8.enum(["none", "active", "exhausted", "expired", "suspended"]);
var TrafficLimits = /* @__PURE__ */ z8.object({
  validity_days: /* @__PURE__ */ z8.number().int().min(0),
  kyb_tier: /* @__PURE__ */ z8.string(),
  t0_monthly_gb_cap: /* @__PURE__ */ z8.number().min(0),
  gb_bought_30d: /* @__PURE__ */ z8.number().min(0),
  gb_remaining_30d: /* @__PURE__ */ z8.number().min(0).nullable(),
  trial_available: /* @__PURE__ */ z8.boolean(),
  max_order_gb: /* @__PURE__ */ z8.number().int().min(1)
});
var TrafficInfo = /* @__PURE__ */ z8.object({
  id: /* @__PURE__ */ idSchema("pool").nullable(),
  status: TrafficStatus,
  gb_total: /* @__PURE__ */ z8.number().min(0),
  gb_used: /* @__PURE__ */ z8.number().min(0),
  gb_left: /* @__PURE__ */ z8.number().min(0),
  expires_at: /* @__PURE__ */ IsoDateTime.nullable(),
  enabled: /* @__PURE__ */ z8.boolean(),
  last_synced_at: /* @__PURE__ */ IsoDateTime.nullable(),
  credentials: /* @__PURE__ */ TrafficCredentials.nullable(),
  usage_daily: /* @__PURE__ */ z8.array(/* @__PURE__ */ z8.object({ date: /* @__PURE__ */ z8.string().regex(/^\d{4}-\d{2}-\d{2}$/), gb: /* @__PURE__ */ z8.number().min(0) })),
  limits: TrafficLimits
});
var TrafficCountryRow = /* @__PURE__ */ z8.object({
  country: /* @__PURE__ */ z8.string().length(2),
  name: /* @__PURE__ */ z8.string().min(1),
  online: /* @__PURE__ */ z8.number().int().min(0)
});
var TrafficCountries = /* @__PURE__ */ z8.object({
  mobile: /* @__PURE__ */ z8.array(TrafficCountryRow),
  residential: /* @__PURE__ */ z8.array(TrafficCountryRow),
  totals: /* @__PURE__ */ z8.object({ mobile_online: /* @__PURE__ */ z8.number().int().min(0), residential_online: /* @__PURE__ */ z8.number().int().min(0), countries: /* @__PURE__ */ z8.number().int().min(0) }),
  generated_at: IsoDateTime,
  stale: /* @__PURE__ */ z8.boolean()
});
var BuildUrlResult = /* @__PURE__ */ z8.object({
  host: /* @__PURE__ */ z8.string().min(1),
  port: /* @__PURE__ */ z8.number().int().positive(),
  protocol: TrafficProtocolName,
  username: /* @__PURE__ */ z8.string().min(1),
  session: /* @__PURE__ */ z8.string().nullable(),
  url: /* @__PURE__ */ z8.string().min(1),
  url_masked: /* @__PURE__ */ z8.string().min(1),
  snippets: /* @__PURE__ */ z8.object({ curl: /* @__PURE__ */ z8.string(), python: /* @__PURE__ */ z8.string(), node: /* @__PURE__ */ z8.string(), playwright: /* @__PURE__ */ z8.string() })
});
var TrafficTestResult = /* @__PURE__ */ z8.object({
  ok: /* @__PURE__ */ z8.boolean(),
  exit_country: /* @__PURE__ */ z8.string().nullable(),
  country_verified: /* @__PURE__ */ z8.boolean(),
  exit_ip: /* @__PURE__ */ z8.string().nullable(),
  latency_ms: /* @__PURE__ */ z8.number().int().min(0).nullable(),
  error_code: /* @__PURE__ */ z8.string().optional(),
  simulated: /* @__PURE__ */ z8.boolean().optional()
});
var TrafficBuyResponse = /* @__PURE__ */ z8.object({ order: Order, payment_id: /* @__PURE__ */ idSchema("pay") });
var TrafficPricing = /* @__PURE__ */ z8.object({
  sku: /* @__PURE__ */ z8.string().min(1),
  currency: /* @__PURE__ */ z8.literal("EUR"),
  tiers: /* @__PURE__ */ z8.array(PriceTier),
  packages_gb: /* @__PURE__ */ z8.array(/* @__PURE__ */ z8.number().int().min(1)),
  max_order_gb: /* @__PURE__ */ z8.number().int().min(1),
  validity_days: /* @__PURE__ */ z8.number().int().min(0),
  t0_monthly_gb_cap: /* @__PURE__ */ z8.number().min(0),
  trial: /* @__PURE__ */ z8.object({ sku: /* @__PURE__ */ z8.string().min(1), gb: /* @__PURE__ */ z8.number().positive(), price_cents: Cents }).nullable(),
  available: /* @__PURE__ */ z8.boolean()
});

var PricingSku = /* @__PURE__ */ z9.object({
  sku: /* @__PURE__ */ z9.string().min(1),
  country: CountryCode,
  operator: Operator,
  term: PricingTerm,
  price_cents: Cents,
  currency: Currency,
  floor_cents: /* @__PURE__ */ Cents.optional(),
  evidence: Evidence,
  buy_via: /* @__PURE__ */ z9.enum(["ports", "cart"]),
  terms: /* @__PURE__ */ z9.object({ monthly: Cents, weekly: Cents, daily: Cents }).optional()
});
var LadderRung = /* @__PURE__ */ z9.object({ min_ports: /* @__PURE__ */ z9.number().int().min(1), discount_pct: /* @__PURE__ */ z9.number().min(0).max(100) });
var PricingResponse = /* @__PURE__ */ z9.object({
  currency_note: /* @__PURE__ */ z9.string(),
  updated_at: IsoDateTime,
  skus: /* @__PURE__ */ z9.array(PricingSku),
  ladder: /* @__PURE__ */ z9.array(LadderRung),
  term_ratios: /* @__PURE__ */ z9.object({ weekly: /* @__PURE__ */ z9.number().min(0).max(1), daily: /* @__PURE__ */ z9.number().min(0).max(1) }),
  trial: /* @__PURE__ */ z9.object({ price_cents: Cents, hours: /* @__PURE__ */ z9.number().int().min(1) }),
  traffic: /* @__PURE__ */ TrafficPricing.nullable().optional()
});
var InventoryItem = /* @__PURE__ */ z9.object({
  country: CountryCode,
  site_code: /* @__PURE__ */ z9.string().min(1),
  operator: Operator,
  carrier: /* @__PURE__ */ z9.string().min(1),
  carrier_id: /* @__PURE__ */ idSchema("car"),
  available: /* @__PURE__ */ z9.number().int().min(0),
  telemetry_hours_min: /* @__PURE__ */ z9.number().int().min(0).default(TELEMETRY_HOURS_MIN),
  waitlist: /* @__PURE__ */ z9.boolean()
});
var InventoryResponse = /* @__PURE__ */ z9.object({ data: /* @__PURE__ */ z9.array(InventoryItem) });
var QuoteResponse = /* @__PURE__ */ z9.object({
  unit_cents: Cents,
  discount_pct: /* @__PURE__ */ z9.number().min(0).max(100),
  total_cents: Cents,
  currency: Currency
});

import { z as z10 } from "zod";
var Pct2 = /* @__PURE__ */ z10.number().min(0).max(100);
var Incident = /* @__PURE__ */ z10.object({
  id: /* @__PURE__ */ idSchema("inc"),
  scope: IncidentScope,
  scope_id: /* @__PURE__ */ z10.string().nullable(),
  title: /* @__PURE__ */ z10.string().min(1),
  cause: /* @__PURE__ */ z10.string().nullable(),
  started_at: IsoDateTime,
  resolved_at: /* @__PURE__ */ IsoDateTime.nullable(),
  sla_excluded: /* @__PURE__ */ z10.boolean(),
  public: /* @__PURE__ */ z10.boolean()
});
var StatusSite = /* @__PURE__ */ z10.object({
  code: /* @__PURE__ */ z10.string().min(1),
  country: CountryCode,
  operator: Operator,
  status: SiteStatus,
  ports_live: /* @__PURE__ */ z10.number().int().min(0),
  uptime_30d_pct: /* @__PURE__ */ Pct2.nullable()
});
var StatusCarrier = /* @__PURE__ */ z10.object({
  id: /* @__PURE__ */ idSchema("car"),
  name: /* @__PURE__ */ z10.string().min(1),
  country: CountryCode,
  uptime_30d_pct: /* @__PURE__ */ Pct2.nullable(),
  rotation_first_attempt_pct: /* @__PURE__ */ Pct2.nullable(),
  rotation_p50_ms: /* @__PURE__ */ z10.number().min(0).nullable(),
  rotation_floor_pct: /* @__PURE__ */ Pct2.nullable()
});
var StatusResponse = /* @__PURE__ */ z10.object({
  updated_at: IsoDateTime,
  platform: PlatformStatus,
  sites: /* @__PURE__ */ z10.array(StatusSite),
  carriers: /* @__PURE__ */ z10.array(StatusCarrier),
  incidents: /* @__PURE__ */ z10.array(Incident),
  support: /* @__PURE__ */ z10.object({ median_first_response_min_30d: /* @__PURE__ */ z10.number().min(0).nullable() }),
  traffic: /* @__PURE__ */ z10.object({
    health: /* @__PURE__ */ SupplyHealth.nullable(),
    last_sync_at: /* @__PURE__ */ IsoDateTime.nullable(),
    countries_generated_at: /* @__PURE__ */ IsoDateTime.nullable()
  })
});
var WellKnownKey = /* @__PURE__ */ z10.object({
  key_id: /* @__PURE__ */ z10.string().min(1),
  site_code: /* @__PURE__ */ z10.string().min(1),
  alg: /* @__PURE__ */ z10.literal(RECEIPT_ALG),
  public_key_b64: /* @__PURE__ */ z10.string().min(1),
  valid_from: IsoDateTime,
  valid_to: IsoDateTime
});
var WellKnownKeys = /* @__PURE__ */ z10.object({ keys: /* @__PURE__ */ z10.array(WellKnownKey) });

import { z as z11 } from "zod";
var UsageGranularity = /* @__PURE__ */ z11.enum(["minute", "hour", "day"]);
var UsagePoint = /* @__PURE__ */ z11.object({
  ts: IsoDateTime,
  bytes_in: /* @__PURE__ */ z11.number().int().min(0),
  bytes_out: /* @__PURE__ */ z11.number().int().min(0),
  sessions_peak: /* @__PURE__ */ z11.number().int().min(0),
  conns_new: /* @__PURE__ */ z11.number().int().min(0),
  rotations: /* @__PURE__ */ z11.number().int().min(0)
});
var UsageResponse = /* @__PURE__ */ z11.object({ data: /* @__PURE__ */ z11.array(UsagePoint) });

import { z as z12 } from "zod";
var ProblemDetails = /* @__PURE__ */ z12.object({
  type: /* @__PURE__ */ z12.string().url().or(/* @__PURE__ */ z12.literal("about:blank")),
  title: /* @__PURE__ */ z12.string(),
  status: /* @__PURE__ */ z12.number().int().min(100).max(599),
  detail: /* @__PURE__ */ z12.string().optional(),
  instance: /* @__PURE__ */ z12.string().optional(),
  code: /* @__PURE__ */ z12.string().min(1),
  retry_after: /* @__PURE__ */ z12.number().int().min(0).optional(),
  errors: /* @__PURE__ */ z12.array(/* @__PURE__ */ z12.object({ path: /* @__PURE__ */ z12.string(), message: /* @__PURE__ */ z12.string() })).optional(),
  current_revision: /* @__PURE__ */ z12.number().int().min(1).optional()
});

import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
function canonicalize(value) {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value) {
  if (Array.isArray(value))
    return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const src = value;
    const out = {};
    for (const key of Object.keys(src).sort()) {
      if (key === "sig")
        continue;
      const v = src[key];
      if (v === void 0)
        continue;
      out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}
var SPKI_PREFIX = /* @__PURE__ */ Buffer.from("302a300506032b6570032100", "hex");
function toPublicKey(key) {
  if (typeof key === "object" && !(key instanceof Uint8Array))
    return key;
  if (typeof key === "string" && key.includes("-----BEGIN"))
    return createPublicKey(key);
  const raw = typeof key === "string" ? Buffer.from(key, "base64") : Buffer.from(key);
  if (raw.length === 32)
    return createPublicKey({ key: Buffer.concat([SPKI_PREFIX, raw]), format: "der", type: "spki" });
  return createPublicKey({ key: raw, format: "der", type: "spki" });
}
function verifyReceipt(receipt, publicKey) {
  const parsed = Receipt.safeParse(receipt);
  if (!parsed.success)
    return false;
  try {
    const { sig, ...unsigned } = parsed.data;
    return verify(null, Buffer.from(canonicalize(unsigned), "utf8"), toPublicKey(publicKey), Buffer.from(sig, "base64"));
  } catch {
    return false;
  }
}
function verifyReceiptWithKeys(receipt, keys) {
  const parsed = Receipt.safeParse(receipt);
  if (!parsed.success)
    return { ok: false, key_id: null, reason: "invalid_receipt" };
  const key = keys.find((k) => k.key_id === parsed.data.key_id);
  if (!key)
    return { ok: false, key_id: parsed.data.key_id, reason: "unknown_key" };
  const ok = verifyReceipt(parsed.data, key.public_key_b64);
  return { ok, key_id: key.key_id, reason: ok ? "ok" : "bad_signature" };
}

var SERVER_NAME = "portproof";
var SERVER_VERSION = "0.2.1";
var USER_AGENT = `portproof-mcp/${SERVER_VERSION}`;
var DEFAULT_API_URL = "https://api.portproof.org";
var DEFAULT_TIMEOUT_MS = 3e4;
var ROTATE_TIMEOUT_MS = 2e5;
var ROTATION_POLL_INTERVAL_MS = 5e3;
var ROTATION_TOTAL_WAIT_MS = 18e4;
function normaliseBaseUrl(raw) {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  const origin = trimmed === "" ? DEFAULT_API_URL : trimmed;
  return origin.endsWith("/v1") ? origin : `${origin}/v1`;
}
function shopOrigin(baseUrl) {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return null;
  }
  if (!url.hostname.startsWith("api.")) return null;
  const port = url.port === "" ? "" : `:${url.port}`;
  return `${url.protocol}//${url.hostname.slice("api.".length)}${port}`;
}
function loadConfig(env = process.env) {
  const key = env.PORTPROOF_API_KEY?.trim();
  return {
    baseUrl: normaliseBaseUrl(env.PORTPROOF_API_URL),
    apiKey: key === void 0 || key === "" ? void 0 : key
  };
}

var ApiProblemError = class _ApiProblemError extends Error {
  body;
  constructor(body) {
    super(body.detail ? `${body.code}: ${body.detail}` : `${body.code}: ${body.title}`);
    this.name = "ApiProblemError";
    this.body = body;
  }
  get code() {
    return this.body.code;
  }
  get status() {
    return this.body.status;
  }
  static local(code, title, detail, status = 0) {
    const body = { code, status, title };
    if (detail !== void 0) body.detail = detail;
    return new _ApiProblemError(body);
  }
  static fromResponse(status, json, rawText, url) {
    const parsed = ProblemDetails.safeParse(json);
    if (parsed.success) {
      const p = parsed.data;
      const body = { code: p.code, status: p.status, title: p.title };
      if (p.detail !== void 0) body.detail = p.detail;
      if (p.instance !== void 0) body.instance = p.instance;
      if (p.retry_after !== void 0) body.retry_after = p.retry_after;
      if (p.errors !== void 0) body.errors = p.errors;
      return new _ApiProblemError(body);
    }
    if (json && typeof json === "object" && typeof json.code === "string") {
      const j = json;
      const body = {
        code: j.code,
        status,
        title: typeof j.title === "string" ? j.title : `HTTP ${status}`
      };
      if (typeof j.detail === "string") body.detail = j.detail;
      if (typeof j.retry_after === "number") body.retry_after = j.retry_after;
      return new _ApiProblemError(body);
    }
    const snippet = rawText.length > 200 ? `${rawText.slice(0, 200)}\u2026` : rawText;
    return new _ApiProblemError({
      code: "http_error",
      status,
      title: `HTTP ${status}`,
      detail: `Non-problem+json response from ${url}${snippet ? `: ${snippet}` : ""}`
    });
  }
  static fromTransport(err, url, timeoutMs) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return _ApiProblemError.local(
        "timeout",
        "API request timed out",
        `${url} did not respond within ${timeoutMs} ms`
      );
    }
    const cause = err instanceof Error ? err.cause instanceof Error ? err.cause.message : err.message : String(err);
    return _ApiProblemError.local(
      "api_unreachable",
      "Portproof API unreachable",
      `Could not reach ${url} (${cause}). Is the API running? Check PORTPROOF_API_URL.`
    );
  }
};

var PortPage = paginated(Port);
function apiOrigin(baseUrl) {
  return baseUrl.replace(/\/+$/, "").replace(/\/v1$/, "");
}
var ApiClient = class {
  baseUrl;
  wellKnownKeysUrl;
  shopOrigin;
  hasApiKey;
  apiKey;
  fetchImpl;
  timeoutMs;
  warn;
  constructor(opts) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.wellKnownKeysUrl = apiOrigin(this.baseUrl) + WELL_KNOWN_KEYS_PATH;
    this.shopOrigin = shopOrigin(this.baseUrl);
    this.apiKey = opts.apiKey;
    this.hasApiKey = Boolean(opts.apiKey);
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.warn = opts.warn ?? ((m) => console.error(`[portproof-mcp] ${m}`));
  }
  async request(method, path, opts = {}) {
    const url = new URL((opts.root ? apiOrigin(this.baseUrl) : this.baseUrl) + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== void 0) url.searchParams.set(k, String(v));
    }
    const headers = {
      accept: "application/json, application/problem+json",
      "user-agent": USER_AGENT
    };
    const auth = opts.auth ?? "required";
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    else if (auth === "required") {
      throw ApiProblemError.local(
        "config_missing",
        "PORTPROOF_API_KEY is not set",
        "This tool needs a customer API key. Set PORTPROOF_API_KEY (pk_test_... or pk_live_...) in the MCP server environment."
      );
    }
    if (opts.body !== void 0) headers["content-type"] = "application/json";
    if (opts.idempotencyKey !== void 0) headers["idempotency-key"] = opts.idempotencyKey;
    const timeoutMs = opts.timeoutMs ?? this.timeoutMs;
    let res;
    try {
      res = await this.fetchImpl(url, {
        method,
        headers,
        body: opts.body !== void 0 ? JSON.stringify(opts.body) : void 0,
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (err) {
      throw ApiProblemError.fromTransport(err, url.toString(), timeoutMs);
    }
    const text = await res.text();
    const json = parseJson(text);
    if (!res.ok) throw ApiProblemError.fromResponse(res.status, json, text, url.toString());
    return { status: res.status, data: json };
  }
  lenient(schema, data, label) {
    const parsed = schema.safeParse(data);
    if (parsed.success) return parsed.data;
    const first = parsed.error.issues[0];
    this.warn(
      `${label}: response does not match the shared schema (${first ? `${first.path.join(".") || "<root>"}: ${first.message}` : "unknown issue"}); passing it through`
    );
    return data;
  }
  async getPricing() {
    const r = await this.request("GET", "/pricing", { auth: "optional" });
    return this.lenient(PricingResponse, r.data, "GET /pricing");
  }
  async getInventory(query) {
    const r = await this.request("GET", "/inventory", { query, auth: "optional" });
    return this.lenient(InventoryResponse, r.data, "GET /inventory");
  }
  async postQuote(body) {
    const r = await this.request("POST", "/quotes", {
      body,
      auth: "optional",
      idempotencyKey: `quote-${randomUUID()}`
    });
    return this.lenient(QuoteResponse, r.data, "POST /quotes");
  }
  async getStatus() {
    const r = await this.request("GET", "/status", { auth: "optional" });
    return this.lenient(StatusResponse, r.data, "GET /status");
  }
  async getWellKnownKeys() {
    const r = await this.request("GET", WELL_KNOWN_KEYS_PATH, { auth: "optional", root: true });
    return this.lenient(WellKnownKeys, r.data, `GET ${WELL_KNOWN_KEYS_PATH}`);
  }
  async listPorts(query) {
    const r = await this.request("GET", "/ports", { query });
    return this.lenient(PortPage, r.data, "GET /ports");
  }
  async getPort(portId) {
    const r = await this.request("GET", `/ports/${encodeURIComponent(portId)}`);
    return this.lenient(Port, r.data, "GET /ports/{id}");
  }
  async createPort(body, idempotencyKey) {
    const r = await this.request("POST", "/ports", { body, idempotencyKey });
    return { status: r.status, data: this.lenient(Port, r.data, "POST /ports") };
  }
  async rotatePort(portId, idempotencyKey) {
    const r = await this.request("POST", `/ports/${encodeURIComponent(portId)}/rotate`, {
      body: { wait: true },
      idempotencyKey,
      timeoutMs: ROTATE_TIMEOUT_MS
    });
    return this.rotationOutcome(r, "POST /ports/{id}/rotate");
  }
  async getRotationStatus(portId, rotationId) {
    const r = await this.request(
      "GET",
      `/ports/${encodeURIComponent(portId)}/rotation/${encodeURIComponent(rotationId)}`
    );
    return this.rotationOutcome(r, "GET /ports/{id}/rotation/{rotation_id}");
  }
  rotationOutcome(r, label) {
    if (r.status === 202) {
      return {
        kind: "pending",
        pending: this.lenient(RotatePendingResponse, r.data, `${label} 202`)
      };
    }
    return { kind: "receipt", receipt: this.lenient(Receipt, r.data, label) };
  }
  async renewPort(portId, idempotencyKey) {
    const r = await this.request("POST", `/ports/${encodeURIComponent(portId)}/renew`, {
      idempotencyKey
    });
    return this.lenient(Subscription, r.data, "POST /ports/{id}/renew");
  }
  async setAutoRenew(portId, enabled, idempotencyKey) {
    const r = await this.request("PUT", `/ports/${encodeURIComponent(portId)}/auto-renew`, {
      body: { enabled },
      idempotencyKey
    });
    return this.lenient(Subscription, r.data, "PUT /ports/{id}/auto-renew");
  }
  async setRotationSchedule(portId, intervalS, idempotencyKey) {
    const r = await this.request("PUT", `/ports/${encodeURIComponent(portId)}/rotation`, {
      body: { interval_s: intervalS },
      idempotencyKey
    });
    return this.lenient(Port, r.data, "PUT /ports/{id}/rotation");
  }
  async getPassport(portId) {
    const r = await this.request("GET", `/ports/${encodeURIComponent(portId)}/passport`, {
      query: { format: "json" }
    });
    return this.lenient(Passport, r.data, "GET /ports/{id}/passport");
  }
  async getReceipt(receiptId) {
    const r = await this.request("GET", `/receipts/${encodeURIComponent(receiptId)}`);
    return this.lenient(Receipt, r.data, "GET /receipts/{id}");
  }
  async getTraffic() {
    const r = await this.request("GET", "/traffic");
    return this.lenient(TrafficInfo, r.data, "GET /traffic");
  }
  async getTrafficCountries() {
    const r = await this.request("GET", "/traffic/countries", { auth: "optional" });
    return this.lenient(TrafficCountries, r.data, "GET /traffic/countries");
  }
  async buildProxyUrl(body) {
    const r = await this.request("POST", "/traffic/build-url", { body });
    return this.lenient(BuildUrlResult, r.data, "POST /traffic/build-url");
  }
  async testConnection(body) {
    const r = await this.request("POST", "/traffic/test", { body });
    return this.lenient(TrafficTestResult, r.data, "POST /traffic/test");
  }
  async buyTraffic(body, idempotencyKey) {
    const r = await this.request("POST", "/traffic/buy", { body, idempotencyKey });
    return this.lenient(TrafficBuyResponse, r.data, "POST /traffic/buy");
  }
  async getUsage(query) {
    const r = await this.request("GET", "/usage", { query });
    return this.lenient(UsageResponse, r.data, "GET /usage");
  }
};
function parseJson(text) {
  if (text.trim() === "") return void 0;
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z as z13 } from "zod";
var IdempotencyKey = z13.string().min(1).max(255).regex(/^[\x21-\x7e]+$/, "printable ASCII without whitespace");
var ConfirmFields = {
  confirm: z13.boolean().describe(
    "Must be exactly true. Set it only after the user has agreed to this specific action."
  ),
  idempotency_key: IdempotencyKey.describe(
    "Caller-chosen unique key (e.g. a UUID). Re-sending the same key with the same input replays the stored result instead of acting twice."
  )
};
var Confirmation = z13.object(ConfirmFields);
var SearchInventoryInput = z13.object({
  country: CountryCode.optional().describe('ISO-3166 alpha-2, e.g. "LT"'),
  carrier: z13.string().min(1).optional().describe("Carrier name filter, exactly as search_inventory returns it")
});
var PortSku = ProductSku.describe('SKU from get_pricing (field skus), e.g. "lt-4g"');
var QuoteInput = z13.object({
  sku: PortSku,
  term: Term,
  quantity: z13.number().int().min(1).max(1e3)
});
var BuyPortInput = z13.object({
  sku: PortSku,
  term: Term,
  carrier_id: idSchema("car").optional().describe("Pin a carrier (from search_inventory); omit for any"),
  auto_renew: z13.boolean().optional(),
  ...ConfirmFields
});
var ListPortsInput = z13.object({
  limit: z13.number().int().min(1).max(200).optional().describe("Page size, default 50"),
  cursor: z13.string().min(1).optional().describe("next_cursor from the previous page")
});
var PortIdInput = z13.object({ port_id: idSchema("prt") });
var RotateInput = z13.object({
  port_id: idSchema("prt"),
  ...ConfirmFields
});
var RenewPortInput = z13.object({
  port_id: idSchema("prt"),
  ...ConfirmFields
});
var SetAutoRenewInput = z13.object({
  port_id: idSchema("prt"),
  enabled: z13.boolean().describe(
    "true = renew from the account balance before the term ends; false = the port ends at the end of its term"
  ),
  ...ConfirmFields
});
var SetRotationScheduleInput = z13.object({
  port_id: idSchema("prt"),
  interval_s: z13.number().int().refine((v) => v === 0 || v >= ROTATION_INTERVAL_MIN_S && v <= ROTATION_INTERVAL_MAX_S, {
    message: `interval_s must be 0 (sticky) or ${ROTATION_INTERVAL_MIN_S}..${ROTATION_INTERVAL_MAX_S}`
  }).describe(
    "0 = sticky (no scheduled rotation), otherwise seconds between rotations (60..86400)"
  ),
  ...ConfirmFields
});
var ReceiptIdInput = z13.object({
  receipt_id: idSchema("rot").describe("Rotation record id (equals the rotation id, rot_...)")
});
var GetUsageInput = z13.object({
  port_id: idSchema("prt"),
  from: IsoDateTime.optional().describe("ISO 8601 UTC, default: API default window"),
  to: IsoDateTime.optional(),
  granularity: UsageGranularity.optional().describe("minute | hour | day (default hour)")
});
var EmptyInput = z13.object({});
var MOBILE_COUNTRIES_TEXT = TRAFFIC_MOBILE_COUNTRIES.map((c) => c === "GE" ? "GE = Georgia (country)" : c).join(", ");
var TrafficPoolField = z13.enum(["mobile", "residential", "best"]).describe(`mobile = 4G/5G carrier modems (${MOBILE_COUNTRIES_TEXT}); residential = opt-in peer devices in the countries list_countries reports online now; best = whichever is available`);
var TrafficCountryField = z13.string().regex(/^([a-z]{2}|any)$/i).describe('ISO-3166 alpha-2 (e.g. "GB") or "any"; see list_countries for what is online now');
var TrafficRotationField = z13.enum(["auto5", "auto10", "auto20", "auto60", "ondemand", "sticky"]).describe("auto5|auto10|auto20|auto60 = new IP every N minutes; ondemand = new IP on every connection; sticky = keep the same device for the session (the carrier may still change its IP)");
var BuildProxyUrlInput = z13.object({
  pool: TrafficPoolField,
  country: TrafficCountryField,
  rotation: TrafficRotationField,
  session: z13.string().regex(/^[a-z0-9_]{1,64}$/).optional().describe("Session name, a-z 0-9 _ only. Optional: a stable one is derived for sticky."),
  protocol: z13.enum(["http", "socks5"]).optional().describe("Default http"),
  reveal_password: z13.boolean().optional().describe("Default false: the URL comes back with the password masked. Set true only when the user needs the working URL.")
});
var TestConnectionInput = z13.object({
  pool: TrafficPoolField.optional(),
  country: TrafficCountryField.optional(),
  rotation: TrafficRotationField.optional()
});
var BuyTrafficInput = z13.object({
  gb: z13.number().int().min(1).max(1e3).optional().describe("Whole GB to add to the balance. Omit when trial is true."),
  trial: z13.boolean().optional().describe("Buy the one-off 0.5 GB trial instead (once per customer)."),
  accept_terms: z13.boolean().optional().describe(
    "Must be exactly true: the user accepts the terms (https://portproof.org/legal/terms), the acceptable-use policy (https://portproof.org/legal/aup) and the immediate start of the service. Ask the user; the API refuses a purchase without it."
  ),
  ...ConfirmFields
});
var PortSummary = z13.object({
  id: idSchema("prt"),
  label: z13.string(),
  network: PortNetwork,
  state: z13.string(),
  site_code: z13.string().optional(),
  country: z13.string(),
  carrier: z13.string(),
  ip_stack: z13.string(),
  egress_v4: z13.string().nullable(),
  egress_v6_prefix: z13.string().nullable(),
  rotation_interval_s: z13.number().int(),
  last_rotation_at: z13.string().nullable(),
  usage_today_bytes: z13.number().int().nullable(),
  daily_cap_bytes: z13.number().int().nullable(),
  uptime_30d_pct: z13.number().nullable(),
  subscription_ends_at: z13.string().nullable(),
  auto_renew: z13.boolean().nullable(),
  operator: z13.enum(["owned", "partner"]),
  evidence: z13.enum(["signed", "observed"]),
  attestation: z13.enum(["signed", "observed"])
});

function jsonResult(payload) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}
function errorResult(body) {
  return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: body }) }] };
}
function localError(code, title, detail) {
  return errorResult(ApiProblemError.local(code, title, detail).body);
}
function errorFromUnknown(err) {
  if (err instanceof ApiProblemError) return errorResult(err.body);
  const message = err instanceof Error ? err.message : String(err);
  return localError("unexpected_response", "Tool failed", message);
}

var TOOL_NAMES = [
  "get_pricing",
  "search_inventory",
  "quote",
  "buy_port",
  "list_ports",
  "get_port",
  "rotate",
  "set_rotation_schedule",
  "renew_port",
  "set_auto_renew",
  "get_passport",
  "get_receipt",
  "get_usage",
  "get_status",
  "get_traffic",
  "list_countries",
  "build_proxy_url",
  "buy_traffic",
  "test_connection"
];

var regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code) {
  const cc = code.toUpperCase();
  if (cc === "GE") return "Georgia (country)";
  try {
    const name = regionNames.of(cc);
    if (name === void 0 || name === cc || /^unknown/i.test(name)) return cc;
    return name;
  } catch {
    return cc;
  }
}
function networkOf(port) {
  if (port.network !== void 0) return port.network;
  if (port.evidence === "observed") return "partner";
  return "own";
}
function neutralPortLabel(port) {
  const parts = [countryName(port.country)];
  if (port.carrierName) parts.push(port.carrierName);
  parts.push(port.id);
  return parts.join(" \xB7 ");
}
function urlHost(host) {
  if (host.includes(":") && !host.startsWith("[")) return `[${host}]`;
  return host;
}
function proxyUrl(scheme, credential) {
  const auth = `${encodeURIComponent(credential.username)}:${encodeURIComponent(credential.password)}`;
  return `${scheme}://${auth}@${urlHost(credential.host)}:${credential.port}`;
}
function proxyUrls(port) {
  const credentials = port.credentials;
  if (!credentials) return null;
  const shared = { username: credentials.username, password: credentials.password };
  const http = credentials.http ?? {
    host: port.listeners.host,
    port: port.listeners.http_port,
    ...shared
  };
  const socks5 = credentials.socks5 ?? {
    host: port.listeners.host,
    port: port.listeners.socks_port,
    ...shared
  };
  return { http: proxyUrl("http", http), socks5: proxyUrl("socks5", socks5) };
}
function carrierView(carrier, network) {
  if (network === "own") return carrier;
  const { mcc_mnc: _placeholder, ...rest } = carrier;
  return rest;
}
function portView(port) {
  const { site_code: siteCode, usage_today: usageToday, carrier, ...rest } = port;
  const network = networkOf(port);
  const label = neutralPortLabel({ id: port.id, country: port.country, carrierName: carrier.name });
  const view = { label, ...rest, carrier: carrierView(carrier, network), network };
  if (network === "own") {
    view.site_code = siteCode;
    view.usage_today = usageToday;
  }
  return view;
}
function summarisePort(port) {
  const network = networkOf(port);
  const summary = {
    id: port.id,
    label: neutralPortLabel({ id: port.id, country: port.country, carrierName: port.carrier.name }),
    network,
    state: port.state,
    country: port.country,
    carrier: port.carrier.name,
    ip_stack: port.carrier.ip_stack,
    egress_v4: port.egress_v4,
    egress_v6_prefix: port.egress_v6_prefix,
    rotation_interval_s: port.rotation_interval_s,
    last_rotation_at: port.last_rotation_at,
    usage_today_bytes: network === "own" ? port.usage_today.bytes : null,
    daily_cap_bytes: network === "own" ? port.usage_today.cap_bytes : null,
    uptime_30d_pct: port.uptime_30d_pct,
    subscription_ends_at: port.subscription?.ends_at ?? null,
    auto_renew: port.subscription?.auto_renew ?? null,
    operator: port.operator,
    evidence: port.evidence,
    attestation: port.attestation
  };
  if (network === "own") summary.site_code = port.site_code;
  return summary;
}
function passportView(passport) {
  const {
    site_code: siteCode,
    usage: usage2,
    sessions,
    sim_contract_class: simClass,
    ip_shared_with_own_ports: sharedWithOwn,
    carrier,
    ...rest
  } = passport;
  const network = networkOf(passport);
  const label = neutralPortLabel({
    id: passport.port_id,
    country: passport.country,
    carrierName: carrier.name
  });
  const view = { label, ...rest, carrier: carrierView(carrier, network), network };
  if (network === "own") {
    view.site_code = siteCode;
    view.usage = usage2;
    view.sessions = sessions;
    view.sim_contract_class = simClass;
    view.ip_shared_with_own_ports = sharedWithOwn;
  }
  return view;
}

function defineTool(def) {
  return def;
}
var READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};
var MUTATING = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

var getPassport = defineTool({
  name: "get_passport",
  title: "Get port details",
  description: "Port details (API object: passport): label (country, carrier, port id), network (own = Own network, partner = Partner network), carrier, egress IPs, geo consensus, reputation, rotation and uptime statistics, throughput and exclusivity. Own network ports add the SIM contract class, usage against the daily cap and concurrent sessions (proof the port is not shared); a Partner network port has none of these, because nothing of ours runs on its device. Credentials are never included.",
  inputSchema: PortIdInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => jsonResult(passportView(await ctx.api.getPassport(args.port_id)))
});
async function verifySignature(receipt, ctx) {
  try {
    const { keys } = await ctx.api.getWellKnownKeys();
    const v = verifyReceiptWithKeys(receipt, keys);
    return {
      verified: v.ok,
      key_id: v.key_id,
      reason: v.reason,
      keys_url: ctx.api.wellKnownKeysUrl
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      verified: null,
      key_id: null,
      reason: `keys_unavailable: ${detail}`,
      keys_url: ctx.api.wellKnownKeysUrl
    };
  }
}
var getReceipt = defineTool({
  name: "get_receipt",
  title: "Get rotation record",
  description: "Fetch one rotation record from the rotation log by id (rot_...): old/new IPs, whether the IP actually changed, attempts, timing, carrier, geo and reputation snapshot, plus the Ed25519 signature. Records of Own network ports (evidence: signed) are signed on the device; records of Partner network ports (evidence: observed) are recorded by our monitoring and signed by the control plane key cp-2026. The server also verifies the signature against the published keys and reports the result.",
  inputSchema: ReceiptIdInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const receipt = await ctx.api.getReceipt(args.receipt_id);
    const signature = await verifySignature(receipt, ctx);
    return jsonResult({ receipt, signature });
  }
});

function checkConfirmation(args, action) {
  if (args.confirm !== true) {
    return localError(
      "confirmation_required",
      `Refused: ${action} needs confirm: true`,
      `${action} changes the account (money or live proxy state). Ask the user, then call again with confirm: true and an idempotency_key.`
    );
  }
  const key = IdempotencyKey.safeParse(args.idempotency_key);
  if (!key.success) {
    return localError(
      "idempotency_key_required",
      `Refused: ${action} needs an idempotency_key`,
      "Pass a caller-chosen unique string (1..255 printable ASCII chars, e.g. a UUID). Reuse the same key only to retry the identical request."
    );
  }
  return null;
}

var PRICE_TABLE_SKUS = new Set(SkuSchema.options);
function isPriceTableSku(sku) {
  return PRICE_TABLE_SKUS.has(sku);
}
async function findCatalogueListing(sku, ctx) {
  const pricing = await ctx.api.getPricing();
  return pricing.skus.find((row) => row.sku === sku && row.buy_via === "cart") ?? null;
}
function shopAnswer(listing, requestedTerm, ctx) {
  const shopPath = `/shop/${encodeURIComponent(listing.sku)}`;
  const shopUrl = ctx.api.shopOrigin === null ? null : `${ctx.api.shopOrigin}${shopPath}`;
  const steps = [
    "This port is bought in the Portproof web shop, not through buy_port: open shop_url, add it to the cart and check out.",
    "The port is delivered after payment and company verification."
  ];
  if (listing.term !== requestedTerm) {
    steps.push(
      `This SKU is the ${listing.term} term; get_pricing lists the SKUs of the other terms.`
    );
  }
  return {
    buy_via: "cart",
    sku: listing.sku,
    term: listing.term,
    price_cents: listing.price_cents,
    currency: listing.currency,
    shop_path: shopPath,
    shop_url: shopUrl,
    next_step: steps.join(" ")
  };
}
var NOT_ON_SALE_DETAIL = "This SKU is not on sale for your organisation right now. get_pricing (field skus) lists what can be bought.";
function notOnSale() {
  return localError("not_on_sale", "Not on sale", NOT_ON_SALE_DETAIL);
}

async function costOf(port, input, ctx) {
  if (port.subscription) {
    return {
      cost_cents: port.subscription.price_cents,
      currency: port.subscription.currency,
      cost_source: "subscription"
    };
  }
  try {
    const q = await ctx.api.postQuote({ sku: input.sku, term: input.term, quantity: 1 });
    return { cost_cents: q.total_cents, currency: q.currency, cost_source: "quote" };
  } catch {
    return { cost_cents: null, currency: null, cost_source: "unknown" };
  }
}
async function answerCatalogueBuy(args, ctx) {
  const listing = await findCatalogueListing(args.sku, ctx);
  if (listing === null) return notOnSale();
  return jsonResult({ purchased: false, charged: false, ...shopAnswer(listing, args.term, ctx) });
}
var buyPort = defineTool({
  name: "buy_port",
  title: "Buy a port",
  description: 'Dedicated mobile ports: buy one dedicated mobile port (one modem, one SIM, one customer) for a SKU and term; check search_inventory first. For proxies by the GB use buy_traffic instead. CHARGES MONEY: requires confirm: true and an idempotency_key; refused otherwise. Fails with kyb_required (402) until the org has passed KYB tier t1, and no_inventory (409) when the SKU is sold out. Returns the Port with credentials and cost_cents. Partner network SKUs (buy_via "cart" in get_pricing) are bought in the web shop: for them nothing is charged and the answer is purchased: false with shop_url, or not_on_sale when they are not on sale for your organisation.',
  inputSchema: BuyPortInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "buy_port");
    if (refusal) return refusal;
    if (!isPriceTableSku(args.sku)) return answerCatalogueBuy(args, ctx);
    const body = { sku: args.sku, term: args.term, quantity: 1 };
    if (args.carrier_id !== void 0) body.carrier_id = args.carrier_id;
    if (args.auto_renew !== void 0) body.auto_renew = args.auto_renew;
    const { data: port } = await ctx.api.createPort(body, args.idempotency_key);
    const cost = await costOf(port, args, ctx);
    return jsonResult({ ...cost, port: portView(port), proxy_urls: proxyUrls(port) });
  }
});
var listPorts = defineTool({
  name: "list_ports",
  title: "List ports",
  description: "List the ports owned by this API key as compact summaries: label (country, carrier, port id), network (own = Own network, partner = Partner network), state, egress IPs, rotation, usage, subscription end and auto_renew. No credentials: use get_port for those. Paginated: pass next_cursor as cursor to continue.",
  inputSchema: ListPortsInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const query = {};
    if (args.limit !== void 0) query.limit = args.limit;
    if (args.cursor !== void 0) query.cursor = args.cursor;
    const page = await ctx.api.listPorts(query);
    return jsonResult({ data: page.data.map(summarisePort), next_cursor: page.next_cursor });
  }
});
var getPort = defineTool({
  name: "get_port",
  title: "Get port",
  description: "Full detail for one port: label, network, state, carrier, listeners, credentials (only if you own it), allowlist, egress IPs, rotation settings, usage today, uptime and subscription. Partner network ports also carry credentials.http and credentials.socks5 (each with its own host, port, login and password), capabilities (controls the port supports), renewal (price_cents, ends_at, auto_renew, can_renew) and rotation_url: the Portproof link that rotates the IP when fetched (60 s cooldown). proxy_urls gives ready-to-use http and socks5 URLs, each built from its own credential set.",
  inputSchema: PortIdInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const port = await ctx.api.getPort(args.port_id);
    return jsonResult({ port: portView(port), proxy_urls: proxyUrls(port) });
  }
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function awaitRotation(portId, rotationId, startedAt, ctx) {
  const intervalMs = ctx.rotationPoll?.intervalMs ?? ROTATION_POLL_INTERVAL_MS;
  const deadline = startedAt + (ctx.rotationPoll?.totalWaitMs ?? ROTATION_TOTAL_WAIT_MS);
  while (Date.now() + intervalMs <= deadline) {
    await sleep(intervalMs);
    const status = await ctx.api.getRotationStatus(portId, rotationId);
    if (status.kind === "receipt") return status.receipt;
  }
  return null;
}
function rotationDone(receipt) {
  return jsonResult({
    status: "done",
    rotated: receipt.rotated,
    reason: receipt.reason,
    old_ip4: receipt.old_ip4,
    new_ip4: receipt.new_ip4,
    elapsed_ms: receipt.elapsed_ms,
    receipt
  });
}
var rotate = defineTool({
  name: "rotate",
  title: "Rotate IP",
  description: "Rotate IP: request a new egress IP for a port and wait (up to 180 s in all) for the rotation record, signed on the device for Own network ports (evidence: signed) or recorded by our monitoring for Partner network ports (evidence: observed). A rotation still running after the API's first answer is followed on its status link. Changes live proxy state: requires confirm: true and an idempotency_key; refused otherwise. Carriers sometimes return the same IP (rotated: false, reason carrier_sticky); a rotation record is written either way. 429 port_cooldown (with retry_after seconds) inside the 60 s cooldown. Included in the subscription: no charge.",
  inputSchema: RotateInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "rotate");
    if (refusal) return refusal;
    const startedAt = Date.now();
    const result = await ctx.api.rotatePort(args.port_id, args.idempotency_key);
    if (result.kind === "receipt") return rotationDone(result.receipt);
    const rotationId = result.pending.rotation_id;
    const receipt = await awaitRotation(args.port_id, rotationId, startedAt, ctx);
    if (receipt !== null) return rotationDone(receipt);
    return jsonResult({
      status: "pending",
      rotation_id: rotationId,
      port_id: args.port_id,
      detail: "The rotation is still running. Do not rotate again: read get_receipt with this rotation_id in a minute, or get_port for the new egress IP."
    });
  }
});
var setRotationSchedule = defineTool({
  name: "set_rotation_schedule",
  title: "Set rotation schedule",
  description: "Set the automatic rotation interval for a port: 0 = sticky (never rotate on a schedule), otherwise 60..86400 seconds. The schedule keeps running between API calls. When get_port shows capabilities.rotation_interval: false the port has no schedule control. A change the network has not confirmed yet answers conflict (409); try again later. Changes live proxy state: requires confirm: true and an idempotency_key; refused otherwise. No charge.",
  inputSchema: SetRotationScheduleInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "set_rotation_schedule");
    if (refusal) return refusal;
    const port = await ctx.api.setRotationSchedule(
      args.port_id,
      args.interval_s,
      args.idempotency_key
    );
    return jsonResult({
      port_id: port.id,
      rotation_interval_s: port.rotation_interval_s,
      sticky: port.rotation_interval_s === 0,
      sticky_until: port.sticky_until,
      port: summarisePort(port)
    });
  }
});
var renewPort = defineTool({
  name: "renew_port",
  title: "Renew a port",
  description: "Dedicated ports: renew one port for one more term now, paid from the account balance. Read get_port first: renewal.can_renew says whether it can be renewed now and renewal.price_cents what one more term costs. A Partner network port is renewed on the network first and ends_at is the end it confirmed; there is no grace period after a term ends. CHARGES MONEY: requires confirm: true and an idempotency_key; refused otherwise. Errors: insufficient_funds (402, nothing charged: top up the balance), conflict (409, for example while an earlier renewal is still being confirmed), supply_source_error (502, the renewal was refused and the charge refunded). Returns ends_at and cost_cents.",
  inputSchema: RenewPortInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "renew_port");
    if (refusal) return refusal;
    const subscription = await ctx.api.renewPort(args.port_id, args.idempotency_key);
    return jsonResult({
      port_id: args.port_id,
      renewed: true,
      ends_at: subscription.ends_at,
      auto_renew: subscription.auto_renew,
      cost_cents: subscription.price_cents,
      currency: subscription.currency,
      subscription
    });
  }
});
var setAutoRenew = defineTool({
  name: "set_auto_renew",
  title: "Set auto-renew",
  description: "Dedicated ports: switch auto-renew of one port on or off. On: the port is renewed from the account balance shortly before its term ends (a short balance means it ends). Off: the port ends at the end of its current term, with no refund. Changes the subscription: requires confirm: true and an idempotency_key; refused otherwise. No charge now.",
  inputSchema: SetAutoRenewInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "set_auto_renew");
    if (refusal) return refusal;
    const subscription = await ctx.api.setAutoRenew(
      args.port_id,
      args.enabled,
      args.idempotency_key
    );
    return jsonResult({
      port_id: args.port_id,
      auto_renew: subscription.auto_renew,
      ends_at: subscription.ends_at,
      subscription
    });
  }
});

var getPricing = defineTool({
  name: "get_pricing",
  title: "Get pricing",
  description: 'Public price table. Field traffic: proxy traffic by the GB (tier table with the per-GB price by order size in EUR cents ex VAT, package sizes, the 0.5 GB trial, validity days, monthly GB without company verification); buy it with buy_traffic. Field skus: dedicated mobile ports with monthly price in cents (EUR, USD for us-4g), supply (evidence signed = Own network, observed = Partner network), volume ladder, weekly/daily term ratios and the 24 h trial. Each SKU says how it is bought (buy_via): "ports" SKUs work with quote and buy_port; "cart" SKUs are Partner network ports, one SKU per term, sold only through the web shop (quote and buy_port answer them with the shop link). Partner network ports are listed only while they are on sale for your organisation, so the list can differ with and without an API key. No API key needed. Prices are quotes only; nothing is charged.',
  inputSchema: EmptyInput,
  annotations: READ_ONLY,
  run: async (_args, ctx) => jsonResult(await ctx.api.getPricing())
});
var searchInventory = defineTool({
  name: "search_inventory",
  title: "Search inventory",
  description: "Dedicated mobile ports: available Own network dedicated mobile ports per country / site / carrier, with the number available and whether new ports are wait-listed. Use the returned carrier_id to pin a carrier in buy_port. Partner network ports are not listed here: get_pricing lists the ones on sale for you. No API key needed.",
  inputSchema: SearchInventoryInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const query = {};
    if (args.country !== void 0) query.country = args.country;
    if (args.carrier !== void 0) query.carrier = args.carrier;
    return jsonResult(await ctx.api.getInventory(query));
  }
});
var quote = defineTool({
  name: "quote",
  title: "Quote a purchase",
  description: 'Price a purchase before buying: unit price, volume discount and total in cents for a SKU, term (monthly | weekly | daily) and quantity. For a Partner network SKU (buy_via "cart") the answer is its listed price per port and the web shop link, where the cart shows the total; not_on_sale when it is not on sale for your organisation. Read-only, nothing is charged.',
  inputSchema: QuoteInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    if (!isPriceTableSku(args.sku)) {
      const listing = await findCatalogueListing(args.sku, ctx);
      if (listing === null) return notOnSale();
      return jsonResult({
        ...shopAnswer(listing, args.term, ctx),
        quantity: args.quantity,
        charged: false
      });
    }
    const q = await ctx.api.postQuote({ sku: args.sku, term: args.term, quantity: args.quantity });
    return jsonResult({
      ...q,
      sku: args.sku,
      term: args.term,
      quantity: args.quantity,
      charged: false
    });
  }
});

var getStatus = defineTool({
  name: "get_status",
  title: "Get platform status",
  description: "Public status page data: platform state, per-site uptime and live port counts, per-carrier uptime / first-attempt rotation success / p50 rotation time / published rotation floor, public incidents from the last 30 days and support response time. No API key needed.",
  inputSchema: EmptyInput,
  annotations: READ_ONLY,
  run: async (_args, ctx) => jsonResult(await ctx.api.getStatus())
});

var MASK = "pak_****";
var getTraffic = defineTool({
  name: "get_traffic",
  title: "Get the traffic balance",
  description: "Proxy traffic balance of the organisation: GB total / used / left, expiry, whether the key is enabled, daily usage and the purchase limits (validity days, monthly GB without company verification, whether the trial is still available). Connection details (host, ports, username base) are included when the API key holds ports:write (credentials is null otherwise); the password is masked here, use build_proxy_url with reveal_password: true when the user needs a working URL. Usage is synced every 5 minutes.",
  inputSchema: EmptyInput,
  annotations: READ_ONLY,
  run: async (_args, ctx) => {
    const t = await ctx.api.getTraffic();
    return jsonResult({ ...t, credentials: t.credentials ? { ...t.credentials, password: MASK } : null });
  }
});
var listCountries = defineTool({
  name: "list_countries",
  title: "List countries online now",
  description: `Countries with devices online now, per pool: mobile (4G/5G carrier modems, only in ${MOBILE_COUNTRIES_TEXT}) and residential (opt-in peer devices), with totals. Coverage changes through the day: quote the numbers this tool returns and never an older or rounded count. Counts only; exit addresses are never listed. Empty lists mean the numbers are not available right now. No API key needed.`,
  inputSchema: EmptyInput,
  annotations: READ_ONLY,
  run: async (_args, ctx) => jsonResult(await ctx.api.getTrafficCountries())
});
var buildProxyUrl = defineTool({
  name: "build_proxy_url",
  title: "Build a proxy URL",
  description: `Build the proxy username and URL for one connection: pool, country, rotation and an optional session name are encoded in the username (validated by the server: an ISO 3166-1 alpha-2 country or "any", and the mobile pool only in ${MOBILE_COUNTRIES_TEXT}). Returns host, port, username, the URL and curl / Python / Node / Playwright snippets. The password is masked unless reveal_password is true. A sticky session keeps the same device, and the carrier may still change its IP; never promise a fixed IP. Needs a traffic balance (buy_traffic first) and an API key with ports:write.`,
  inputSchema: BuildProxyUrlInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const { reveal_password, ...body } = args;
    const built = await ctx.api.buildProxyUrl(body);
    if (reveal_password === true) return jsonResult({ ...built, password_revealed: true });
    const secret = /:([^:@/]+)@/.exec(built.url)?.[1];
    const variants = secret ? [secret, decodeURIComponent(secret)] : [];
    const mask = (text) => variants.reduce((t, v) => v ? t.split(v).join(MASK) : t, text);
    const snippets = Object.fromEntries(Object.entries(built.snippets).map(([k, v]) => [k, mask(v)]));
    return jsonResult({ ...built, url: built.url_masked, snippets, password_revealed: false });
  }
});
var buyTraffic = defineTool({
  name: "buy_traffic",
  title: "Buy proxy traffic",
  description: "Buy whole GB of proxy traffic (or the one-off 0.5 GB trial) from the wallet balance. CHARGES MONEY: requires confirm: true, accept_terms: true (the user accepts the terms, the acceptable-use policy and the immediate start of the service; ask them) and an idempotency_key; refused otherwise. Needs an API key with ports:write. The server prices the order from the tier table (see get_pricing, field traffic); the GB are added to the same balance and credentials. Validity is what get_traffic reports: limits.validity_days 0 means GB never expire. Fails with insufficient_funds (402) when the wallet is too low, kyb_required_for_volume (402) above the monthly volume for unverified organisations, trial_already_used (409), idempotency_conflict (409) when the idempotency_key was already used for a different purchase. A refused purchase stays stored under its idempotency_key for 24 h: after fixing the cause (for example a wallet top-up), buy with a new key. Returns the order with gb and cost_cents as the server recorded them.",
  inputSchema: BuyTrafficInput,
  annotations: MUTATING,
  run: async (args, ctx) => {
    const refusal = checkConfirmation(args, "buy_traffic");
    if (refusal) return refusal;
    if (args.accept_terms !== true) {
      return localError(
        "terms_acceptance_required",
        "Refused: buy_traffic needs accept_terms: true",
        "Ask the user to accept the terms (https://portproof.org/legal/terms), the acceptable-use policy (https://portproof.org/legal/aup) and the immediate start of the service, then call again with accept_terms: true."
      );
    }
    if (args.trial === true === (args.gb !== void 0)) {
      return localError("validation_failed", "Send either gb or trial: true", "gb is a whole number of GB (1 to 1000); trial: true buys the one-off 0.5 GB trial instead.");
    }
    const out = await ctx.api.buyTraffic(args.trial === true ? { trial: true, accept_terms: true } : { gb: args.gb, accept_terms: true }, args.idempotency_key);
    const o = out.order;
    const gb = o.items.reduce((n, it) => n + it.quantity * (it.sku_snapshot.sku === TRAFFIC_TRIAL.sku ? TRAFFIC_TRIAL.gb : 1), 0);
    return jsonResult({
      order_id: o.id,
      order_number: o.number,
      status: o.status,
      gb,
      unit_cents: o.items[0]?.unit_cents ?? null,
      cost_cents: o.total_cents,
      vat_cents: o.vat_cents,
      currency: o.currency,
      payment_id: out.payment_id,
      note: "The balance updates within a few seconds of payment; call get_traffic to see it."
    });
  }
});
var testConnection = defineTool({
  name: "test_connection",
  title: "Test a proxy connection",
  description: "The API sends one request through the gateway with the given pool, country and rotation and reports ok, the exit IP it saw, the latency and, on failure, the gateway error_code (for example E_NO_STOCK_COUNTRY, E_CAP_EXCEEDED, timeout). exit_country is only a country that was observed for the exit, never the requested one: when country_verified is false it is null, so do not tell the user the country was confirmed. Uses a few kilobytes of the balance; limited to 6 per minute; needs an API key with ports:write. With the development mock the result is simulated (simulated: true).",
  inputSchema: TestConnectionInput,
  annotations: { ...READ_ONLY, idempotentHint: false, openWorldHint: true },
  run: async (args, ctx) => {
    const body = {};
    if (args.pool !== void 0) body["pool"] = args.pool;
    if (args.country !== void 0) body["country"] = args.country;
    if (args.rotation !== void 0) body["rotation"] = args.rotation;
    return jsonResult(await ctx.api.testConnection(body));
  }
});

var getUsage = defineTool({
  name: "get_usage",
  title: "Get usage",
  description: "Traffic for one port over a time window: bytes in/out, peak concurrent sessions, new connections and rotations per bucket, plus totals. Default granularity is hour; use day for long windows to keep the response small.",
  inputSchema: GetUsageInput,
  annotations: READ_ONLY,
  run: async (args, ctx) => {
    const query = {
      port_id: args.port_id
    };
    if (args.from !== void 0) query.from = args.from;
    if (args.to !== void 0) query.to = args.to;
    if (args.granularity !== void 0) query.granularity = args.granularity;
    const { data } = await ctx.api.getUsage(query);
    const totals = data.reduce(
      (acc, p) => ({
        bytes_in: acc.bytes_in + p.bytes_in,
        bytes_out: acc.bytes_out + p.bytes_out,
        conns_new: acc.conns_new + p.conns_new,
        rotations: acc.rotations + p.rotations,
        sessions_peak: Math.max(acc.sessions_peak, p.sessions_peak)
      }),
      { bytes_in: 0, bytes_out: 0, conns_new: 0, rotations: 0, sessions_peak: 0 }
    );
    return jsonResult({
      port_id: args.port_id,
      granularity: args.granularity ?? "hour",
      from: args.from ?? null,
      to: args.to ?? null,
      buckets: data.length,
      totals,
      data
    });
  }
});

async function runTool(def, args, ctx) {
  try {
    return await def.run(args, ctx);
  } catch (err) {
    return errorFromUnknown(err);
  }
}
var TOOLS = [
  getPricing,
  searchInventory,
  quote,
  buyPort,
  listPorts,
  getPort,
  rotate,
  setRotationSchedule,
  renewPort,
  setAutoRenew,
  getPassport,
  getReceipt,
  getUsage,
  getStatus,
  getTraffic,
  listCountries,
  buildProxyUrl,
  buyTraffic,
  testConnection
];
var registered = new Set(TOOLS.map((t) => t.name));
for (const name of TOOL_NAMES) {
  if (!registered.has(name)) throw new Error(`tool registry is missing contract tool ${name}`);
}
if (registered.size !== TOOL_NAMES.length)
  throw new Error("tool registry has duplicate or extra tools");

var INSTRUCTIONS = [
  `Portproof sells proxy traffic by the GB: one prepaid GB balance per organisation, usable on two shared pools, mobile 4G/5G (carrier modems in ${MOBILE_COUNTRIES_TEXT}) and residential (opt-in peer devices; the countries online now come from list_countries, so never state a country count from memory). Pool, country, rotation (new IP every 5 / 10 / 20 / 60 minutes, on every connection, or a sticky session) and the session name are chosen in the proxy username, so one credential serves everything. Be precise: the pools are shared, a sticky session keeps the same device and the carrier may still change its IP; never call this traffic dedicated, private, static or unlimited, and never list pool exit addresses. Validity is what get_traffic reports: limits.validity_days 0 (and expires_at null) means GB never expire; a positive number is the days of validity every purchase guarantees for the whole balance.`,
  "Traffic tools: get_traffic (balance, expiry, limits), list_countries (devices online now per pool), build_proxy_url (username, URL and code snippets; the password stays masked unless reveal_password is true), test_connection (one request through the gateway: exit IP and latency; exit_country is normally null because the exit country is not checked; never report the requested country as the exit country), buy_traffic (wallet purchase of whole GB or the one-off 0.5 GB trial; prices come from the tier table in get_pricing, field traffic).",
  'Dedicated mobile ports (one modem, one SIM, one customer per port; sold by the day, week or month) are on sale: get_pricing (field skus) lists the SKUs the caller may buy, search_inventory and quote work without a key, and list_ports, get_port, rotate, set_rotation_schedule, renew_port, set_auto_renew, get_passport, get_receipt and get_usage work on the ports the organisation holds. Every port states its supply: "signed" evidence means Own network (each rotation record is signed on the device), "observed" evidence means Partner network (recorded by our monitoring and signed by the control plane key); never describe a Partner network port as signed on the device. Name a port by its label (country, carrier, port id) and say only "Partner network" about where a Partner network port runs.',
  'Partner network ports are bought in the web shop, one SKU per term (buy_via "cart" in get_pricing): quote and buy_port answer them with shop_url and never charge. Their HTTP and SOCKS5 connections may differ in host, port, login and password: give the user proxy_urls from get_port, never a URL assembled from one set. rotation_url is the Portproof link that rotates the IP when fetched. They renew from the account balance: renewal in get_port says what one more term costs and whether it can be renewed now; auto-renew off means the port ends at the end of its term.',
  "Read tools (get_pricing, search_inventory, quote, list_ports, get_port, get_passport, get_receipt, get_usage, get_status, get_traffic, list_countries, build_proxy_url) are safe to call freely; test_connection uses a few kilobytes of the balance and is limited to 6 per minute.",
  "buy_traffic, buy_port and renew_port charge money, rotate and set_rotation_schedule change live proxy state and set_auto_renew changes the subscription: they are refused unless called with confirm: true and an idempotency_key. buy_traffic also needs accept_terms: true, which records that the user accepts the terms, the acceptable-use policy and the immediate start of the service. Ask the user before setting confirm: true or accept_terms: true, and reuse the same idempotency_key only to retry the identical request.",
  'Every response is compact JSON. Successful purchases include cost_cents. Errors are {"error": {code, status, title, detail}} using the API problem codes (insufficient_funds, kyb_required_for_volume, trial_already_used, traffic_not_purchased, kyb_required, no_inventory, use_cart, port_cooldown with retry_after, conflict, insufficient_scope, not_found, validation_failed, ...) plus local codes such as not_on_sale.',
  "get_pricing, search_inventory, quote, get_status and list_countries work without an API key; everything else needs PORTPROOF_API_KEY. Key scopes are enforced: get_traffic needs ports:read (connection details only with ports:write), and build_proxy_url, test_connection and buy_traffic need ports:write; a missing scope answers insufficient_scope."
].join(" ");
function createServer(ctx) {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS }
  );
  for (const def of TOOLS) {
    server.registerTool(
      def.name,
      {
        title: def.title,
        description: def.description,
        inputSchema: def.inputSchema,
        annotations: def.annotations
      },
      (args) => runTool(def, args, ctx)
    );
  }
  return server;
}

function usage() {
  return [
    `portproof-mcp ${SERVER_VERSION} - Portproof API as MCP tools over stdio`,
    "",
    "Environment:",
    "  PORTPROOF_API_KEY  customer API key (pk_test_... / pk_live_...); optional for public tools",
    "  PORTPROOF_API_URL  API origin, default https://api.portproof.org (/v1 is appended)",
    "",
    `Tools: ${TOOL_NAMES.join(", ")}`
  ].join("\n");
}
async function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error(usage());
    return;
  }
  if (argv.includes("--version") || argv.includes("-v")) {
    console.error(SERVER_VERSION);
    return;
  }
  const cfg = loadConfig();
  const api = new ApiClient({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey });
  const server = createServer({ api });
  await server.connect(new StdioServerTransport());
  console.error(
    `[portproof-mcp] ready on stdio: api=${cfg.baseUrl} key=${cfg.apiKey ? "set" : "missing (public tools only)"}`
  );
}
main(process.argv.slice(2)).catch((err) => {
  console.error("[portproof-mcp] fatal:", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
