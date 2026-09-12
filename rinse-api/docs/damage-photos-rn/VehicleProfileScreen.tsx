/**
 * VehicleProfileScreen
 * Screens 2b-i (empty) + 2b-ii (populated)
 * Renders the vehicle hero, meta grid, and PRE-EXISTING DAMAGE section.
 * Tapping a damage row navigates to DamageDetailScreen.
 * Tapping "Add damage documentation" opens AddDamageSheet.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // or @tabler/icons-react-native
import { Colors, Font } from './theme';
import { DamageRecord, Vehicle } from './types';
import AddDamageSheet from './AddDamageSheet';

// ─── Props ───────────────────────────────────────────────────────────────────
type Props = {
  vehicle: Vehicle;
  damages: DamageRecord[];
  onBack: () => void;
  onEdit: () => void;
  onDamagePress: (damage: DamageRecord) => void;
  onDamageSaved: (damage: DamageRecord) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function VehicleProfileScreen({
  vehicle,
  damages,
  onBack,
  onEdit,
  onDamagePress,
  onDamageSaved,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Nav row ── */}
      <View style={s.navRow}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={Colors.t2} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{vehicle.name}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onEdit} hitSlop={12}>
          <Ionicons name="pencil-outline" size={18} color={Colors.t2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Vehicle hero ── */}
        <View style={s.hero}>
          {vehicle.photoUri ? (
            <Image source={{ uri: vehicle.photoUri }} style={s.heroImage} />
          ) : (
            <View style={s.heroIconWrap}>
              <Ionicons name="car-outline" size={28} color="#3a6a9a" />
            </View>
          )}
        </View>

        {/* ── Meta grid ── */}
        <View style={s.metaGrid}>
          <MetaCell label="Plate" value={vehicle.plate} />
          <MetaCell label="Type"  value={vehicle.type} />
          <MetaCell label="Color" value={vehicle.color} swatch={vehicle.colorHex} />
          <MetaCell label="VIN"   value={vehicle.vin} muted />
        </View>

        {/* ── PRE-EXISTING DAMAGE section ── */}
        <Text style={s.sectionLabel}>PRE-EXISTING DAMAGE</Text>

        <View style={s.card}>
          {damages.length === 0 ? (
            /* 2b-i — Empty state */
            <>
              <View style={s.emptyZone}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="warning-outline" size={20} color={Colors.t3} />
                </View>
                <Text style={s.emptyTitle}>No damage documented</Text>
                <Text style={s.emptySub}>
                  Add photos of scratches, dents, or existing wear before each job
                </Text>
              </View>
              <View style={s.emptyDivider} />
              <GhostButton onPress={() => setSheetOpen(true)} />
            </>
          ) : (
            /* 2b-ii — Populated list */
            <>
              {damages.map((d, i) => (
                <DamageRow
                  key={d.id}
                  damage={d}
                  last={i === damages.length - 1}
                  onPress={() => onDamagePress(d)}
                />
              ))}
              <View style={{ paddingVertical: 10 }}>
                <GhostButton onPress={() => setSheetOpen(true)} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom sheet ── */}
      <AddDamageSheet
        visible={sheetOpen}
        vehicleId={vehicle.id}
        onClose={() => setSheetOpen(false)}
        onSaved={(record) => {
          setSheetOpen(false);
          onDamageSaved(record);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaCell({
  label,
  value,
  muted,
  swatch,
}: {
  label: string;
  value: string;
  muted?: boolean;
  swatch?: string;
}) {
  return (
    <View>
      <Text style={s.metaLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {swatch && (
          <View style={[s.colorSwatch, { backgroundColor: swatch }]} />
        )}
        <Text style={[s.metaValue, muted && { color: Colors.t2 }]}>{value}</Text>
      </View>
    </View>
  );
}

function DamageRow({
  damage,
  last,
  onPress,
}: {
  damage: DamageRecord;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.dmgRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={s.dmgThumb}>
        {damage.photoUri ? (
          <Image source={{ uri: damage.photoUri }} style={s.dmgThumbImage} />
        ) : (
          <Ionicons name="image-outline" size={22} color={Colors.t3} />
        )}
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={s.dmgArea}>{damage.area}</Text>
        <Text style={s.dmgNote} numberOfLines={2}>{damage.note}</Text>
        <Text style={s.dmgDate}>{damage.date}</Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={Colors.t3} style={{ marginTop: 4 }} />
    </TouchableOpacity>
  );
}

function GhostButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={s.ghostBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="add" size={16} color={Colors.grn} />
      <Text style={s.ghostBtnText}>Add damage documentation</Text>
    </TouchableOpacity>
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

  // Hero
  hero: {
    height: 120,
    backgroundColor: '#0a1020',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a2a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Meta
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.t3,
    fontFamily: Font.body,
    marginBottom: 2,
    minWidth: '45%',
  },
  metaValue: {
    fontSize: 13,
    color: Colors.t1,
    fontFamily: Font.body,
  },
  colorSwatch: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.t3,
    textTransform: 'uppercase',
    fontFamily: Font.body,
    marginBottom: 6,
  },

  // Card
  card: {
    backgroundColor: Colors.s1,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Empty state
  emptyZone: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.s2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.t2,
    fontFamily: Font.bodySB,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.t3,
    textAlign: 'center',
    lineHeight: 17,
    fontFamily: Font.body,
  },
  emptyDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.bdr,
    marginHorizontal: 14,
    paddingTop: 12,
  },

  // Damage list row
  dmgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bdr,
  },
  dmgThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.s2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  dmgThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dmgArea: {
    fontSize: 13,
    fontFamily: Font.bodySB,
    color: Colors.t1,
  },
  dmgNote: {
    fontSize: 11,
    color: Colors.t2,
    marginTop: 2,
    lineHeight: 15,
    fontFamily: Font.body,
  },
  dmgDate: {
    fontSize: 10,
    color: Colors.t3,
    marginTop: 3,
    fontFamily: Font.body,
  },

  // Ghost button
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.bdr,
    borderRadius: 10,
  },
  ghostBtnText: {
    fontSize: 13,
    color: Colors.t2,
    fontFamily: Font.body,
  },
});
