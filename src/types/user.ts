export type UserRole = "USER" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface UserPreferences {
  userId: string;
  categories: string[];
  dealTypes: string[];
  brandPreferences: string[];
  minDiscountPercent: number | null;
  maxPrice: number | null;
  notifyLightning: boolean;
  notifyLimitedTime: boolean;
  notifyPriceDrops: boolean;
}
