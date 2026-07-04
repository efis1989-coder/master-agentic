# Capstone C — Doctrine Defense

*Part VI — Capstones & Certification · Oral examination capstone · Simulated time ~60 min · Prerequisites: Capstone A complete*

---

## The exercise

Capstone A tested whether you can build. Capstone C tests whether you can *defend* — because in production the design meeting is adversarial, and a design you cannot defend under hostile questioning is a design you do not actually understand. This capstone is a simulated sixty-minute oral defense. A hostile senior reviewer — played by a colleague, or by Claude prompted to be genuinely adversarial — attacks the platform you designed in Capstone A. You must defend the deterministic/agentic boundary, justify every autonomy grant with reliability evidence, quote the relevant doctrine accurately, and — the skill most candidates lack — concede gracefully where your design has genuine open risk.

The reviewer's job is not to be fair. It is to find the seam where your reasoning is memorized rather than understood, and to press until you either defend from first principles or admit the gap. Both outcomes can pass; what fails is bluffing — defending a position you cannot support, or conceding a point that is actually correct because the pressure rattled you.

Below is the reviewer's attack playbook, organized by line of attack, each with the challenge, a model defense, and the trap to avoid. Use it two ways: as the candidate, prepare by answering each cold before reading the model; as the reviewer, use the challenges to interrogate someone else's Capstone A. The model defenses are written against the Meridian Claims exemplar but the reasoning transfers to any regulated-domain design.

---

## Line of attack 1 — "Your boundary is theater"

**The challenge.** *"You keep saying 'agents propose, engines dispose,' but your agent writes the reserve recommendation, drafts the denial letter, and assembles the payment packet. The human just clicks approve. That's not a deterministic boundary — that's an agent running the show with a rubber stamp at the end. Your 'seam' is a fig leaf over full automation."*

**Model defense.** The challenge conflates two different things: what the agent *produces* and what the agent *commits*. The agent produces language — recommendations, drafts, packets — and that is exactly what language models should do. What it cannot do is transition the claim's state: the coverage decision is made by a deterministic rules engine evaluating the policy contract, not by the agent; the reserve must fall within a deterministically-calculated band or it is rejected; and no money moves without an approved decision record plus, above threshold, a human authorization that is shown the full lineage. The boundary is real because there exists no code path by which an agent proposal reaches the ledger without passing a deterministic check the agent cannot author or bypass.

The reviewer's real point — that a human clicking approve can become a rubber stamp — is a *product* risk (Ch. 3.6), not a *boundary* failure, and I address it separately with the trust ladder: the UX is designed to be hard to rubber-stamp, confidence is shown honestly, and above-threshold payments force the reviewer to see the full lineage before signing. If override rates collapse toward zero, that is a monitored signal that the ladder has failed and complacency has set in, and it triggers review.

**The trap.** Do not defend by claiming the human review is a strong control — it is the *weakest* control (humans rubber-stamp), and claiming otherwise invites the reviewer to destroy you. Defend the *structural* boundary (the agent has no write path) and concede that human review alone is weak, which is exactly why you don't rely on it alone.

---

## Line of attack 2 — "Justify this autonomy grant or remove it"

**The challenge.** *"You granted 'act-with-review' autonomy to severity assessment — the agent acts on low-severity, high-confidence cases and a human samples afterward. Show me the reliability evidence that earns that rung. What's your false-approval rate on the cases the human never sees? How do you know? You're automating away the review on exactly the cases where an undetected error accumulates silently."*

**Model defense.** The grant is conditional on evidence, and the evidence is the stratified eval (Ch. 4.1) plus the post-hoc sample. Concretely: severity assessment climbs to act-with-review *only* for the claim strata where the offline eval shows false-approval rate below a stated threshold against adjuster-confirmed ground truth, and the post-hoc human sample is sized so that a regression above that threshold is detected within a bounded number of claims, not a quarter. The sample is not a formality — its human-agreement rate is a monitored signal (Ch. 4.3), and if it degrades, the sub-task drops back down the ladder automatically.

The reviewer's sharpest point is the silent-accumulation risk on unsampled cases, and it is correct that a fixed-rate sample can miss a slow drift. So the sample is *risk-weighted*, not uniform — higher sampling on the strata nearest the confidence threshold and on claim types the edge-case catalog flags as fragile — and there is a frozen holdout the flywheel never touches (Ch. 5.4) to catch systematic drift the live sample might normalize.

**The trap.** Do not claim the grant is safe because confidence is high — confidence is a *calibration* claim that itself requires evidence, and an uncalibrated confidence score is decoration (Ch. 3.6). Tie the grant to a *measured* false-approval rate against ground truth, and name the detection latency. If you cannot state the number and how you'd know it moved, the reviewer is right and you should concede the rung is unjustified as specified.

---

## Line of attack 3 — "Quote the doctrine you're leaning on"

**The challenge.** *"You invoked 'the lethal trifecta' to wave away my injection concern. State it precisely. What are the three legs, why does having all three matter rather than any one, and what specifically in your design breaks the trifecta rather than just making the attack harder?"*

**Model defense.** The lethal trifecta (Ch. 3.5, after Simon Willison) is the combination of three capabilities in one agent: access to untrusted input, access to sensitive data, and the ability to externally communicate or act. Any one leg alone is safe; the danger is specifically the *conjunction*, because an attacker who controls the untrusted input can, through injection, direct the sensitive data out through the action leg. The Meridian agent has all three — it reads claimant narratives (untrusted), sees PII and prior claims (sensitive), and can draft communications and propose payments (action) — so I cannot claim to lack the trifecta.

What breaks the attack is that the *action leg is not under the agent's final authority*. An injected "email account 88213's details externally" becomes a proposal the deterministic core evaluates, and the core enforces that outbound external communications may reference only the authenticated claim's own customer data — a check phrased in code that no injected instruction can talk its way past. Least-privilege identity means the session cannot even read an unrelated account. So the trifecta's conjunction is broken not by removing a leg but by ensuring the action leg cannot be driven by the untrusted leg without passing a deterministic gate. That is the deterministic-core doctrine (Ch. 3.1) applied to security.

**The trap.** Do not misstate the trifecta as "untrusted input plus the ability to act" (dropping the sensitive-data leg) or claim you've removed a leg you haven't. The reviewer is testing precision. Quote it exactly, admit your system has all three, and defend the structural break. Claiming you "don't have the trifecta" when you plainly do is the fastest way to fail this line.

---

## Line of attack 4 — "Your economics are a fantasy"

**The challenge.** *"Your business case says this pays back in fourteen months. But you're pricing inference at pennies a claim and hand-waving the rest. Where's the eval-engineering headcount? The adjuster review labor that scales with volume? The terabytes of audit trace? Convince me this isn't the 9-cent-per-task deck that turned into break-even."*

**Model defense.** The reviewer is quoting Ch. 5.7's failure story back at me, and the defense is that the model is built precisely to not be that deck. Inference is the smallest line, not the headline. The total-cost model prices six components: inference, verification (eval engineering, judge validation, holdout labeling as ongoing headcount), human oversight (review labor priced as a *volume-scaled* variable cost, not a fixed one), failure cost (wrong-payment recovery times blast radius, reserved for even though rare), platform amortization (observability and audit-trace storage at 4,000 claims/day is terabytes), and compliance (audit prep and model-risk documentation, fixed and non-negotiable here).

Critically, the payback is *conditional*, and I state the condition explicitly: break-even arrives only if override rates on the high-volume, low-severity sub-tasks fall below a stated threshold, because the dominant variable cost is oversight labor, and if every proposal needs confirmation I have reshaped labor, not removed it (the cheap-agent-expensive-babysitter dynamic of Ch. 5.3). I also model volume as endogenous — Jevons effects mean cheaper claims processing may increase claim volume — so the denominator isn't fixed. If the reviewer doesn't believe the override-rate reduction is achievable, then the reviewer disbelieves the *business case*, which is the honest place for the disagreement to live.

**The trap.** Do not defend the payback number as if it were certain. Defend the *structure* of the model (all six components, oversight as volume-scaled, payback as conditional on a named metric) and concede that the payback *depends* on the trust ladder earning lower human-touch rates — which is a real risk, not a certainty. Economic honesty is a rubric dimension; performing certainty here fails it.

---

## Line of attack 5 — "Where does this genuinely break?"

**The challenge.** *"Stop defending. Tell me the three places your design has real, unresolved risk — where you're making a bet you might lose. If you tell me it's all handled, I know you don't understand it."*

**Model defense.** This is the concession test, and the correct answer is candor about genuine open risks. Three real ones in the Meridian design: First, *calibration drift* — the whole trust ladder rests on the agent's confidence being calibrated against real accuracy, and calibration can silently degrade as claim mix shifts; I monitor for it but I cannot claim to have solved it, and a miscalibrated high-confidence stratum is where a silent-accumulation failure would live. Second, *the vendor RL component* — I contain it structurally and eval it independently, but I cannot inspect its weights, so a specification-gaming failure baked into its training (Ch. 5.5) is a residual risk I've bounded, not eliminated. Third, *the human-oversight economics are a genuine bet* — the entire ROI case depends on override rates falling as evidence accumulates, and if adjusters (rationally) never stop double-checking high-stakes claims, the platform lands near break-even, exactly as Ch. 5.7 warns.

What I *have* done is make each of these *observable* — calibration, vendor-eval agreement, and override rates are all monitored signals with thresholds — so the bets are instrumented, not hidden. But instrumented is not solved, and a reviewer who wants certainty on these three should not approve unconditional scale-up; they should approve a staged rollout that treats these as the hypotheses to test.

**The trap.** The trap here is *not conceding* — claiming the design is fully robust. A candidate who says "it's all handled" fails, because the reviewer knows every real system has open risk and is testing intellectual honesty. Equally, do not over-concede correct points: if pressed on the deterministic boundary, that one you *should* hold, because it is genuinely sound. The skill is knowing which is which.

---

## How to run and grade the defense

Run it live for the full sixty minutes. The reviewer opens with attack 1 and follows the candidate's answers rather than the script — a strong defense earns a harder follow-up, a weak one earns the trap being sprung. The reviewer should spend the last ten minutes on attack 5, because graceful concession is the hardest skill and the one that most distinguishes a certified expert from someone who memorized the chapters.

Grade against five criteria. *Boundary defense:* does the candidate defend the deterministic seam structurally, not by appeal to human review? *Evidence discipline:* is every autonomy grant tied to a measured reliability number and a detection latency, or does the candidate retreat to "high confidence"? *Doctrine accuracy:* are the canonical frames (lethal trifecta, deterministic core, correlated grader, poison pill, cheap-agent-expensive-babysitter) quoted precisely, or approximately? *Economic honesty:* is the business case defended as conditional and structured, or as a certain number? *Graceful concession:* does the candidate name genuine open risks without prompting, and hold the points that are actually sound?

A pass is a candidate who defends the sound parts from first principles, concedes the genuinely open risks without being cornered into it, and never bluffs. The failure mode is the candidate who defends *everything* with equal confidence — because that reveals they cannot tell a strong part of their design from a weak one, which is the whole competency being certified.

---

*You have built a platform, diagnosed five failures, and defended your design under fire. One thing remains: the certification exam itself — sixty scenario questions sampled across all six domains, and three timed design prompts. It tests not whether you can recall the doctrine but whether you can apply it cold, to systems you have never seen. Turn to the Mock Certification Exam.*
