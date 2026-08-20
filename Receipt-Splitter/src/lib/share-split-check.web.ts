import type { RefObject } from 'react';
import { type View } from 'react-native';
import domtoimage from 'dom-to-image';

async function shareOrDownloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Split check',
      text: 'Here is what everyone owes.',
    });
    return;
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function shareSplitCheckPhoto(
  viewRef: RefObject<View | null>,
  options: { filename: string; dialogTitle?: string },
): Promise<void> {
  const node = viewRef.current as unknown as Node | null;
  if (!node) {
    throw new Error('The split check is not ready to share yet.');
  }

  const dataUrl = await domtoimage.toPng(node);
  await shareOrDownloadDataUrl(dataUrl, options.filename);
}
