"use client";

import { useEffect, useState } from 'react';
import { FarmFileService } from '@/services/activityService';
import { Attachment } from '@/types/activity';

interface Props {
  attachments?: Attachment[] | null;
}

/**
 * The bucket is private, so every thumbnail needs a signed URL. They are
 * resolved together on mount and held for the life of the view — the signature
 * outlives any realistic session on this screen.
 */
export default function AttachmentThumbs({ attachments }: Props) {
  const [urls, setUrls] = useState<{ attachment: Attachment; url: string }[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images = (attachments ?? []).filter((a) => a.type?.startsWith('image/'));
    if (images.length === 0) return;

    Promise.all(
      images.map(async (attachment) => ({
        attachment,
        url: (await FarmFileService.signedUrl(attachment.path)) ?? '',
      }))
    )
      .then((resolved) => {
        if (!cancelled) setUrls(resolved.filter((r) => r.url));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [attachments]);

  if (!attachments?.length) return null;

  if (failed) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {attachments.length} photo{attachments.length > 1 ? 's' : ''} (could not load)
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2" data-testid="attachment-thumbs">
      {urls.map(({ attachment, url }) => (
        <a
          key={attachment.path}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded border border-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-gray-700"
          title={attachment.name}
        >
          {/* Signed storage URLs are not a configured next/image host, and
              these are small thumbnails, so a plain img is correct here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={attachment.name}
            className="h-16 w-16 object-cover"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}
