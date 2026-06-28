import { z } from "zod";

export const SignUpSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  email:    z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const ProfileSchema = z.object({
  name: z.string().min(2).max(50),
});

export const WatchlistItemSchema = z.object({
  dealId:        z.string().cuid(),
  targetPrice:   z.number().positive().optional(), // in cents from client — divided by 100 before DB save
  minDiscount:   z.number().int().min(0).max(100).optional().default(0),
  priceAlert:    z.boolean().optional().default(true),
  discountAlert: z.boolean().optional().default(false),
});

export const WatchlistItemUpdateSchema = z.object({
  targetPrice:   z.number().positive().optional(), // in cents from client
  minDiscount:   z.number().int().min(0).max(100).optional(),
  priceAlert:    z.boolean().optional(),
  discountAlert: z.boolean().optional(),
  isActive:      z.boolean().optional(),
});

export const NotificationPrefsSchema = z.object({
  emailAlerts:           z.boolean(),
  pushAlerts:            z.boolean(),
  dealAlerts:            z.boolean(),
  priceDropAlerts:       z.boolean(),
  weeklyDigest:          z.boolean().optional(),
  quietHoursEnabled:     z.boolean(),
  quietHoursStart:       z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
  alertThresholdPercent: z.number().int().min(1).max(90),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

const DealTypeConfigSchema = z.object({
  priceMin:    z.number().min(0).max(10000).default(0),
  priceMax:    z.number().min(0).max(10000).default(1000),
  minDiscount: z.number().int().min(0).max(100).default(0),
  brands:      z.array(z.string()).default([]),
});

export const OnboardingSchema = z.object({
  categories:      z.array(z.string()).default([]),
  dealTypeConfigs: z.record(z.string(), DealTypeConfigSchema).default({}),
  goals:           z.array(z.string()).default([]),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

// Admin deal creation/update — whitelist only safe fields
export const AdminDealSchema = z.object({
  title:           z.string().min(1).max(500),
  asin:            z.string().min(1).max(20),
  affiliateUrl:    z.string().url(),
  currentPrice:    z.number().positive(),
  originalPrice:   z.number().positive().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  brand:           z.string().max(200).optional(),
  imageUrl:        z.string().url().optional(),
  dealType:        z.enum(["PRICE_DROP", "LIGHTNING_DEAL", "LIMITED_TIME", "COUPON", "DEAL_OF_DAY", "PRIME_EXCLUSIVE"]).optional(),
  isActive:        z.boolean().optional(),
  isFeatured:      z.boolean().optional(),
});

export const AdminDealUpdateSchema = AdminDealSchema.partial();

export type AdminDealInput       = z.infer<typeof AdminDealSchema>;
export type SignUpInput           = z.infer<typeof SignUpSchema>;
export type LoginInput            = z.infer<typeof LoginSchema>;
export type ProfileInput          = z.infer<typeof ProfileSchema>;
export type WatchlistItemInput    = z.infer<typeof WatchlistItemSchema>;
export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>;
