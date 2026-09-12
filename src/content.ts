import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Post } from "./types.js";

const CONTENT_DIR = path.resolve(process.cwd(), "content", "posts");

export async function loadPosts(): Promise<{ file: string; post: Post }[]> {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".json"));
  const posts = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(CONTENT_DIR, file), "utf-8");
      return { file: path.join(CONTENT_DIR, file), post: JSON.parse(raw) as Post };
    })
  );
  return posts;
}

export function isDue(post: Post, now: Date): boolean {
  return post.status === "pending" && new Date(post.publishAt).getTime() <= now.getTime();
}

export async function savePost(file: string, post: Post): Promise<void> {
  await writeFile(file, JSON.stringify(post, null, 2) + "\n", "utf-8");
}
