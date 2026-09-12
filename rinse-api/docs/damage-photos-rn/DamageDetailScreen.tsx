/**
 * DamageDetailScreen
 * Screen 2b-v — Full detail view for a single damage record.
 * Shows photo, amber badge, metadata rows, edit + delete actions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font } from './theme';
import { DamageRecord } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────
type Props = {
  damage: DamageRecord;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onNoteEdited: (updated: DamageRecord) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function DamageDetailScreen({
  damage,
  onBack,
  onDeleted,
  onNoteEdited,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    Alert.alert(
      'Delete damage record?',
      'This photo and note will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // TODO: DELETE /damages/:damage.id
              onDeleted(damage.id);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  function handleEditNote() {
    // TODO: open an inline edit modal or push an edit screen
    // Call onNoteEdited(updatedRecord) when done
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Nav row ── */}
      <View style={s.navRow}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={Colors.t2} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Damage detail</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleEditNote} hitSlop={12}>
          <Text style={s.editNoteBtn}>Edit note</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo hero ── */}
        <View style={s.photoWrap}>
          {damage.photoUri ? (
            <Image source={{ uri: damage.photoUri }} style={s.photo} />
          ) : (
            <Ionicons name="image-outline" size={52} color="#3a5a3a" />
          )}

          {/* Amber badge */}
          <View style={s.badge}>
            <Text style={s.badgeText}>Pre-existing damage</Text>
          </View>

          {/* Photo count */}
          <View style={s.photoCount}>
            <Text style={s.photoCountText}>1 of 1 photo</Text>
          </View>
        </View>

        {/* ── Metadata card ── */}
        <View style={s.card}>
          <DetailRow label="Area"     value={damage.area} />
          <DetailRow label="Note"     value={damage.note} />
          <DetailRow label="Date"     value={damage.date} />
          <DetailRow label="Captured" value={damage.capturedAt} muted last />
        </View>

        {/* ── Actions ── */}
        <View style={s.actions}>
          <TouchableOpacity style={s.btnSecondary} onPress={handleEditNote} activeOpacity={0.7}>
            <Text style={s.btnSecondaryText}>Edit note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnDanger}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.7}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.red} />
            ) : (
              <Text style={s.btnDangerText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-component ───────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  muted,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[s.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.detailKey}>{label.toUpperCase()}</Text>
      <Text style={[s.detailVal, muted && { color: Colors.t2 }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },

  // Nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
  },
  navTitle: {
    fontSize: 15,
    fontFamily: Font.display,
    color: Colors.t1,
  },
  editNoteBtn: {
    fontSize: 13,
    fontFamily: Font.body,
    color: Colors.t2,
  },

  // Photo hero
  photoWrap: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.s2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Font.body,
    color: Colors.amr,
  },
  photoCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCountText: {
    fontSize: 10,
    fontFamily: Font.body,
    color: Colors.t2,
  },

  // Metadata card
  card: {
    backgroundColor: Colors.s1,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bdr,
  },
  detailKey: {
    fontSize: 11,
    fontFamily: Font.body,
    color: Colors.t3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailVal: {
    fontSize: 13,
    fontFamily: Font.body,
    color: Colors.t1,
    textAlign: 'right',
    maxWidth: '60%',
    flexShrink: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: Font.body,
    color: Colors.t2,
  },
  btnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnDangerText: {
    fontSize: 13,
    fontFamily: Font.bodySB,
    color: Colors.red,
  },
});
