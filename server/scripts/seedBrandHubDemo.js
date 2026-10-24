import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Brand } from "../src/models/Brand.js";
import { Project } from "../src/models/Project.js";
import { Campaign } from "../src/models/Campaign.js";
import { MediaAsset } from "../src/models/MediaAsset.js";
import { assertStrongPassword, hashPassword } from "../src/utils/password.js";

const dryRun = process.argv.includes("--dry-run");
const verifyOnly = process.argv.includes("--verify");
const manifestPath = path.resolve("..", "client", "public", "demo-media-manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const clients = [
  ["SoleNova", "shoes", "Mira Solis", "Sneaker launches and everyday footwear"],
  ["TechHaven", "electronics", "Noah Verne", "Modern devices and workspaces"],
  ["UrbanNest", "furniture", "Lena Arden", "Furniture for thoughtful living spaces"],
  ["ThreadAura", "fashion", "Ava Mercer", "Seasonal apparel and personal style"],
  ["ChronaStyle", "watches", "Theo Morrow", "Watches and considered accessories"],
  ["GlowTheory", "beauty", "Iris Vale", "Skincare and beauty essentials"],
  ["BrewCanvas", "beverages", "Jules Rowan", "Coffee and beverage stories"],
  ["CarryCraft", "accessories", "Rena Ellis", "Bags and everyday carry"],
  ["ActivePulse", "fitness", "Kai Sterling", "Fitness and movement products"],
  ["HomeLoom", "interiors", "Nora Quinn", "Interior details and lifestyle"],
  ["SoundVista", "audio", "Eli Bennett", "Audio products and listening spaces"],
  ["PureBloom", "personal-care", "Maya Fern", "Personal care rituals"],
  ["DeskForm", "office", "Owen Hale", "Office objects for focused work"],
  ["KitchenMuse", "kitchen", "Sana Wells", "Kitchen and dining collections"],
  ["EverydayEdit", "lifestyle", "Ada Rivers", "Everyday consumer essentials"],
];
const designers = [
  ["Aarav Mehta", "Product Photographer", ["product photography", "shoes", "furniture"]],
  ["Meera Shah", "Social Media Designer", ["social media", "fashion", "beauty"]],
  ["Riya Patel", "Brand Identity Designer", ["branding", "furniture", "lifestyle"]],
  ["Dev Kapoor", "Motion Designer", ["motion graphics", "electronics", "audio"]],
  ["Kavya Desai", "Digital Experience Designer", ["ui design", "office", "kitchen"]],
  ["Arjun Rao", "Video Editor", ["video editing", "fashion", "beverages"]],
  ["Nisha Verma", "Creative Advertising Designer", ["advertising", "beauty", "personal-care"]],
  ["Ishaan Joshi", "Visual Content Designer", ["visual content", "fitness", "accessories"]],
];
const categoryDesigners = {
  shoes: [0, 1], electronics: [0, 3], furniture: [0, 2], fashion: [1, 5],
  watches: [0, 2], beauty: [0, 6], beverages: [1, 5], accessories: [2, 7],
  fitness: [5, 7], interiors: [0, 2], audio: [3, 7], "personal-care": [1, 6],
  office: [3, 4], kitchen: [4, 5], lifestyle: [2, 7],
};
const idFor = (kind, key) => new mongoose.Types.ObjectId(crypto.createHash("sha256").update(`brandhub-demo:${kind}:${key}`).digest("hex").slice(0, 24));
const accountEmail = (name) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}@brandhub.example`;

async function verify() {
  const counts = {
    clients: await User.countDocuments({ demoKey: /^brandhub:client:/ }),
    designers: await User.countDocuments({ demoKey: /^brandhub:designer:/ }),
    admins: await User.countDocuments({ demoKey: "brandhub:admin" }),
    brands: await Brand.countDocuments({ demoKey: /^brandhub:brand:/ }),
    projects: await Project.countDocuments({ demoKey: /^brandhub:project:/ }),
    campaigns: await Campaign.countDocuments({ demoKey: /^brandhub:campaign:/ }),
    media: await MediaAsset.countDocuments({ demoKey: /^brandhub:media:/ }),
  };
  const projects = await Project.find({ demoKey: /^brandhub:project:/ }).lean();
  const orphanProjects = projects.filter((project) => !project.clientId || !project.designerIds?.length);
  const media = await MediaAsset.find({ demoKey: /^brandhub:media:/ }).lean();
  const orphanMedia = media.filter((asset) => !projects.some((project) => String(project._id) === String(asset.projectId)));
  const result = { database: mongoose.connection.name, counts, orphanProjects: orphanProjects.length, orphanMedia: orphanMedia.length };
  console.log(JSON.stringify(result, null, 2));
  if (counts.clients !== 15 || counts.designers !== 8 || counts.admins !== 1 || counts.brands !== 15 || counts.projects < 30 || counts.campaigns < 30 || counts.media !== manifest.assets.length || orphanProjects.length || orphanMedia.length) throw new Error("Demo seed verification failed");
}

async function main() {
  if (dryRun) {
    const missingPaths = [];
    for (const asset of manifest.assets) {
      const file = path.resolve("..", "client", "public", asset.localUrl.slice(1));
      try { await fs.access(file); } catch { missingPaths.push(asset.localUrl); }
    }
    const counts = manifest.assets.reduce((value, asset) => { value[asset.mediaType] = (value[asset.mediaType] || 0) + 1; return value; }, {});
    console.log(JSON.stringify({ targetDatabase: "brandhub_demo", clients: clients.length, designers: designers.length, admin: 1, brands: clients.length, projects: clients.length * 2, campaigns: clients.length * 2, media: counts, missingPaths }, null, 2));
    if (missingPaths.length) throw new Error("Local demo media files are missing");
    return;
  }
  const uri = process.env.MONGODB_URI || "";
  const parsed = new URL(uri);
  if (process.env.NODE_ENV === "production" || parsed.pathname !== "/brandhub_demo" || !parsed.hostname.endsWith(".mongodb.net")) throw new Error("Use an explicit non-production Atlas brandhub_demo URI");
  if (!verifyOnly) {
    if (!process.env.DEMO_USER_PASSWORD || !process.env.ADMIN_PASSWORD) throw new Error("DEMO_USER_PASSWORD and ADMIN_PASSWORD must be set in server/.env");
    assertStrongPassword(process.env.DEMO_USER_PASSWORD);
    assertStrongPassword(process.env.ADMIN_PASSWORD);
  }
  await connectDatabase(uri);
  if (mongoose.connection.name !== "brandhub_demo") throw new Error("Connected to the wrong database");
  if (verifyOnly) return verify();
  const passwordHash = await hashPassword(process.env.DEMO_USER_PASSWORD);
  const adminEmail = "admin@brandhub.example";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin && existingAdmin.role !== "admin") throw new Error("Demo admin email belongs to a different role");
  const adminId = existingAdmin?._id || idFor("admin", adminEmail);
  if (!existingAdmin) await User.create({ _id: adminId, name: "BRANDHUB Administrator", email: adminEmail, passwordHash: await hashPassword(process.env.ADMIN_PASSWORD), role: "admin", demoKey: "brandhub:admin" });
  else if (!existingAdmin.demoKey) await User.updateOne({ _id: adminId }, { $set: { demoKey: "brandhub:admin" } });
  for (const [brandName, category, person, description] of clients) {
    const clientId = idFor("client", brandName);
    const email = accountEmail(person);
    await User.updateOne({ email }, { $setOnInsert: { _id: clientId, name: person, email, passwordHash, role: "client", demoKey: `brandhub:client:${brandName}` } }, { upsert: true });
    const actual = await User.findOne({ email });
    if (actual.role !== "client") throw new Error(`Demo email collision for ${brandName}`);
    await Brand.updateOne({ demoKey: `brandhub:brand:${brandName}` }, { $setOnInsert: { _id: idFor("brand", brandName), name: brandName, category, description, clientId: actual._id } }, { upsert: true });
  }
  for (const [name, title, skills] of designers) {
    const email = accountEmail(name);
    await User.updateOne({ email }, { $setOnInsert: { _id: idFor("designer", name), name, email, passwordHash, role: "designer", professionalTitle: title, bio: `${title} creating fictional BrandHub demo campaigns.`, skills, mustChangePassword: true, demoKey: `brandhub:designer:${name}` } }, { upsert: true });
    const actual = await User.findOne({ email });
    if (actual.role !== "designer") throw new Error(`Demo email collision for ${name}`);
  }
  for (const [brandName, category, person, description] of clients) {
    const client = await User.findOne({ email: accountEmail(person) });
    const brand = await Brand.findOne({ demoKey: `brandhub:brand:${brandName}` });
    const assigned = await Promise.all(categoryDesigners[category].map((index) => User.findOne({ email: accountEmail(designers[index][0]) })));
    for (const number of [1, 2]) {
      const key = `${brandName}:${number}`;
      const title = number === 1 ? `${brandName} Product Launch` : `${brandName} Social Story`;
      const projectId = idFor("project", key);
      await Project.updateOne({ demoKey: `brandhub:project:${key}` }, { $setOnInsert: { _id: projectId, title, description: `${description}. Fictional creative work prepared for a BrandHub demonstration.`, category: number === 1 ? "Marketing Creative" : "Social Media", status: "active", visibility: "private", clientId: client._id, designerIds: assigned.map((user) => user._id), createdBy: adminId } }, { upsert: true });
      await Campaign.updateOne({ demoKey: `brandhub:campaign:${key}` }, { $setOnInsert: { _id: idFor("campaign", key), name: title, description: `${brandName} demonstration campaign.`, category, clientId: client._id, brandId: brand._id, projectId, designerIds: assigned.map((user) => user._id), status: "active" } }, { upsert: true });
    }
  }
  const mediaBrand = { shoes: "SoleNova", electronics: "TechHaven", furniture: "UrbanNest", fashion: "ThreadAura", beauty: "GlowTheory", beverages: "BrewCanvas" };
  const usage = new Map();
  for (const asset of manifest.assets) {
    const brandName = mediaBrand[asset.category];
    if (!brandName) throw new Error(`No matching demo brand for ${asset.category}`);
    const brand = await Brand.findOne({ demoKey: `brandhub:brand:${brandName}` });
    const number = (usage.get(brandName) || 0) % 2 + 1;
    usage.set(brandName, (usage.get(brandName) || 0) + 1);
    const project = await Project.findOne({ demoKey: `brandhub:project:${brandName}:${number}` });
    const campaign = await Campaign.findOne({ demoKey: `brandhub:campaign:${brandName}:${number}` });
    const portrait = Boolean(asset.width && asset.height && asset.height > asset.width * 1.3);
    const contentType = asset.mediaType === "video" ? portrait ? "reel" : "post" : portrait ? "story" : "post";
    await MediaAsset.updateOne({ demoKey: `brandhub:media:${asset.id}` }, { $setOnInsert: { _id: idFor("media", asset.id), storageType: "local", mediaType: asset.mediaType, title: asset.title, description: asset.description, category: asset.category, contentType, mimeType: asset.mediaType === "video" ? "video/mp4" : "image/webp", originalFilename: asset.originalFilename, storedFilename: asset.storedFilename, localPath: asset.localUrl, thumbnailUrl: asset.thumbnailUrl || "", fileSize: asset.bytes, width: asset.width, height: asset.height, duration: asset.duration, checksum: asset.sourceChecksum, ownerClientId: brand.clientId, assignedDesignerId: project.designerIds[0] || null, projectId: project._id, campaignId: campaign._id, visibility: "private", status: "draft", usageRightsStatus: "unverified" } }, { upsert: true });
  }
  await verify();
}

main().catch((error) => { console.error(`BrandHub demo seed failed: ${error.message}`); process.exitCode = 1; }).finally(disconnectDatabase);
