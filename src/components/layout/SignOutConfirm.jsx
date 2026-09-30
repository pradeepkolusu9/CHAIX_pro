import { useActions } from '../../lib/store.jsx'
import { ConfirmModal } from '../ui/index.jsx'

/** Signing out wipes local progress, so it always goes through this confirmation. */
export function SignOutConfirm({ open, onClose, onDone }) {
  const { actions } = useActions()
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title="Sign out?"
      body="Your progress on this device (XP, streak, badges) will be removed. You can't undo this."
      confirmLabel="Sign out and remove progress"
      onConfirm={async () => {
        onClose()
        onDone?.()
        await actions.logout()
      }}
    />
  )
}
