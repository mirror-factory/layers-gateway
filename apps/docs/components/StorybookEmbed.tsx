'use client';

import { useState } from 'react';

interface StorybookEmbedProps {
  /** Story ID in format "category-component--story" */
  story: string;
  /** Height of the embed */
  height?: string;
  /** Whether to show the docs panel or just the component */
  viewMode?: 'docs' | 'story';
}

/**
 * Embeds a Storybook story in the documentation.
 *
 * Storybook is built and published to /storybook/ during CI.
 *
 * @example
 * ```tsx
 * <StorybookEmbed story="components-button--primary" />
 * <StorybookEmbed story="components-card--default" height="400px" viewMode="docs" />
 * ```
 */
export function StorybookEmbed({
  story,
  height = '400px',
  viewMode = 'story'
}: StorybookEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const src = `/storybook/iframe.html?id=${story}&viewMode=${viewMode}`;

  if (hasError) {
    return (
      <div
        className="flex items-center justify-center border rounded-lg bg-muted"
        style={{ height }}
      >
        <p className="text-muted-foreground">
          Storybook not available. Run <code>bun storybook:build</code> to generate.
        </p>
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg overflow-hidden" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Loading component...</p>
        </div>
      )}
      <iframe
        src={src}
        className="w-full h-full"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        title={`Storybook: ${story}`}
      />
    </div>
  );
}
