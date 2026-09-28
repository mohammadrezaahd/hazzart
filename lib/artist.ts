import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  ArtistContactSocial,
  ArtistContent,
  ArtistSocialPlatform,
} from "@/interfaces/Artist";

const CONTENT_ID = "artist";
const CONTENT_COLLECTION = "artist_content";
const SOCIALS_COLLECTION = "artist_social_platforms";
const MAX_TEXT_LENGTH = 100_000;
const MAX_ICON_LENGTH = 100_000;

interface ArtistContentDocument extends ArtistContent {
  _id: string;
  updatedAt: string;
}

interface ArtistSocialPlatformDocument extends ArtistSocialPlatform {
  _id: string;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateArtistUrl(value: string) {
  const url = value.trim();

  if (!url || url.length > 2_000 || !isValidHttpUrl(url)) {
    throw new Error("A valid http(s) URL is required.");
  }

  return url;
}

export function sanitizeSvg(svg: string) {
  const value = svg.trim();

  if (!value || value.length > MAX_ICON_LENGTH) {
    throw new Error("SVG icon must be smaller than 100 KB.");
  }

  if (!/^<svg(?:\s|>)/i.test(value) || !/<\/svg>\s*$/i.test(value)) {
    throw new Error("Only valid SVG documents are accepted.");
  }

  const blockedPatterns = [
    /<script\b/i,
    /<foreignObject\b/i,
    /<!DOCTYPE/i,
    /<!ENTITY/i,
    /\bon[a-z]+\s*=/i,
    /javascript\s*:/i,
    /data:text\/html/i,
    // /https?:\/\//i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(value))) {
    throw new Error("SVG contains unsupported or unsafe content.");
  }

  return value;
}

async function getContentCollection(): Promise<Collection<ArtistContentDocument>> {
  const db = await getDatabase();
  return db.collection<ArtistContentDocument>(CONTENT_COLLECTION);
}

async function getSocialsCollection(): Promise<Collection<ArtistSocialPlatformDocument>> {
  const db = await getDatabase();
  return db.collection<ArtistSocialPlatformDocument>(SOCIALS_COLLECTION);
}

const emptyContent = (): ArtistContent => ({
  cvText: "",
  contactText: "",
  socials: [],
});

export async function getArtistContent(): Promise<ArtistContent> {
  const collection = await getContentCollection();
  const document = await collection.findOne({ _id: CONTENT_ID });

  if (!document) {
    return emptyContent();
  }

  return {
    cvText: document.cvText,
    contactText: document.contactText,
    socials: [...document.socials].sort((a, b) => a.order - b.order),
  };
}

export async function getArtistSocialPlatforms(): Promise<ArtistSocialPlatform[]> {
  const collection = await getSocialsCollection();
  const documents = await collection.find({}).sort({ createdAt: 1 }).toArray();

  return documents.map(({ _id, ...platform }) => platform);
}

export async function getArtistAdminPayload() {
  const [content, socialPlatforms] = await Promise.all([
    getArtistContent(),
    getArtistSocialPlatforms(),
  ]);

  return { content, socialPlatforms };
}

export async function updateArtistContent(input: ArtistContent) {
  const cvText = input.cvText.trim();
  const contactText = input.contactText.trim();

  if (cvText.length > MAX_TEXT_LENGTH || contactText.length > MAX_TEXT_LENGTH) {
    throw new Error("Artist text is too long.");
  }

  if (!Array.isArray(input.socials) || input.socials.length > 50) {
    throw new Error("Invalid social media selection.");
  }

  const socialsCollection = await getSocialsCollection();
  const platformIds = [...new Set(input.socials.map((item) => item.platformId))];

  if (platformIds.length !== input.socials.length) {
    throw new Error("A social media platform can only be selected once.");
  }

  const existingCount = await socialsCollection.countDocuments({
    _id: { $in: platformIds },
  });

  if (existingCount !== platformIds.length) {
    throw new Error("One or more selected social platforms no longer exist.");
  }

  const socials: ArtistContactSocial[] = input.socials.map((item, index) => ({
    platformId: item.platformId,
    url: validateArtistUrl(item.url),
    order: index,
  }));

  const collection = await getContentCollection();
  const updatedAt = new Date().toISOString();

  await collection.updateOne(
    { _id: CONTENT_ID },
    {
      $set: { cvText, contactText, socials, updatedAt },
      $setOnInsert: { _id: CONTENT_ID },
    },
    { upsert: true },
  );

  return getArtistContent();
}

export async function createArtistSocialPlatform(input: {
  name: string;
  defaultUrl: string;
  iconSvg: string;
}) {
  const name = input.name.trim();

  if (!name || name.length > 80) {
    throw new Error("Social media name must be between 1 and 80 characters.");
  }

  const defaultUrl = validateArtistUrl(input.defaultUrl);
  const iconSvg = sanitizeSvg(input.iconSvg);
  const collection = await getSocialsCollection();
  const existing = await collection.find({}).project({ name: 1 }).toArray();

  if (existing.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("A social media platform with this name already exists.");
  }

  const id = randomUUID();
  const platform: ArtistSocialPlatformDocument = {
    _id: id,
    id,
    name,
    defaultUrl,
    iconSvg,
    createdAt: new Date().toISOString(),
  };

  await collection.insertOne(platform);

  const { _id, ...result } = platform;
  return result;
}

export async function deleteArtistSocialPlatform(id: string) {
  const socialsCollection = await getSocialsCollection();
  const result = await socialsCollection.deleteOne({ _id: id });

  if (!result.deletedCount) {
    return false;
  }

  const contentCollection = await getContentCollection();
  await contentCollection.updateOne(
    { _id: CONTENT_ID },
    { $pull: { socials: { platformId: id } } },
  );

  return true;
}
