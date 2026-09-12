import "dotenv/config";
import { loadPosts, isDue, savePost } from "./content.js";
import { TwitterAdapter } from "./adapters/twitter.js";
import { FacebookAdapter, InstagramAdapter } from "./adapters/meta.js";
import { TikTokAdapter } from "./adapters/tiktok.js";
import type { Platform, PlatformAdapter, PlatformResult, Post } from "./types.js";

const adapters: Record<Platform, PlatformAdapter> = {
  twitter: new TwitterAdapter(),
  facebook: new FacebookAdapter(),
  instagram: new InstagramAdapter(),
  tiktok: new TikTokAdapter(),
};

async function publishPost(post: Post): Promise<PlatformResult[]> {
  const results: PlatformResult[] = [];

  for (const platform of post.platforms) {
    const adapter = adapters[platform];
    if (!adapter) {
      results.push({ platform, error: `Brak adaptera dla platformy: ${platform}` });
      continue;
    }
    if (!adapter.isConfigured()) {
      results.push({ platform, error: `Adapter ${platform} nie jest skonfigurowany (brak zmiennych srodowiskowych).` });
      continue;
    }
    try {
      const { id } = await adapter.publish(post);
      results.push({ platform, id });
      console.log(`[OK] ${post.id} -> ${platform}: ${id}`);
    } catch (err) {
      const detail = (err as { data?: unknown })?.data;
      const message = err instanceof Error ? err.message : String(err);
      const full = detail ? `${message} | ${JSON.stringify(detail)}` : message;
      results.push({ platform, error: full });
      console.error(`[FAIL] ${post.id} -> ${platform}: ${full}`);
    }
  }

  return results;
}

async function main() {
  const now = new Date();
  const posts = await loadPosts();
  const due = posts.filter(({ post }) => isDue(post, now));

  if (due.length === 0) {
    console.log("Brak wpisow do publikacji.");
    return;
  }

  let hadFailure = false;

  for (const { file, post } of due) {
    const results = await publishPost(post);
    const allOk = results.every((r) => !r.error);

    post.results = results;
    post.status = allOk ? "published" : "failed";
    post.publishedAt = now.toISOString();
    if (!allOk) hadFailure = true;

    await savePost(file, post);
  }

  if (hadFailure) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
