import { trapDialogTab } from '../shared/dialog';
import { useEffect, useRef, useState } from 'react';
const steps = [
  { title: 'Add a client and vehicle', description: 'Keep contact details and vehicle notes together, so you’re ready for the next visit.', action: 'Add sample client', done: 'Alex Morgan · 2021 Toyota Corolla', preview: ['Clients', 'Alex Morgan', 'alex@example.com', '2021 Toyota Corolla · Interior needs attention'] },
  { title: 'Schedule a job', description: 'Choose a service, date and time. Free includes five scheduled or in-progress jobs.', action: 'Schedule sample job', done: 'Full Detail scheduled · Tuesday, 9:00 AM', preview: ['Jobs', 'Tuesday · 9:00 AM', 'Full Detail · $180', 'Alex Morgan · Toyota Corolla'] },
  { title: 'Send an invoice', description: 'Review the amount and share an invoice payment link. Sending invoices is included on Free.', action: 'Send sample invoice', done: 'Sample invoice marked sent. No email was sent.', preview: ['Invoice RINSE-DEMO-001', 'Full Detail', 'Total · $180.00', 'Balance due · $180.00'] },
  { title: 'See how customer payment works', description: 'After Stripe setup, your customer pays for the detailing service on a secure checkout. Processing costs are charged to the operator. Rinse adds no transaction commission.', action: 'Simulate customer payment', done: 'Sample invoice paid · $180.00. No money moved.', preview: ['Customer invoice', 'Pay $180.00 securely', 'Stripe checkout → your detailing business', 'Payout timing depends on Stripe account status'] },
  { title: 'Upgrade when you need more', description: 'Starter is $6/month: unlimited active jobs, booking links, quotes, the lead pipeline, inventory, expenses and reports. The first 100 qualifying paying operators can get Starter for $3/month while continuously subscribed.', action: 'Compare sample plans', done: 'You can keep using Free. Upgrading is always your choice.', preview: ['Your plan', 'Free · $0', 'Starter · $6/month', 'Early launch offer · $3/month'] },
];
export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    setStep(0); setCompleted([]); dialog.current?.showModal(); heading.current?.focus();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, [open]);
  function move(next: number) { setStep(Math.max(0, Math.min(steps.length - 1, next))); requestAnimationFrame(() => heading.current?.focus()); }
  const current = steps[step];
  return <dialog ref={dialog} className="rinse-dialog walkthrough" aria-labelledby="walkthrough-title" onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => {
    trapDialogTab(e);
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); move(step + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(step - 1); }
  }}>
    <button className="dialog-exit" onClick={onClose} aria-label="Exit walkthrough">×</button>
    <p className="text-sm mb-3">Explore Rinse · Isolated sample data</p>
    <p role="status" aria-live="polite" className="text-sm mb-3">Step {step + 1} of {steps.length}</p>
    <progress value={step + 1} max={steps.length} aria-label="Walkthrough progress" className="w-full mb-4" />
    <h2 ref={heading} tabIndex={-1} id="walkthrough-title" className="text-2xl font-bold">{current.title}</h2>
    <p className="my-4">{current.description}</p>
    <div className="sample-screen" aria-label="Simplified Rinse workflow preview">{current.preview.map((line, i) => <p key={line} className={i === 0 ? 'font-bold border-b pb-3' : 'mt-3'}>{line}</p>)}</div>
    <button className="rinse-primary mt-4" onClick={() => setCompleted(list => [...new Set([...list, step])])}>{current.action}</button>
    <p className="my-3 min-h-12" role="status">{completed.includes(step) ? current.done : 'Try this step, or use Next to continue.'}</p>
    <div className="flex flex-wrap gap-3 justify-between">
      <button className="rinse-secondary" disabled={step === 0} onClick={() => move(step - 1)}>Back</button>
      <button className="rinse-secondary" onClick={() => { setCompleted([]); move(0); }}>Replay</button>
      {step < steps.length - 1 ? <button className="rinse-primary" onClick={() => move(step + 1)}>Next</button> : <button className="rinse-primary" onClick={onClose}>Finish walkthrough</button>}
    </div>
  </dialog>;
}
