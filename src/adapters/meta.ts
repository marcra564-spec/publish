import type { PlatformAdapter, Post } from "../types.js";

const GRAPH_API_VERSION = "v21.0";

async function graphPost(pathSegment: string, params: Record<string, string>): Promise<any> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pathSegment}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Graph API error (${pathSegment}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function graphGet(pathSegment: string, params: Record<string, string>): Promise<any> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pathSegment}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Graph API error (${pathSegment}): ${JSON.stringify(json)}`);
  }
  return json;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilMediaReady(creationId: string, accessToken: string): Promise<void> {
  const maxAttempts = 15;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await graphGet(creationId, { fields: "status_code", access_token: accessToken });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error(`Instagram nie przetworzyl mediow (creation_id=${creationId}): ${JSON.stringify(status)}`);
    }
    await sleep(2000);
  }
  throw new Error(`Instagram nie przetworzyl mediow w oczekiwanym czasie (creation_id=${creationId})`);
}

export class FacebookAdapter implements PlatformAdapter {
  readonly name = "facebook" as const;

  isConfigured(): boolean {
    return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
  }

  async publish(post: Post): Promise<{ id: string }> {
    const pageId = process.env.FACEBOOK_PAGE_ID!;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;

    if (post.media.type === "image" && post.media.url) {
      const result = await graphPost(`${pageId}/photos`, {
        url: post.media.url,
        caption: post.text,
        access_token: accessToken,
      });
      return { id: result.post_id ?? result.id };
    }

    if (post.media.type === "video" && post.media.url) {
      const result = await graphPost(`${pageId}/videos`, {
        file_url: post.media.url,
        description: post.text,
        access_token: accessToken,
      });
      return { id: result.id };
    }

    const result = await graphPost(`${pageId}/feed`, {
      message: post.text,
      access_token: accessToken,
    });
    return { id: result.id };
  }
}

export class InstagramAdapter implements PlatformAdapter {
  readonly name = "instagram" as const;

  isConfigured(): boolean {
    return Boolean(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN);
  }

  async publish(post: Post): Promise<{ id: string }> {
    const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN!;

    if (!post.media.url || post.media.type === "none") {
      throw new Error("Instagram wymaga publicznego URL-a mediow (media.url) - post bez mediow nie jest wspierany.");
    }

    const containerParams: Record<string, string> = {
      caption: post.text,
      access_token: accessToken,
    };
    if (post.media.type === "video") {
      containerParams.media_type = "REELS";
      containerParams.video_url = post.media.url;
    } else {
      containerParams.image_url = post.media.url;
    }

    const container = await graphPost(`${igUserId}/media`, containerParams);
    await waitUntilMediaReady(container.id, accessToken);
    const published = await graphPost(`${igUserId}/media_publish`, {
      creation_id: container.id,
      access_token: accessToken,
    });
    return { id: published.id };
  }
}
