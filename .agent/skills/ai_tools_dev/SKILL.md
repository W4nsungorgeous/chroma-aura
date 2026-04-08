---
name: AI Tools Directory Developer
description: A specialized workflow for creating high-performance, SEO-optimized AI tool directory websites using Next.js, focused on visual preview feedback loops.
---

# AI Tools Directory Developer Skill

This skill provides a standardized blueprint for building premium AI Tool Stations (Agreggators) with a focus on **Programmatic SEO (pSEO)** and **Visual Feedback**.

## 1. Core Principles
- **SEO First**: Every decision (URL structure, data model, SSR) is driven by SEO performance.
- **Visual Feedback Loop**: Always provide a screenshot or recording of the local dev server using `browser_subagent` after UI changes.
- **Premium Aesthetics**: Use modern typography (Google Fonts), subtle gradients, and glassmorphism. Avoid generic presets.

## 2. Technology Stack
- **Framework**: Next.js (SSR/ISR for peak SEO).
- **Styling**: Vanilla CSS (Global tokens + CSS Modules).
- **Icons**: Lucide-react or Phosphor-icons.
- **Animations**: Framer Motion.

## 3. SEO Blueprint
- **Programmatic Landing Pages**:
    - `/category/[slug]` (e.g., `/video-editing`)
    - `/alternatives-to/[tool-name]`
    - `/compare/[tool-a]-vs-[tool-b]`
- **Essential Schemas**:
    - `SoftwareApplication`: For the tool page.
    - `Review`: For ratings.
    - `FAQPage`: For search snippet optimization.
- **Content Strategy**:
    - Unique "Editor's Review" for top-tier tools.
    - Comparison tables for every VS page.

## 4. Development Workflow
### Phase 1: Foundation
1. Initialize Next.js project.
2. Define `CSS Variables` (Colors, Spacing, Typography).
3. Create the data schema for tools (JSON/Prisma).

### Phase 2: Componentization
1. Build the `ToolCard` component.
2. Build the `SearchFilter` bar.
3. Build the `SEO_Metadata` component with dynamic JSON-LD injection.

### Phase 3: Assembly & Preview
1. Assemble the `Index` and `Category` pages.
2. **Preview Loop**:
    - Run `npm run dev`.
    - Use `browser_subagent` to capture UI.
    - Wait for User feedback.

### Phase 4: Polish
1. Add micro-animations using Framer Motion.
2. Optimize LCP/CLS (Core Web Vitals).

## 5. Visual Interaction Guide
- If the USER says "Change that [Visual Element]", the Agent should:
    1. Inspect the DOM in the latest browser screenshot.
    2. Map the visual element to the corresponding CSS/Component file.
    3. Apply the change and provide a new screenshot immediately.
