# LLM Council Transcript

**Timestamp:** 2026-07-26 13:05:19  
**Topic:** Validate settled v1 choices for Desk CRM n8n-feel automations

## Original question

User answered pre-implementation questions as `1. A 2. A 3. A` and asked for `/llm-council`.

## Framed question

DECISION TO VALIDATE: Desk CRM (React + Vite + Tailwind v4 + PocketBase/orgStore, Figma Make app) is about to implement n8n-feel automations.

SETTLED CHOICES:
1. Canvas: raw `@xyflow/react` only — build palette, custom nodes, inspector ourselves (NOT `@workflowbuilder/sdk`)
2. Shell: full-page editor (replace Automations list when editing, like Forms)
3. `notify` action: create an activity note on the contact (no separate toast/inbox)

ALSO SETTLED PRODUCT:
- Visual node canvas + multi-step engine with binary conditions
- First-party runner (no Temporal/n8n embed); graph in `config_json`; keep denormalized trigger
- Engine-before-polish; legacy 1:1 rules migrate to 2-node graphs
- Wire `deal_stage_changed` from SalesPipeline

STAKES: Wrong stack choice wastes a week+ of canvas plumbing; wrong UX (full-page vs overlay) hurts CRM navigation; notify-as-note may feel like a fake "notify" to users.

Question: Are these three settled choices the right call for v1, or should any be reversed before implementation starts?

## Advisor responses

### The Contrarian

Choice 3 is the silent landmine. Shipping an action literally named `notify` that only writes an activity note trains users that “Notify” does nothing they recognize as notification. When you later add real alerts, every existing automation silently changes meaning or you forever support a lie. Rename the kind now to `log_note` / “Log note,” or keep `notify` only if the inspector copy says “Record a note on the contact (not an email or push).” Do not reverse 1 or 2. Workflow Builder buys polish you have not earned the right to maintain — another schema, theming surface, and upgrade tax on a Figma Make CRM that already owns FormBuilder patterns. Full-page is fine until you discover users want to peek at a deal while editing a flow; that is a follow-up, not a reason to overlay-first. The real failure mode on raw React Flow is under-scoping the inspector and connection rules, then shipping a canvas that looks like n8n but cannot express a valid runnable graph. Cap nodes, enforce one trigger, validate before save — or the “week of plumbing” becomes two weeks of bug bashes.

### The First Principles Thinker

The question is not React Flow vs Workflow Builder. It is: what must a user accomplish? When X happens in the CRM, run a short chain of CRM mutations, visually authorable. The minimal system is (1) a serializable DAG, (2) a runner over CRM side effects, (3) an editor that emits that DAG. Choice 1 is correct because the editor is a projection of the DAG, not the product — owning nodes keeps the projection thin. Choice 2 is correct because authoring a graph is a mode, not a glance; Forms already taught that pattern. Choice 3 is the only one that fails first principles: “notify” names an outcome you are not delivering. Either deliver a real notification channel or rename the action to the outcome you do deliver (activity note). Do not reverse the canvas or shell. Reverse or relabel notify before code freezes the enum into PocketBase and templates. Everything else in the plan (engine-first, legacy migration, deal stage emit) follows from the real problem; the three UI choices mostly do too — except the naming honesty on notify.

### The Expansionist

Raw React Flow is the right bet if automations become a differentiator: you own the visual language, you can brand every node, and you are not capped by an SDK’s CE/Enterprise split when the canvas is the demo. Full-page elevates Automations from a settings form to a product surface — that is how you sell “Desk builds the workflow with you.” Do not reverse 1 or 2. On notify-as-note: keep the behavior for v1 (audit trail on the contact is CRM-native gold) but treat the label as temporary branding. The upside path is Activity Timeline as the notification center — every automation write is already visible where salespeople live. That is bigger than a toast. When you later add email/SMS/push, they become sibling action nodes, and the note action stays the always-on audit spine. Workflow Builder would accelerate week one and flatten week twelve when you want something Desk-specific. Own the canvas; expand the action catalog later.

### The Outsider

If I open Automations and see n8n, I expect cables and boxes. Full-page is what I expect — a tiny drawer would feel like you are hiding the feature. Building your own palette is invisible to me as long as nodes say “When form submitted” not `form_submitted`. I would reverse nothing about the canvas library or the full page. I would reverse the word Notify. If I pick Notify and later check the contact and only see a note, I think the product is broken or I configured it wrong. Call the button “Add note to contact” or show a one-line explainer under the node. Also: I do not know what Workflow Builder is, and I do not care — I care whether the first template works in one click. Put the energy into English labels and templates, not into defending the stack choice. If the empty canvas greets me with jargon, the stack debate was irrelevant.

### The Executor

Do not reverse any of the three. Monday morning: `pnpm add @xyflow/react`, types + `legacyToWorkflow`, rewrite `runAutomationsForTrigger` to walk the graph, make notify create the activity note, then full-page editor shell mirroring Forms. Workflow Builder is a distraction — install, theme, map JSON, fight peer deps — before you have a runner. Overlay vs full-page is a one-hour swap later; full-page matches existing App page patterns now. Notify-as-note is already half-implemented; finish it and ship. Rename the display label to “Log note” in the palette without changing the stored enum if you want honesty without a migration. First concrete step: land the workflow type + runner with a headless multi-step fixture before any React Flow chrome. If the runner cannot branch on a condition, the canvas is theater.

## Peer review anonymization map

| Letter | Advisor |
|--------|---------|
| A | The Executor |
| B | The Outsider |
| C | The Contrarian |
| D | The Expansionist |
| E | The First Principles Thinker |

## Peer reviews

### Reviewer (Contrarian lens)

1. Strongest: **E** — forces honesty on notify naming as a contract problem, not a UX nit.  
2. Biggest blind spot: **A** — “ship and rename label later” underestimates enum freeze in PB/templates.  
3. All missed: How condition nodes explain true/false to non-technical users on the canvas itself.

### Reviewer (First Principles lens)

1. Strongest: **C** — validation-before-save and one-trigger cap are load-bearing for a runnable graph.  
2. Biggest blind spot: **D** — expands into timeline-as-notification-center without proving v1 runner.  
3. All missed: Whether `contact_id` is present for every trigger context (chat/deal) so note actions do not no-op.

### Reviewer (Expansionist lens)

1. Strongest: **D** — owns the canvas as brand surface; note-as-audit as future spine.  
2. Biggest blind spot: **C** — so focused on failure it undervalues full-page as positioning.  
3. All missed: Template-led onboarding as the actual adoption lever (B hints; none design it).

### Reviewer (Outsider lens)

1. Strongest: **B** — English labels and “Notify is broken” user reading.  
2. Biggest blind spot: **E** — abstract “projection of the DAG” language users never feel.  
3. All missed: Empty-state copy and first-run template picker as day-one UX.

### Reviewer (Executor lens)

1. Strongest: **A** — clear sequencing: runner before canvas chrome.  
2. Biggest blind spot: **D** — week-twelve upside does not change Monday’s install.  
3. All missed: Explicit smoke checklist (form submit → condition → note) as definition of done.

## Chairman synthesis

### Where the Council Agrees

- Keep `@xyflow/react` (not Workflow Builder) for v1.  
- Keep full-page editor.  
- Notify-as-activity-note is acceptable behavior for v1, but the **label/honesty** problem is real.  
- Engine/runner before canvas polish.  
- Templates and English labels matter as much as the stack.

### Where the Council Clashes

- Contrarian/First Principles want rename or hard copy before enum freeze; Executor allows display-label-only change to move fast; Expansionist keeps note behavior as strategic audit spine. Resolution: keep stored action id if needed for compat, but **palette/inspector must not say bare “Notify” without “logs a note on the contact.”** Prefer display name “Log note” in UI.

### Blind Spots the Council Caught

- Trigger contexts missing `contact_id` → silent no-ops.  
- Condition true/false UX for non-technical users.  
- Template-first empty state.  
- Validate graph before save (one trigger, max nodes, connected path).

### The Recommendation

**Proceed with 1A, 2A, 3A.** Do not reverse canvas or shell. For notify: keep activity-note behavior; present it in the UI as **Log note** (or Notify with explicit subtitle). Sequence: workflow types + runner + deal_stage wire, then full-page React Flow editor, then templates/labels. Add save-time graph validation and ensure each action documents required `ctx` keys.

### The One Thing to Do First

Implement `AutomationWorkflow` + headless multi-step/condition runner (including notify → activity note) and prove it with a seeded fixture before adding React Flow UI.
