export type Platform = "twitter" | "instagram" | "facebook" | "tiktok";

export type MediaType = "none" | "image" | "video";

export interface PostMedia {
  type: MediaType;
  /** Sciezka do pliku wzgledem content/media, uzywana do bezposredniego uploadu (np. X). */
  path?: string;
  /** Publiczny URL pliku, wymagany przez Instagram, Facebook i TikTok. */
  url?: string;
}

export type PostStatus = "pending" | "published" | "failed";

export interface PlatformResult {
  platform: Platform;
  id?: string;
  error?: string;
}

export interface Post {
  id: string;
  text: string;
  media: PostMedia;
  platforms: Platform[];
  /** ISO 8601, np. 2026-09-15T09:00:00Z. Post publikowany gdy publishAt <= teraz. */
  publishAt: string;
  status: PostStatus;
  results?: PlatformResult[];
  publishedAt?: string;
}

export interface PlatformAdapter {
  readonly name: Platform;
  isConfigured(): boolean;
  publish(post: Post): Promise<{ id: string }>;
}
