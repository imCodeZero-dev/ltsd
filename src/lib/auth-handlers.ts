// Re-export the NextAuth route handlers.
// Having a separate file avoids a circular-import between auth.ts and the route.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
