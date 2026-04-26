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
