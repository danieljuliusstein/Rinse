import { AppText } from '@/src/components/ui'
import { deleteClient, openPhone } from '@/src/lib/api'
import { buildSmsComposeUrl } from '@/src/lib/sms-compose'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'
import type { ClientWithStats } from '@rinse/core'
import { useRouter } from 'expo-router'
import { CalendarPlus, ChatCircle, DotsThreeVertical, Phone, Trash } from 'phosphor-react-native'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import {
    Alert,
    Dimensions,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
    type LayoutRectangle,
} from 'react-native'

interface ClientCardMenuProps {
  client: ClientWithStats
  onClientRemoved?: (id: string) => void
}

export type ClientCardMenuHandle = {
  open: () => void
}

export const ClientCardMenu = forwardRef<ClientCardMenuHandle, ClientCardMenuProps>(
  function ClientCardMenu({ client, onClientRemoved }, ref) {
  const router = useRouter()
  const triggerRef = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null)
  const [removing, setRemoving] = useState(false)

  const close = () => {
    setOpen(false)
    setAnchor(null)
  }

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height })
      setOpen(true)
    })
  }

  useImperativeHandle(ref, () => ({ open: openMenu }))

  const handleRemove = () => {
    close()
    Alert.alert(
      'Remove client?',
      `Remove ${client.name} from your client list? This will permanently delete all of their jobs, vehicles, and related records. This cannot be undone.`,
      [
        { text: 'Keep client', style: 'cancel' },
        {
          text: 'Remove client',
          style: 'destructive',
          onPress: () => {
            setRemoving(true)
            void deleteClient(client.id).then((result) => {
              setRemoving(false)
              if (result.ok) {
                onClientRemoved?.(client.id)
                return
              }
              Alert.alert('Remove client', result.error ?? 'Could not remove this client. Try again.')
            })
          },
        },
      ]
    )
  }

  const firstName = client.name.split(' ')[0] || client.name
  const smsUrl = client.phone ? buildSmsComposeUrl(client.phone, `Hi ${firstName}`) : null
  const callUrl = client.phone ? openPhone(client.phone) : null

  const windowWidth = Dimensions.get('window').width
  const menuStyle = anchor
    ? {
        top: Math.max(12, anchor.y + anchor.height + 4),
        right: Math.max(12, windowWidth - (anchor.x + anchor.width)),
      }
    : { top: '40%' as const, right: spacing.md }

  return (
    <View
      ref={triggerRef}
      style={styles.root}
      {...(Platform.OS !== 'web' ? { collapsable: false } : {})}
    >
      <Pressable
        style={({ pressed }) => [styles.trigger, webInlinePressableReset, pressed && styles.pressed]}
        onPress={openMenu}
        accessibilityLabel={`Actions for ${client.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View>
          <DotsThreeVertical size={20} color={colors.textMuted} weight="bold" />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu" />
        <View style={[styles.menu, menuStyle]} accessibilityRole="menu">
          <Pressable
            style={[styles.item, !callUrl && styles.itemDisabled]}
            disabled={!callUrl}
            onPress={() => {
              close()
              if (!callUrl) return
              void Linking.openURL(callUrl).catch(() => {
                Alert.alert('Call', 'Could not open Phone.')
              })
            }}
            accessibilityRole="menuitem"
            accessibilityLabel="Call"
          >
            <View style={styles.itemInner}>
              <Phone size={16} color={colors.textSecondary} />
              <AppText variant="bodySemiBold">Call</AppText>
            </View>
          </Pressable>
          <Pressable
            style={[styles.item, !smsUrl && styles.itemDisabled]}
            disabled={!smsUrl}
            onPress={() => {
              close()
              if (!smsUrl) return
              void Linking.openURL(smsUrl).catch(() => {
                Alert.alert('Text', 'Could not open Messages.')
              })
            }}
            accessibilityRole="menuitem"
            accessibilityLabel="Text"
          >
            <View style={styles.itemInner}>
              <ChatCircle size={16} color={colors.textSecondary} />
              <AppText variant="bodySemiBold">Text</AppText>
            </View>
          </Pressable>
          <Pressable
            style={[styles.item, styles.itemPrimary]}
            onPress={() => {
              close()
              router.push(`/jobs/new?clientId=${client.id}` as never)
            }}
            accessibilityRole="menuitem"
            accessibilityLabel="Book job"
          >
            <View style={styles.itemInner}>
              <CalendarPlus size={16} color={colors.greenText} />
              <AppText variant="bodySemiBold" style={styles.itemPrimaryLabel}>
                Book job
              </AppText>
            </View>
          </Pressable>
          <Pressable
            style={[styles.item, styles.itemDanger]}
            disabled={removing}
            onPress={handleRemove}
            accessibilityRole="menuitem"
            accessibilityLabel="Remove client"
          >
            <View style={styles.itemInner}>
              <Trash size={16} color={colors.danger} />
              <AppText variant="bodySemiBold" style={styles.itemDangerLabel}>
                {removing ? 'Removing…' : 'Remove client'}
              </AppText>
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
})


const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    alignSelf: 'center',
  },
  trigger: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.surfaceActive,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    position: 'absolute',
    minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 4,
    zIndex: 2,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' } as const)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        }),
  },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemDisabled: {
    opacity: 0.45,
  },
  itemPrimary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemPrimaryLabel: {
    color: colors.greenText,
  },
  itemDanger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemDangerLabel: {
    color: colors.danger,
  },
})
