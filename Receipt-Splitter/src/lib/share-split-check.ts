import type { RefObject } from 'react';
import { type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

function toFileUri(uri: string): string {
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('data:') ||
    uri.startsWith('ph://')
  ) {
    return uri;
  }

  return `file://${uri}`;
}

export async function shareSplitCheckPhoto(
  viewRef: RefObject<View | null>,
  options: { filename: string; dialogTitle?: string },
): Promise<void> {
  if (!viewRef.current) {
    throw new Error('The split check is not ready to share yet.');
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(toFileUri(uri), {
    mimeType: 'image/png',
    dialogTitle: options.dialogTitle ?? 'Send split check',
    UTI: 'public.png',
  });
}
