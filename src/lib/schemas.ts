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
  dealId:      z.string().cuid(),
  targetPrice: z.number().positive().optional(),
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

export type SignUpInput           = z.infer<typeof SignUpSchema>;
export type LoginInput            = z.infer<typeof LoginSchema>;
export type ProfileInput          = z.infer<typeof ProfileSchema>;
export type WatchlistItemInput    = z.infer<typeof WatchlistItemSchema>;
export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>;
