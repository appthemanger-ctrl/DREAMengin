export interface PublishIntentInput {
  draft?: string | null;
  captionResult?: string | null;
  videoTitle?: string | null;
  draftTopic?: string | null;
  captionTopic?: string | null;
  hookTopic?: string | null;
  seoInput?: string | null;
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

interface PublishErrorBody {
  error?: string;
}

interface PublishOkBody {
  post?: {
    id?: string;
  };
}

interface PublishResponseLike {
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<unknown>;
}

export interface PublishToDreamRParams {
  content: string;
  platforms: string[];
  fetchImpl?: (input: string, init?: RequestInit) => Promise<PublishResponseLike>;
  onPublished: (payload: { contentId: string; platform: string }) => void;
}

export function resolvePublishIntent(input: PublishIntentInput): string | null {
  const directDraft = clean(input.draft);
  if (directDraft) return directDraft;

  const caption = clean(input.captionResult);
  if (caption) return caption;

  const videoTitle = clean(input.videoTitle);
  if (videoTitle) return `New video: ${videoTitle}`;

  return (
    clean(input.draftTopic)
    ?? clean(input.captionTopic)
    ?? clean(input.hookTopic)
    ?? clean(input.seoInput)
    ?? null
  );
}

export function formatPublishError(
  response: Pick<PublishResponseLike, 'status' | 'statusText'>,
  errorBody?: PublishErrorBody,
): string {
  const explicit = clean(errorBody?.error);
  if (explicit) return explicit;

  const statusText = clean(response.statusText);
  if (statusText) return statusText;

  return `Failed to publish to DreamR (${response.status || 'unknown'})`;
}

export async function publishToDreamR({
  content,
  platforms,
  fetchImpl = fetch,
  onPublished,
}: PublishToDreamRParams): Promise<string> {
  const response = await fetchImpl('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      visibility: 'public',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as PublishErrorBody;
    throw new Error(formatPublishError(response, errorBody));
  }

  const payload = await response.json().catch(() => ({})) as PublishOkBody;
  const contentId = payload.post?.id?.trim();
  if (!contentId) {
    throw new Error('DreamR publish response did not include a post id.');
  }
  onPublished({
    contentId,
    platform: platforms.join(','),
  });
  return contentId;
}
