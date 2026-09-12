import { TwitterApi } from "twitter-api-v2";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PlatformAdapter, Post } from "../types.js";

export class TwitterAdapter implements PlatformAdapter {
  readonly name = "twitter" as const;

  private client(): TwitterApi {
    return new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY!,
      appSecret: process.env.TWITTER_APP_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.TWITTER_APP_KEY &&
        process.env.TWITTER_APP_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
    );
  }

  async publish(post: Post): Promise<{ id: string }> {
    const client = this.client().readWrite;
    let mediaIds: [string] | [string, string] | [string, string, string] | [string, string, string, string] | undefined;

    if (post.media.type !== "none" && post.media.path) {
      const filePath = path.resolve(process.cwd(), "content", "media", post.media.path);
      const buffer = await readFile(filePath);
      const mediaId = await client.v1.uploadMedia(buffer, {
        mimeType: post.media.type === "video" ? "video/mp4" : "image/jpeg",
      });
      mediaIds = [mediaId];
    }

    const tweet = await client.v2.tweet(post.text, mediaIds ? { media: { media_ids: mediaIds } } : undefined);
    return { id: tweet.data.id };
  }
}
