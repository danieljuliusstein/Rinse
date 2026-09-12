/**
 * AddDamageSheet
 * Screen 2b-iii — "Add damage photo" bottom sheet
 * Screen 2b-iv — Area + note form (shown after photo is picked)
 *
 * Uses react-native-modal for the sheet overlay.
 * Install: expo install react-native-modal
 * Photo:   expo install expo-image-picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font } from './theme';
import { DamageRecord, AREA_OPTIONS } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  vehicleId: string;
  onClose: () => void;
  onSaved: (record: DamageRecord) => void;
};

type Step = 'sheet' | 'form';

// ─── Component ───────────────────────────────────────────────────────────────
export default function AddDamageSheet({ visible, vehicleId, onClose, onSaved }: Props) {
  const [step, setStep]           = useState<Step>('sheet');
  const [photoUri, setPhotoUri]   = useState<string | null>(null);
  const [area, setArea]           = useState('');
  const [note, setNote]           = useState('');
  const [date, setDate]           = useState(todayLabel());
  const [linkedJob, setLinkedJob] = useState('');
  const [saving, setSaving]       = useState(false);

  function reset() {
    setStep('sheet');
    setPhotoUri(null);
    setArea('');
    setNote('');
    setDate(todayLabel());
    setLinkedJob('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  // ── Photo picker ────────────────────────────────────────────────────────────
  async function launchCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Enable camera permission in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep('form');
    }
  }

  async function launchLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photo access needed', 'Enable photo library permission in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep('form');
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!area) {
      Alert.alert('Area required', 'Please select a damage area.');
      return;
    }
    setSaving(true);
    try {
      // TODO: upload photoUri to your storage and get back a permanent URL
      const record: DamageRecord = {
        id: Date.now().toString(),
        vehicleId,
        area,
        note,
        date,
        capturedAt: new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit',
        }),
        photoUri,
        linkedJobId: linkedJob || undefined,
      };
      // TODO: POST record to your API here
      onSaved(record);
      reset();
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      style={s.modal}
      backdropOpacity={0.55}
      swipeDirection={step === 'sheet' ? 'down' : undefined}
      onSwipeComplete={step === 'sheet' ? handleClose : undefined}
      propagateSwipe
      useNativeDriverForBackdrop
    >
      {step === 'sheet' ? (
        /* ── 2b-iii: Photo source picker ── */
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Add damage photo</Text>

          <TouchableOpacity style={s.sheetRow} onPress={launchCamera} activeOpacity={0.7}>
            <View style={s.sheetIconBox}>
              <Ionicons name="camera-outline" size={20} color={Colors.grn} />
            </View>
            <View>
              <Text style={s.sheetRowTitle}>Take photo</Text>
              <Text style={s.sheetRowSub}>Opens rear camera · best for on-site intake</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[s.sheetRow, { borderBottomWidth: 0 }]} onPress={launchLibrary} activeOpacity={0.7}>
            <View style={s.sheetIconBox}>
              <Ionicons name="image-outline" size={20} color={Colors.grn} />
            </View>
            <View>
              <Text style={s.sheetRowTitle}>Photo library</Text>
              <Text style={s.sheetRowSub}>Choose from camera roll or albums</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={s.cancelRow} activeOpacity={0.6}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── 2b-iv: Area + note form ── */
        <View style={s.formSheet}>
          {/* Header */}
          <View style={s.formHeader}>
            <TouchableOpacity onPress={() => setStep('sheet')} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color={Colors.t2} />
            </TouchableOpacity>
            <Text style={s.formTitle}>Add damage</Text>
          </View>

          <ScrollView
            style={s.formScroll}
            contentContainerStyle={s.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo preview */}
            <View style={s.photoPreview}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={s.photoImage} />
              ) : (
                <Ionicons name="image-outline" size={32} color={Colors.t3} />
              )}
              {area !== '' && (
                <View style={s.photoLabel}>
                  <Text style={s.photoLabelText}>{area} area</Text>
                </View>
              )}
            </View>

            {/* Area chips */}
            <Text style={s.fieldLabel}>AREA *</Text>
            <View style={s.chipRow}>
              {AREA_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.chip, area === opt && s.chipActive]}
                  onPress={() => setArea(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, area === opt && s.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Area text field (mirrors selected chip) */}
            <TextInput
              style={[s.input, area ? s.inputFilled : undefined]}
              value={area}
              onChangeText={setArea}
              placeholder="Or type area…"
              placeholderTextColor={Colors.t3}
            />

            {/* Note */}
            <Text style={s.fieldLabel}>NOTE</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={note}
              onChangeText={setNote}
              placeholder="Describe the damage…"
              placeholderTextColor={Colors.t3}
              multiline
              textAlignVertical="top"
            />

            {/* Date */}
            <Text style={s.fieldLabel}>DATE</Text>
            <View style={[s.input, s.inputRow]}>
              <Text style={s.inputFilled}>{date}</Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.t3} />
            </View>

            {/* Link to job */}
            <Text style={s.fieldLabel}>LINK TO JOB (OPTIONAL)</Text>
            <TouchableOpacity style={[s.input, s.inputRow]} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: Colors.t2, fontFamily: Font.body }}>
                {linkedJob || 'Select job…'}
              </Text>
              <Ionicons name="chevron-down" size={15} color={Colors.t3} />
            </TouchableOpacity>

            {/* CTA */}
            <TouchableOpacity
              style={[s.btnPrimary, (!area || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!area || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#0d0d0d" />
              ) : (
                <Text style={s.btnPrimaryText}>Save documentation</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  // ── Sheet (2b-iii) ──
  sheet: {
    backgroundColor: Colors.s1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
  },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: Colors.bdr,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: Font.display,
    color: Colors.t1,
    marginBottom: 14,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bdr,
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowTitle: {
    fontSize: 13,
    fontFamily: Font.bodySB,
    color: Colors.t1,
  },
  sheetRowSub: {
    fontSize: 11,
    fontFamily: Font.body,
    color: Colors.t2,
    marginTop: 2,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: Font.body,
    color: Colors.t3,
  },

  // ── Form sheet (2b-iv) ──
  formSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 15,
    fontFamily: Font.display,
    color: Colors.t1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },

  // Photo preview
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: Colors.s2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  photoLabelText: {
    fontSize: 10,
    color: Colors.t2,
    fontFamily: Font.body,
  },

  // Field label
  fieldLabel: {
    fontSize: 10,
    color: Colors.t3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontFamily: Font.body,
    marginBottom: 6,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  chipText: {
    fontSize: 11,
    color: Colors.t2,
    fontFamily: Font.body,
  },
  chipTextActive: {
    color: Colors.grn,
  },

  // Inputs
  input: {
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: Colors.t2,
    fontFamily: Font.body,
    marginBottom: 12,
  },
  inputFilled: {
    color: Colors.t1,
    fontSize: 13,
    fontFamily: Font.body,
  },
  inputMulti: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // CTA
  btnPrimary: {
    backgroundColor: Colors.grn,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontFamily: Font.bodySB,
    color: '#0d0d0d',
  },
});
