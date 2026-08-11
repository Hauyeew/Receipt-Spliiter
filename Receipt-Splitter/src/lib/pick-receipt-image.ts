import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type ReceiptImage = {
  uri: string;
  base64: string;
  mimeType: string;
};

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.8,
  base64: true,
};

function assetToReceiptImage(asset: ImagePicker.ImagePickerAsset): ReceiptImage {
  if (!asset.base64) {
    throw new Error('Could not read the selected image.');
  }

  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

async function pickFromLibrary(): Promise<ReceiptImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is required to upload a receipt.');
  }

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return assetToReceiptImage(result.assets[0]);
}

async function takePhoto(): Promise<ReceiptImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera access is required to photograph a receipt.');
  }

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return assetToReceiptImage(result.assets[0]);
}

export function pickReceiptImage(): Promise<ReceiptImage | null> {
  if (Platform.OS === 'web') {
    return pickFromLibrary();
  }

  return new Promise((resolve, reject) => {
    Alert.alert('Add receipt', 'Choose how to add your receipt', [
      {
        text: 'Take photo',
        onPress: () => {
          takePhoto().then(resolve).catch(reject);
        },
      },
      {
        text: 'Choose from library',
        onPress: () => {
          pickFromLibrary().then(resolve).catch(reject);
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
