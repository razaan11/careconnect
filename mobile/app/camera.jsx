// Photo proof + delivery confirmation.
//
// Flow: live camera -> capture -> preview (retake/confirm) -> upload the
// photo to POST /donations/:id/photo-proof -> call
// POST /donations/:id/confirm-delivery with the OTP carried over from the
// pickup detail screen -> success. This is the last, most consequential
// step in the whole app (it's what actually marks a donation DELIVERED),
// so failures here get a clear retry rather than silently dying.
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../lib/api';
import PrimaryButton from '../components/PrimaryButton';
import StampBadge from '../components/StampBadge';
import EmptyState from '../components/EmptyState';
import { colors, radii, spacing, type } from '../lib/theme';

const STAGE = {
  CAMERA: 'camera',
  PREVIEW: 'preview',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function CameraScreen() {
  const { id, otp } = useLocalSearchParams();
  const router = useRouter();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [stage, setStage] = useState(STAGE.CAMERA);
  const [photo, setPhoto] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setPhoto(result);
      setStage(STAGE.PREVIEW);
    } catch (err) {
      setErrorMessage("Couldn't capture a photo. Try again.");
    }
  }

  function handleRetake() {
    setPhoto(null);
    setStage(STAGE.CAMERA);
  }

  async function handleConfirm() {
    if (!photo) return;
    setStage(STAGE.UPLOADING);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('photos', {
        uri: photo.uri,
        name: `proof-${id}-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      await api.post(`/donations/${id}/photo-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.post(`/donations/${id}/confirm-delivery`, { otp });

      setStage(STAGE.SUCCESS);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          'Could not confirm this delivery. Check your connection and try again.'
      );
      setStage(STAGE.ERROR);
    }
  }

  function handleDone() {
    router.replace('/(tabs)/pickups');
  }

  if (stage === STAGE.SUCCESS) {
    return (
      <View style={styles.centerScreen}>
        <StampBadge label="DELIVERED" color={colors.accent} icon="checkmark-done" />
        <Text style={styles.successTitle}>Delivery confirmed</Text>
        <Text style={styles.successBody}>
          Photo proof is on file and the trust has been notified. Thank you for keeping the chain
          verified.
        </Text>
        <PrimaryButton
          label="Back to pickups"
          onPress={handleDone}
          variant="accent"
          style={styles.doneButton}
        />
      </View>
    );
  }

  if (stage === STAGE.ERROR) {
    return (
      <View style={styles.centerScreen}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Delivery not confirmed"
          body={errorMessage}
          actionLabel="Try again"
          onAction={handleConfirm}
        />
        <Pressable onPress={handleRetake} style={styles.retakeLink}>
          <Text style={styles.retakeLinkText}>Retake photo instead</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.centerScreen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerScreen}>
        <EmptyState
          icon="camera-outline"
          tone="warning"
          title="Camera access needed"
          body="CareConnect needs your camera to capture photo proof that this donation was delivered."
          actionLabel="Allow camera"
          onAction={requestPermission}
        />
        <Pressable onPress={() => router.back()} style={styles.retakeLink}>
          <Text style={styles.retakeLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === STAGE.PREVIEW && photo) {
    return (
      <View style={styles.flex}>
        <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.previewOverlay}>
          <Text style={styles.previewLabel}>PROOF OF DELIVERY</Text>
          <Text style={styles.previewHint}>Make sure the items and the trust's space are clearly visible.</Text>
        </View>
        <View style={styles.previewActions}>
          <PrimaryButton
            label="Retake"
            onPress={handleRetake}
            variant="outline"
            fullWidth={false}
            style={[styles.previewButton, styles.retakeButton]}
            icon={<Ionicons name="refresh-outline" size={18} color={colors.primary} />}
          />
          <PrimaryButton
            label="Use photo"
            onPress={handleConfirm}
            variant="accent"
            fullWidth={false}
            style={styles.previewButton}
            icon={<Ionicons name="checkmark-outline" size={18} color={colors.white} />}
          />
        </View>
      </View>
    );
  }

  if (stage === STAGE.UPLOADING) {
    return (
      <View style={styles.centerScreen}>
        <StampBadge label="SENDING" color={colors.accent} icon="cloud-upload-outline" />
        <Text style={styles.successBody}>Uploading photo proof and confirming delivery…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.topBarLabel}>Photo proof · #{id}</Text>
          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            style={styles.iconButton}
            hitSlop={12}
          >
            <Ionicons name="camera-reverse-outline" size={24} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.captureHint}>Frame the donation and the trust's sign-in area</Text>
          <Pressable
            onPress={handleCapture}
            disabled={!cameraReady}
            style={({ pressed }) => [
              styles.captureButton,
              { opacity: cameraReady ? (pressed ? 0.8 : 1) : 0.4 },
            ]}
          >
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  centerScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLabel: { color: colors.white, fontSize: 13, fontWeight: '700' },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 48,
    gap: spacing.md,
  },
  captureHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
  },
  preview: { flex: 1, width: '100%' },
  previewOverlay: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
  },
  previewLabel: {
    ...type.eyebrow,
    color: colors.white,
    marginBottom: 4,
  },
  previewHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewButton: { flex: 1 },
  retakeButton: { backgroundColor: 'rgba(255,255,255,0.92)' },
  successTitle: { ...type.h1, textAlign: 'center' },
  successBody: { ...type.bodyRegular, color: colors.muted, textAlign: 'center' },
  doneButton: { marginTop: spacing.sm, paddingHorizontal: spacing.xxl },
  retakeLink: { marginTop: spacing.md },
  retakeLinkText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
