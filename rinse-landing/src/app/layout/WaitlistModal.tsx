import { trapDialogTab } from '../shared/dialog';
import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../shared/urls';
export function WaitlistModal({ interest, onClose }: { interest: 'free' | 'starter' | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!interest) return;
    const previous = document.activeElement as HTMLElement | null;
    setStatus(''); setFailed(false); dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, [interest]);
  return <dialog onKeyDown={trapDialogTab} ref={dialog} className="rinse-dialog" aria-labelledby="waitlist-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <button className="dialog-exit" onClick={onClose} aria-label="Close waitlist">×</button>
    <h2 id="waitlist-title" className="text-2xl font-bold">Join the iOS waitlist</h2>
    <p className="my-4">Rinse is preparing for iOS launch, with a Free plan for organizing your first jobs and getting paid.</p>
    <form onSubmit={async e => {
      e.preventDefault(); if (busy) return;
      const form = new FormData(e.currentTarget); setBusy(true); setFailed(false); setStatus('');
      try {
        const response = await fetch(`${API_URL}/api/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), interest: form.get('interest') }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Please try again.');
        setStatus(result.message);
      } catch (error) { setFailed(true); setStatus(error instanceof Error ? error.message : 'Could not save your signup. Please try again.'); }
      finally { setBusy(false); }
    }}>
      <label className="block my-3">Email address<input autoFocus name="email" type="email" required maxLength={254} autoComplete="email" className="block w-full border rounded-lg p-3 mt-2" /></label>
      <label className="block my-3">I’m interested in<select key={interest} name="interest" defaultValue={interest || 'free'} className="block w-full border rounded-lg p-3 mt-2"><option value="free">Free — $0</option><option value="starter">Starter — $6/month</option></select></label>
      <p className="text-sm my-4">Joining does not reserve one of the 100 Early paid subscriptions. No payment details needed.</p>
      <button className="rinse-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Join waitlist'}</button>
      <p className="mt-4" role={failed ? 'alert' : 'status'} aria-live="polite">{status}</p>
    </form>
  </dialog>;
}
