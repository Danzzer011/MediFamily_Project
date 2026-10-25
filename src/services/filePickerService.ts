import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { AppError } from '../models/errors';
import type { PickedFile } from '../models/MedicalDocument';

// Camera and file choosing (FR04, FR07). Each function returns null when the user cancels.

function fromImageAsset(asset: ImagePicker.ImagePickerAsset, fallbackName: string): PickedFile {
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? fallbackName,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new AppError('not_allowed', 'Camera access is turned off for MediFamily. Allow it in your phone’s settings.');
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled) return null;
  return fromImageAsset(result.assets[0], `photo-${Date.now()}.jpg`);
}

export async function chooseImage(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled) return null;
  return fromImageAsset(result.assets[0], `image-${Date.now()}.jpg`);
}

export async function choosePdf(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
}
