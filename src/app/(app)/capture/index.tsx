import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images, RefreshCw, X, Zap, ZapOff } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useAddPhotoDraft } from '@/features/capture/addPhotoDraftStore';
import { useCaptureDraft } from '@/features/capture/captureDraftStore';
import { MAX_PHOTOS, pickFromLibrary } from '@/features/capture/imageSource';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import type { PhotoInput } from '@/data/repositories';

const hasCameraHardware = Device.isDevice; // Simulator => false

export default function CaptureCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [busy, setBusy] = useState(false);

  const draft = useCaptureDraft();
  const { point: gpsPoint, request: requestLocation } = useCurrentLocation();
  const libraryOpened = useRef(false);

  // Pushed on top of an in-progress entry (new-entry details, or editing a
  // saved one) to add one more photo, rather than starting a fresh capture.
  const params = useLocalSearchParams<{ mode?: string; count?: string }>();
  const isAddMode = params.mode === 'add';
  const existingCount = isAddMode ? Number(params.count ?? 0) : draft.photos.length;
  const addPhotoDraft = useAddPhotoDraft();

  // Start from a clean draft every time a fresh capture opens — but not when
  // we're just adding a photo to an entry that's already in progress, or
  // this would wipe it out from under the screen it was pushed on top of.
  useEffect(() => {
    if (!isAddMode) draft.reset();
    void requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToDetails = useCallback(
    (opts?: { fromLibrary?: boolean }) => {
      // Prefer GPS for a camera shot; for library photos the details screen
      // resolves EXIF vs GPS itself.
      if (!opts?.fromLibrary && gpsPoint && !draft.location) {
        draft.setLocation(gpsPoint, 'gps');
      }
      router.replace('/capture/details');
    },
    [gpsPoint, draft, router],
  );

  const handleLibrary = useCallback(async () => {
    const remaining = MAX_PHOTOS - existingCount;
    const picked = await pickFromLibrary(remaining);
    if (picked.length === 0) {
      if (!isAddMode && !hasCameraHardware && draft.photos.length === 0) router.back();
      return;
    }
    if (isAddMode) {
      addPhotoDraft.commit(picked);
      router.back();
      return;
    }
    draft.addPhotos(picked);
    const exif = picked.find((p) => p.exifLocation)?.exifLocation ?? null;
    if (exif) draft.setExifLocation(exif);
    goToDetails({ fromLibrary: true });
  }, [draft, goToDetails, router, isAddMode, existingCount, addPhotoDraft]);

  // No camera in the Simulator: jump straight to the library once.
  useEffect(() => {
    if (!hasCameraHardware && !libraryOpened.current) {
      libraryOpened.current = true;
      void handleLibrary();
    }
  }, [handleLibrary]);

  const handleShutter = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.75, exif: true });
      if (photo) {
        const input: PhotoInput = {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          takenAt: new Date().toISOString(),
        };
        if (isAddMode) {
          addPhotoDraft.commit([input]);
          router.back();
        } else {
          draft.addPhotos([input]);
          goToDetails();
        }
      }
    } finally {
      setBusy(false);
    }
  }, [busy, draft, goToDetails, isAddMode, addPhotoDraft, router]);

  // --- Permission gates -------------------------------------------------------

  if (!hasCameraHardware) {
    return (
      <Fallback
        title="No camera on this device"
        body="Pick a photo from your library instead."
        onLibrary={handleLibrary}
        onClose={() => router.back()}
      />
    );
  }

  if (!permission) {
    return (
      <View style={styles.centerBlack}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    const askedBefore = !permission.canAskAgain;
    return (
      <Fallback
        title="Camera access"
        body={
          askedBefore
            ? 'Enable camera access in Settings to photograph a find, or add one from your library.'
            : 'Sprigbook uses the camera so you can photograph a plant the moment you spot it.'
        }
        primaryLabel={askedBefore ? 'Open Settings' : 'Enable camera'}
        onPrimary={askedBefore ? () => Linking.openSettings() : () => void requestPermission()}
        onLibrary={handleLibrary}
        onClose={() => router.back()}
      />
    );
  }

  // --- Live camera ----------------------------------------------------------

  return (
    <View style={styles.flexBlack}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <RoundButton onPress={() => router.back()} icon={X} />
          <RoundButton
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            icon={flash === 'off' ? ZapOff : Zap}
            active={flash === 'on'}
          />
        </View>

        <View style={styles.bottomRow}>
          <RoundButton onPress={handleLibrary} icon={Images} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={handleShutter}
            disabled={busy}
            style={styles.shutterOuter}
          >
            <View style={[styles.shutterInner, busy && { opacity: 0.5 }]} />
          </Pressable>
          <RoundButton
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            icon={RefreshCw}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoundButton({
  onPress,
  icon: Icon,
  active,
}: {
  onPress: () => void;
  icon: typeof X;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: active ? '#FFD86B' : 'rgba(0,0,0,0.45)', opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon size={22} color={active ? '#1a1a1a' : '#fff'} strokeWidth={2.2} />
    </Pressable>
  );
}

function Fallback({
  title,
  body,
  primaryLabel,
  onPrimary,
  onLibrary,
  onClose,
}: {
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  onLibrary: () => void;
  onClose: () => void;
}) {
  return (
    <SafeAreaView style={styles.fallbackWrap}>
      <View style={styles.fallbackTop}>
        <RoundButton onPress={onClose} icon={X} />
      </View>
      <View style={styles.fallbackBody}>
        <Text variant="title" style={{ color: '#fff' }} center>
          {title}
        </Text>
        <Text variant="body" style={{ color: 'rgba(255,255,255,0.7)' }} center>
          {body}
        </Text>
        <View style={styles.fallbackButtons}>
          {primaryLabel && onPrimary ? (
            <Button label={primaryLabel} onPress={onPrimary} fullWidth />
          ) : null}
          <Button label="Choose from library" variant="secondary" onPress={onLibrary} fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexBlack: { flex: 1, backgroundColor: '#000' },
  centerBlack: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // Beyond the safe-area inset: on some iPhones (notably around the Dynamic
    // Island / status bar) that inset alone still leaves this row close
    // enough to the edge that system gestures can steal the touch before it
    // reaches the button.
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingBottom: 16,
  },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  fallbackWrap: { flex: 1, backgroundColor: '#111' },
  fallbackTop: { paddingHorizontal: 20, paddingTop: 12 },
  fallbackBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  fallbackButtons: { gap: 10, marginTop: 16, alignSelf: 'stretch' },
});
