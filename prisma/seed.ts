// Prisma 7 — seed uses adapter-based db singleton
// Run via: tsx --env-file .env prisma/seed.ts (env-file loaded before module eval)
import { db } from "../src/lib/db";

const categories = [
  { name: "Electronics",             slug: "electronics",    amazonBrowseNodeId: "172282" },
  { name: "Cell Phones",             slug: "cell-phones",    amazonBrowseNodeId: "2335752011" },
  { name: "Computers & Accessories", slug: "computers",      amazonBrowseNodeId: "541966" },
  { name: "Camera & Photo",          slug: "camera-photo",   amazonBrowseNodeId: "502394" },
  { name: "Automotive",              slug: "automotive",     amazonBrowseNodeId: "15690151" },
  { name: "Baby",                    slug: "baby",           amazonBrowseNodeId: "165796011" },
  { name: "Beauty",                  slug: "beauty",         amazonBrowseNodeId: "3760901" },
  { name: "Books",                   slug: "books",          amazonBrowseNodeId: "283155" },
  { name: "Fashion",                 slug: "fashion",        amazonBrowseNodeId: "7141123011" },
  { name: "Fitness",                 slug: "fitness",        amazonBrowseNodeId: "3407731" },
  { name: "Home",                    slug: "home",           amazonBrowseNodeId: "1055398" },
  { name: "Kitchen",                 slug: "kitchen",        amazonBrowseNodeId: "284507" },
  { name: "Toys",                    slug: "toys",           amazonBrowseNodeId: "165793011" },
  { name: "Back to School",          slug: "back-to-school", amazonBrowseNodeId: "1069242" },
  { name: "Everyday Essentials",     slug: "essentials",     amazonBrowseNodeId: "16310101" },
  { name: "Amazon Brands",           slug: "amazon-brands",  amazonBrowseNodeId: "2528919011" },
];

async function main() {
  console.log("Seeding categories…");
  for (const cat of categories) {
    await db.category.upsert({
      where:  { slug: cat.slug },
      create: cat,
      update: { name: cat.name, amazonBrowseNodeId: cat.amazonBrowseNodeId },
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
