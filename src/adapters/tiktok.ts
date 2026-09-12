import type { PlatformAdapter, Post } from "../types.js";

const API_BASE = "https://open.tiktokapis.com/v2";

export class TikTokAdapter implements PlatformAdapter {
  readonly name = "tiktok" as const;

  isConfigured(): boolean {
    return Boolean(process.env.TIKTOK_ACCESS_TOKEN);
  }

  async publish(post: Post): Promise<{ id: string }> {
    if (post.media.type !== "video" || !post.media.url) {
      throw new Error("TikTok wymaga wideo z publicznym URL-em (media.type=video, media.url ustawiony).");
    }

    const accessToken = process.env.TIKTOK_ACCESS_TOKEN!;
    const res = await fetch(`${API_BASE}/post/publish/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: post.text,
          privacy_level: process.env.TIKTOK_PRIVACY_LEVEL ?? "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: post.media.url,
        },
      }),
    });

    const json = (await res.json()) as { error?: { code?: string }; data?: { publish_id: string } };
    if (!res.ok || json.error?.code !== "ok") {
      throw new Error(`TikTok API error: ${JSON.stringify(json)}`);
    }
    return { id: json.data!.publish_id };
  }
}
