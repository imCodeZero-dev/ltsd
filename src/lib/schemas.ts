import { z } from "zod";

export const SignUpSchema = z.object({
  name:     z.string().min(2).max(50),
  email:    z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
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
    .min(8)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const OnboardingSchema = z.object({
  categories:  z.array(z.string()).default([]),
  dealTypes:   z.array(z.string()).default([]),
  priceMin:    z.number().int().min(0).max(10000).default(0),
  priceMax:    z.number().int().min(0).max(10000).default(1000),
  minDiscount: z.number().int().min(0).max(100).default(0),
  brands:      z.array(z.string()).default([]),
  goals:       z.array(z.string()).default([]),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export type SignUpInput           = z.infer<typeof SignUpSchema>;
export type LoginInput            = z.infer<typeof LoginSchema>;
export type ProfileInput          = z.infer<typeof ProfileSchema>;
export type WatchlistItemInput    = z.infer<typeof WatchlistItemSchema>;
export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>;
