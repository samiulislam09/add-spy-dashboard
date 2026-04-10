import { z } from "zod";

export const platformSchema = z.enum(["META", "TIKTOK", "GOOGLE", "OTHER"]);
export type Platform = z.infer<typeof platformSchema>;

export const adStatusSchema = z.enum(["ACTIVE", "INACTIVE", "PAUSED", "UNKNOWN"]);
export type AdStatus = z.infer<typeof adStatusSchema>;

export const adFormatSchema = z.enum([
  "IMAGE",
  "VIDEO",
  "CAROUSEL",
  "TEXT",
  "COLLECTION",
  "UNKNOWN",
]);
export type AdFormat = z.infer<typeof adFormatSchema>;

export const hookTypeSchema = z.enum([
  "QUESTION",
  "DIRECT_BENEFIT",
  "SOCIAL_PROOF",
  "FOMO",
  "STORY",
  "STATISTIC",
  "PROBLEM",
  "UNKNOWN",
]);

export const toneSchema = z.enum([
  "AUTHORITATIVE",
  "PLAYFUL",
  "URGENT",
  "EDUCATIONAL",
  "ASPIRATIONAL",
  "NEUTRAL",
]);

export const ctaTypeSchema = z.enum([
  "BUY_NOW",
  "LEARN_MORE",
  "SIGN_UP",
  "BOOK_DEMO",
  "DOWNLOAD",
  "CONTACT_US",
  "OTHER",
]);

export const ingestionSourceTypeSchema = z.enum(["META_PUBLIC", "TIKTOK_PUBLIC", "GOOGLE_TRANSPARENCY", "CSV", "JSON"]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export const adFilterSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  advertiserId: z.string().optional(),
  platform: platformSchema.optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  adFormat: adFormatSchema.optional(),
  activeOnly: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  ctaType: ctaTypeSchema.optional(),
  offerType: z.string().optional(),
  tone: toneSchema.optional(),
  hookType: hookTypeSchema.optional(),
  messagingAngle: z.string().optional(),
  hasVideo: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  recentlyChanged: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  firstSeenFrom: z.string().optional(),
  firstSeenTo: z.string().optional(),
  lastSeenFrom: z.string().optional(),
  lastSeenTo: z.string().optional(),
  sortBy: z
    .enum(["FIRST_SEEN_DESC", "LAST_SEEN_DESC", "LONGEST_RUNNING", "MOST_RECENTLY_CHANGED"])
    .default("LAST_SEEN_DESC"),
  viewMode: z.enum(["grid", "list", "compare"]).optional(),
});

export type AdFilterInput = z.infer<typeof adFilterSchema>;

export const compareSchema = z.object({
  type: z.enum(["ads", "advertisers", "period"]),
  leftId: z.string().min(1),
  rightId: z.string().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const savedSearchInputSchema = z.object({
  name: z.string().min(1).max(100),
  filtersJson: z.record(z.string(), z.unknown()),
});

export const collectionInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(400).optional(),
});

export const alertRuleInputSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum([
    "NEW_AD_DETECTED",
    "COPY_CHANGED",
    "NEW_OFFER",
    "NEW_CTA",
    "NEW_VIDEO",
    "NEW_COUNTRY",
  ]),
  conditionsJson: z.record(z.string(), z.unknown()),
  isActive: z.boolean().default(true),
});

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
