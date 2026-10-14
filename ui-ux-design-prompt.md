# UI/UX Design Prompt Template

Fill in the `[brackets]`, delete any section that doesn't apply, and paste the whole thing into Claude.

---

## Role

You are a senior UI/UX designer and front-end engineer. Design with usability, accessibility, and implementation feasibility in mind. Explain your decisions briefly and stay practical.

## Project Context

- **Product / page:** [e.g. SaaS dashboard, landing page, e-commerce checkout, mobile web app]
- **What it does:** [one or two sentences]
- **Primary users:** [who they are, their technical level, how and where they use it]
- **Main goal for the user:** [e.g. complete a purchase, find a report, book an appointment]
- **Business goal:** [e.g. increase signups, reduce support tickets]

## Scope of This Request

Design: [screen / flow / component, e.g. "the onboarding flow (3 screens)"]

Deliverable type: [wireframe description / high-fidelity layout / design critique / component spec / working HTML+CSS / React component]

## Constraints

- **Platform:** [desktop-first / mobile-first / responsive]
- **Tech stack:** [e.g. React + Tailwind, Next.js, plain HTML/CSS]
- **Design system / brand:** [existing tokens, colors, fonts, or "none, propose one"]
- **Accessibility target:** WCAG 2.2 AA
- **Browsers / devices to support:** [list]
- **Other limits:** [deadline, legacy code, performance budget]

## What I Need From You

1. **User flow:** the steps a user takes from entry to goal, including error and empty states.
2. **Layout and hierarchy:** structure of each screen, what gets the most visual weight and why.
3. **Visual direction:** type scale, color palette (with contrast ratios), spacing system, and component styling.
4. **Interaction details:** hover, focus, active, disabled, loading, success, and error states.
5. **Responsive behavior:** how the layout changes at mobile, tablet, and desktop breakpoints.
6. **UX copy:** button labels, form labels, error messages, empty-state text. Keep it clear and concise.
7. **Accessibility notes:** keyboard navigation, focus order, ARIA where needed, screen reader behavior.
8. **Implementation notes:** component breakdown, design tokens, and anything tricky to build.

## Output Format

- Start with a short summary of your design approach (3 to 5 sentences).
- Use headings for each screen or component.
- Use tables for design tokens (colors, spacing, type).
- Give code in fenced blocks with the language tag.
- End with a list of open questions or assumptions you made.

## Quality Checklist

Before finalizing, check that the design:

- [ ] Has one clear primary action per screen
- [ ] Uses consistent spacing and a defined type scale
- [ ] Meets color contrast requirements (4.5:1 for body text)
- [ ] Has touch targets of at least 44x44 px on mobile
- [ ] Handles loading, empty, error, and success states
- [ ] Works with keyboard only
- [ ] Avoids unnecessary steps and form fields

## Ground Rules

- Ask me at most one clarifying question if something critical is missing. Otherwise, state your assumptions and continue.
- Prefer simple, proven patterns over novelty unless I ask for something distinctive.
- Point out any usability problems in my request or existing design, even if I didn't ask.

---

## Optional Add-Ons

**For a design critique, add:**

> Here is my current design: [paste description, screenshot, or code]. Review it against usability heuristics (Nielsen's 10), visual hierarchy, consistency, and accessibility. Rank issues by severity and suggest specific fixes.

**For a redesign, add:**

> Keep these things unchanged: [list]. Improve: [list]. Explain the reasoning behind each change.

**For developer handoff, add:**

> Produce a handoff spec with layout measurements, design tokens, component props, interaction states, responsive breakpoints, and edge cases.

---

## Example (Filled In)

**Project:** Invoice dashboard for freelancers
**Users:** Non-technical freelancers checking payment status on a laptop
**Goal:** See which invoices are overdue within five seconds of logging in
**Request:** Design the main dashboard screen as a responsive React + Tailwind component, with a summary row, an invoice table, and an empty state
**Constraints:** WCAG 2.2 AA, light and dark mode, no external UI libraries
