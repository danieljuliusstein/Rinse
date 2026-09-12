'use client'

import { FloppyDisk } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsFooter({ showSave = true }: { showSave?: boolean }) {
  const { logout, isLoggedIn } = useAuth()
  const { handleWriteError } = useActionToast()
  const confirm = useConfirm()
  const { dirty, savedFlash, save } = useSettingsDraft()
  const router = useRouter()

  return (
    <div className="settings-footer">
      {showSave && isLoggedIn ? (
        <button
          type="button"
          className={`settings-footer__save${savedFlash ? ' settings-footer__save--done' : dirty ? ' settings-footer__save--ready' : ''}`}
          disabled={!dirty && !savedFlash}
          onClick={() => {
            void (async () => {
              try {
                await save()
              } catch (e) {
                handleWriteError(e)
              }
            })()
          }}
        >
          <FloppyDisk size={18} weight="bold" aria-hidden="true" />
          {savedFlash ? 'Saved!' : 'Save settings'}
        </button>
      ) : null}
      {isLoggedIn ? (
        <button
          type="button"
          className="settings-footer__logout"
          onClick={() => {
            void (async () => {
              const ok = await confirm({
                title: 'Log out?',
                message:
                  'Log out on this device? You can keep browsing, but your data will not load until you sign in again.',
                confirmLabel: 'Log out',
                cancelLabel: 'Stay signed in',
                destructive: true,
              })
              if (!ok) return
              logout()
            })()
          }}
        >
          Log out
        </button>
      ) : (
        <button
          type="button"
          className="settings-footer__save"
          onClick={() => router.push('/auth')}
        >
          Sign in
        </button>
      )}
    </div>
  )
}
