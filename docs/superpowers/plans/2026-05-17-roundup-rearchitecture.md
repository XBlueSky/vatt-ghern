# Roundup Re-architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-sentence italic roundup item layout with a 1-sentence non-italic layout that collapses to a single line when read, auto-marks on source-link click, and groups items by domain.

**Architecture:** CSS rewrites for `.vg-card-roundup` and `.vg-read` collapse; new `bindAutoMarkOnLinkClick` handler in `read-tracker.js`; restructure existing `roundup.html` sample to demo domain grouping. Skill reference docs updated so future routine runs follow new rules.

**Tech Stack:** Vanilla CSS (OKLCH dual-theme), vanilla JS IIFE, Nunjucks templates, no build-time HTML rewriting.

**Spec reference:** `docs/superpowers/specs/2026-05-17-roundup-rearchitecture.md`.

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `src/static/site.css` | Modify (3 blocks) | Density rewrite for `.vg-card-roundup`; new `.vg-card-meta`; new `.vg-read` collapse rules scoped to roundup cards |
| `src/static/read-tracker.js` | Modify | Add auto-mark on `.vg-card-meta a` click; add expand-toggle handler for collapsed cards |
| `src/posts/2026/05/16/roundup.html` | Modify | Re-emit cards in domain-grouped order; wrap item content in `.vg-card-roundup-body`; add section counts; shorten ledes to one sentence |
| `skills/daily-news/references/archetypes.md` | Modify (roundup section) | One-sentence lede rule; domain-grouped emit order; section label includes count |
| `tests/archetype-check.mjs` | Modify | Validate section labels present per non-empty domain; validate lede is single sentence (≤1 `。`) |
| `skills/daily-news/SKILL.md` | Modify (Step 6) | Reflect new emit order + lede length constraint |

Total: 6 files. Net additions ~ 200 lines of CSS / JS / Nunjucks; net removals ~ 80 lines (collapsed ledes, simpler markup).

---

## Task 1: CSS — density rewrite for `.vg-card-roundup`

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/static/site.css` (around line 560-610)

- [ ] **Step 1: Locate the existing `.vg-card-roundup` block**

```bash
grep -n '\.vg-card-roundup ' /Users/bluesky/arsenal/vatt-ghern/src/static/site.css
```

Expected output around line 560:
```
560:.vg-card-roundup {
```

- [ ] **Step 2: Replace the entire `.vg-card-roundup` block + its children + mobile media query**

Find this exact section (lines 560 to roughly 610 — the desktop rule, the `> div` wrapper rule, the title/lede/code wrap helpers, the `vg-card-roundup-num`, and the mobile @media block that collapses to single-column):

```css
.vg-card-roundup {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 4px;
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: var(--s-4);
  align-items: baseline;
  scroll-margin-top: 5rem;
}
.vg-card-roundup > div { min-width: 0; }
.vg-card-roundup .vg-card-title,
.vg-card-roundup .vg-card-lede,
.vg-card-roundup p,
.vg-card-roundup code {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.vg-card-roundup-num {
  font-family: var(--display);
  font-style: italic;
  font-size: var(--fs-2xl);
  color: var(--accent);
  line-height: 0.9;
}
/* Mobile: collapse the 2-column grid so the title gets the full card width.
 * The #NN numeral becomes an inline title prefix instead of a side rail. */
@media (max-width: 640px) {
  .vg-card-roundup {
    display: block;
    padding: var(--s-3) var(--s-3) var(--s-3);
  }
  .vg-card-roundup-num {
    font-size: var(--fs-xl);
    line-height: 1;
    margin-right: var(--s-2);
    float: left;
    margin-top: 0.1em;
  }
  .vg-card-roundup-has-deep::after {
    /* Reposition deep marker so it doesn't overlap title in single-column */
    top: var(--s-2);
    right: var(--s-2);
  }
}
```

Replace with the new dense layout:

```css
/* ── Roundup item card ──────────────────────────────────────
 * Density target: ~110px desktop, ~130px mobile. Layout is grid on
 * desktop (4rem #NN rail + body) and block on mobile (#NN floats as
 * title prefix). One-sentence lede in Spectral 400 normal — italic
 * IM Fell was too hard to read at body size.
 */
.vg-card-roundup {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 4px;
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: var(--s-3);
  align-items: baseline;
  padding: var(--s-3);
  scroll-margin-top: 5rem;
  transition: opacity 0.18s ease, padding 0.18s ease;
}
.vg-card-roundup-body { min-width: 0; }
.vg-card-roundup .vg-card-title,
.vg-card-roundup .vg-card-lede,
.vg-card-roundup p,
.vg-card-roundup code {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.vg-card-roundup-num {
  font-family: var(--display);
  font-style: italic;
  font-size: var(--fs-2xl);
  color: var(--accent);
  line-height: 0.9;
}

/* Mobile: numeral floats inline before title, card body becomes block */
@media (max-width: 640px) {
  .vg-card-roundup {
    display: block;
    padding: var(--s-2) var(--s-3);
  }
  .vg-card-roundup-num {
    font-size: var(--fs-xl);
    line-height: 1;
    margin-right: var(--s-2);
    float: left;
    margin-top: 0.1em;
  }
  .vg-card-roundup-has-deep::after {
    top: var(--s-2);
    right: var(--s-2);
  }
}
```

(Key changes: explicit `padding: var(--s-3)`; `.vg-card-roundup > div` becomes `.vg-card-roundup-body` named selector; gap shrinks from `--s-4` to `--s-3`; added `transition` so collapse/expand animates.)

- [ ] **Step 3: Replace the `.vg-card-lede` rule**

Find around line 612 (currently sets IM Fell italic at `--fs-base`):

```css
.vg-card-lede {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-base);
  color: var(--ink-soft);
  margin: 0;
  line-height: 1.65;
}
```

Replace with:

```css
.vg-card-lede {
  font-family: var(--serif);
  font-style: normal;
  font-weight: 400;
  font-size: var(--fs-sm);
  color: var(--ink-soft);
  line-height: 1.55;
  margin: var(--s-1) 0 0;
}
```

(Spectral normal at 15px with 1.55 line-height = comfortable reading, no italic, matches title's Spectral font for visual cohesion.)

- [ ] **Step 4: Add new `.vg-card-meta` rule** (after the `.vg-card-lede` rule)

```css
.vg-card-meta {
  font-family: var(--sans);
  font-size: var(--fs-xs);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--muted);
  margin: var(--s-2) 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: baseline;
}
.vg-card-meta a {
  color: var(--accent-text);
  text-decoration: none;
}
.vg-card-meta a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.vg-card-meta .vg-tag {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-xs);
  letter-spacing: 0;
  text-transform: none;
  font-variant: normal;
}
```

(The meta row is Manrope small caps to match site chrome convention; tag chip stays IM Fell italic per design system.)

- [ ] **Step 5: Build, verify no lint regression**

```bash
cd /Users/bluesky/arsenal/vatt-ghern
npm run clean && npm run build && npm run lint:html 2>&1 | tail -3
```

Expected: 0 errors. Pages render (sample roundup will look broken until Task 3 restructures HTML, that's fine for now).

- [ ] **Step 6: Commit**

```bash
git add src/static/site.css
git commit -m "fix(roundup-css): density rewrite — Spectral 400 lede, named body class, meta row"
```

---

## Task 2: CSS — `.vg-read` collapse scoped to roundup cards

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/static/site.css` (around line 897)

- [ ] **Step 1: Locate existing `.vg-read` block**

```bash
grep -n '^\.vg-read' /Users/bluesky/arsenal/vatt-ghern/src/static/site.css
```

Expected:
```
897:.vg-read {
907:.vg-read-toggle {
```

- [ ] **Step 2: Read the current `.vg-read` rules**

```bash
sed -n '895,925p' /Users/bluesky/arsenal/vatt-ghern/src/static/site.css
```

Note the current behavior: `.vg-read` just sets `opacity: 0.55` and adds a `✓ ` marker. This works for post-page links but is too weak for roundup items.

- [ ] **Step 3: Add the roundup-specific collapse block AFTER the existing generic `.vg-read` rule**

After the `.vg-read-toggle:hover` rule (around line 918), append:

```css

/* ── Roundup item collapsed (read) state ──────────────────────
 * When a roundup item is marked read, collapse it to a single line
 * (title only) AND fade. ✓ green marker + ↕ expand affordance. The
 * .vg-card-roundup-body wrapper handles the show/hide of lede + meta.
 */
.vg-card-roundup.vg-read {
  opacity: 0.55;
  padding: var(--s-2) var(--s-3);
  align-items: center;
}
.vg-card-roundup.vg-read .vg-card-roundup-num {
  font-size: var(--fs-xl);
  line-height: 1;
}
.vg-card-roundup.vg-read .vg-card-title {
  font-weight: 500;
  font-size: var(--fs-sm);
  line-height: 1.3;
  margin: 0;
}
.vg-card-roundup.vg-read .vg-card-title::before {
  content: "✓ ";
  color: var(--sage-deep);
  font-family: var(--scribed);
  font-style: italic;
}
.vg-card-roundup.vg-read .vg-card-title::after {
  content: " ↕";
  color: var(--muted-2);
  font-size: var(--fs-xs);
}
.vg-card-roundup.vg-read .vg-card-lede,
.vg-card-roundup.vg-read .vg-card-meta {
  display: none;
}
.vg-card-roundup.vg-read .vg-card-roundup-has-deep::after,
.vg-card-roundup.vg-read.vg-card-roundup-has-deep::after {
  display: none;
}

/* "Temporarily expanded" — same as unread visually but keeps state */
.vg-card-roundup.vg-read.vg-expanded {
  opacity: 0.85;
  padding: var(--s-3);
  align-items: baseline;
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-roundup-num {
  font-size: var(--fs-2xl);
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-title {
  font-weight: 600;
  font-size: var(--fs-md);
  line-height: 1.4;
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-title::before {
  content: "✓ ";
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-title::after {
  content: "";
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-lede,
.vg-card-roundup.vg-read.vg-expanded .vg-card-meta {
  display: block;
}
.vg-card-roundup.vg-read.vg-expanded .vg-card-meta {
  display: flex;
}

/* "Mark unread" button — shown only on collapsed read cards */
.vg-card-roundup-unread-btn {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-xs);
  color: var(--muted);
  background: none;
  border: none;
  padding: 2px var(--s-2);
  cursor: pointer;
  margin-left: var(--s-2);
}
.vg-card-roundup-unread-btn:hover { color: var(--accent-text); }
.vg-card-roundup:not(.vg-read) .vg-card-roundup-unread-btn { display: none; }

/* ── Roundup section labels (one per non-empty domain) ────────
 * Show count beside the domain name; both in Manrope small caps. */
.vg-roundup-section-label {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  margin: var(--s-4) 0 var(--s-2);
  font-family: var(--sans);
  font-size: var(--fs-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--muted);
}
.vg-roundup-section-label::before {
  content: "";
  flex: 0 0 var(--s-4);
  height: 1px;
  background: var(--line);
}
.vg-roundup-section-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--line);
}
.vg-roundup-section-name { padding: 0 var(--s-2); }
.vg-roundup-section-count {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-xs);
  letter-spacing: 0;
  text-transform: none;
  font-variant: normal;
  color: var(--muted-2);
  padding-left: var(--s-2);
}
```

- [ ] **Step 4: Remove obsolete `.vg-roundup-section-label` rule if it exists**

```bash
grep -n 'vg-roundup-section-label\|vg-roundup-section-name' /Users/bluesky/arsenal/vatt-ghern/src/static/site.css
```

If there's a pre-existing block other than the one you just added (Task A1-A6 might have added it), delete the old occurrence to avoid duplicate rules. Keep only the new one inside the block you wrote in Step 3.

- [ ] **Step 5: Build + verify**

```bash
npm run clean && npm run build && npm run lint:html 2>&1 | tail -3
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/static/site.css
git commit -m "feat(roundup-css): collapse-on-read for roundup cards + section label refresh"
```

---

## Task 3: read-tracker.js — auto-mark on source-link click + expand toggle

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/static/read-tracker.js`

- [ ] **Step 1: Read the current `read-tracker.js` to confirm current structure**

```bash
wc -l /Users/bluesky/arsenal/vatt-ghern/src/static/read-tracker.js
```

Expected: ~120 lines. It already has `bindManualToggles`, `bindReset`, `bindAutoMark`, `bindCopyLink`. We're adding `bindRoundupSourceAutoMark` and `bindRoundupExpandToggle`.

- [ ] **Step 2: Add the two new functions to `read-tracker.js`**

Find this section near the bottom (around line 95-107):

```javascript
  function bindCopyLink() {
    document.querySelectorAll("[data-vg-copy-link]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          const orig = btn.textContent;
          btn.textContent = "copied ✓";
          setTimeout(() => { btn.textContent = orig; }, 1500);
        } catch (e) { /* clipboard denied — no-op */ }
      });
    });
  }
```

Right BEFORE the final IIFE block (`const state = load(); document.addEventListener("DOMContentLoaded", ...)`), insert:

```javascript

  // Auto-mark a roundup item as read when the user clicks any source / deep
  // link inside its meta row. Click reflects intent — opening the article
  // means "I'm reading it". Navigation proceeds normally; the mark+save
  // completes synchronously before the browser leaves the page.
  function bindRoundupSourceAutoMark(state) {
    document.querySelectorAll(".vg-card-roundup").forEach((card) => {
      const key = card.getAttribute("data-vg-readkey-item");
      if (!key) return;
      const links = card.querySelectorAll(".vg-card-meta a");
      links.forEach((a) => {
        a.addEventListener("click", () => {
          if (!isRead(state, key)) mark(state, key, true);
          // Do not preventDefault — let navigation proceed.
        });
      });
    });
  }

  // Collapsed-read roundup cards can be temporarily expanded to re-read
  // the lede without leaving the read state. Toggling .vg-expanded shows
  // lede/meta without removing .vg-read (so the next render still treats
  // the card as collapsed).
  function bindRoundupExpandToggle(state) {
    document.querySelectorAll(".vg-card-roundup").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!card.classList.contains("vg-read")) return;
        // Click on the unread button restores unread state — handled below.
        if (e.target.closest(".vg-card-roundup-unread-btn")) return;
        // Click on a link (lede or expanded meta) — let it navigate; do not toggle.
        if (e.target.closest("a")) return;
        card.classList.toggle("vg-expanded");
      });
    });
  }

  // When a card is collapsed-read, surface a small "↶ unread" button so the
  // user can reverse. Wire it to mark(false) on the readkey.
  function bindRoundupUnreadButton(state) {
    document.querySelectorAll(".vg-card-roundup").forEach((card) => {
      const key = card.getAttribute("data-vg-readkey-item");
      if (!key) return;
      // Only inject the button once per card.
      if (card.querySelector(".vg-card-roundup-unread-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vg-card-roundup-unread-btn";
      btn.textContent = "↶ unread";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        mark(state, key, false);
        card.classList.remove("vg-expanded");
      });
      // Append inside the body wrapper so it sits visually below the title
      // when expanded; CSS hides it when not .vg-read.
      const body = card.querySelector(".vg-card-roundup-body") || card.querySelector(":scope > div");
      if (body) body.appendChild(btn);
    });
  }
```

- [ ] **Step 3: Update the bottom DOMContentLoaded handler to call the new binders**

Find the existing handler (last ~7 lines of the file):

```javascript
  const state = load();
  document.addEventListener("DOMContentLoaded", () => {
    applyVisuals(state);
    bindManualToggles(state);
    bindReset(state);
    bindAutoMark(state);
    bindCopyLink();
  });
})();
```

Replace with:

```javascript
  const state = load();
  document.addEventListener("DOMContentLoaded", () => {
    applyVisuals(state);
    bindManualToggles(state);
    bindReset(state);
    bindAutoMark(state);
    bindCopyLink();
    bindRoundupSourceAutoMark(state);
    bindRoundupExpandToggle(state);
    bindRoundupUnreadButton(state);
  });
})();
```

- [ ] **Step 4: Build + manual smoke test**

```bash
npm run clean && npm run build
npm run dev > /tmp/vg-roundup-fix.log 2>&1 &
sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

Expected: `200`. Don't try to test the click handlers via curl — that needs a real browser. The sample roundup will look broken layout-wise until Task 4 restructures the HTML; that's expected. Just confirm dev server starts.

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add src/static/read-tracker.js
git commit -m "feat(read-tracker): auto-mark on source click + expand toggle + ↶ unread for roundup cards"
```

---

## Task 4: Restructure existing sample roundup HTML

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/roundup.html`

**Critical: keep all 10 items' real content (titles, lede prose, source URLs, deep links, tags). Only change the markup wrapper + grouping order + lede length.**

The current roundup has items in score order (`#01` QUIC infra, `#02` ClickHouse storage, `#03` GitHub eBPF infra, `#04` CVE systems, etc.) and uses a `<div>` wrapper inside each `.vg-card-roundup` without the named `.vg-card-roundup-body` class.

Domain layout (per spec §6, fixed order `ai → systems → infra → storage → industry`):

- **AI** (1 item): `#10` Δ-Mem
- **SYSTEMS** (3 items): `#04` CVE-2026-31431, `#05` Pixel 10, `#06` FreeBSD CVE-2026-7270
- **INFRA** (3 items): `#01` QUIC, `#03` GitHub eBPF, `#07` GitHub diff perf
- **STORAGE** (2 items): `#02` ClickHouse, `#09` VLDB SSD paper
- **INDUSTRY** (1 item): `#08` Debian reproducible builds

- [ ] **Step 1: Read the current roundup.html**

```bash
cat /Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/roundup.html | head -80
```

Note the structure of each item card:

```html
<article class="vg-card vg-card-roundup [vg-card-roundup-has-deep]" id="item-NN"
         data-vg-readkey-item="{{ page.url }}#item-NN">
  <span class="vg-card-roundup-num">#NN</span>
  <div>
    <h2 class="vg-card-title">...</h2>
    <p class="vg-card-lede">...</p>
    <p>...source links and tags...</p>
  </div>
</article>
```

- [ ] **Step 2: Replace the `<section class="vg-roundup-list">` block entirely**

Find the existing block starting from `<section class="vg-roundup-list" aria-label="today's stories">` up to and including its closing `</section>` (it contains the progress span, the 10 article cards, and any current `vg-roundup-section-label` headers).

Replace with this new domain-grouped structure (kept content from the existing items — titles, ledes shortened to one sentence, all original source URLs preserved):

```html
<section class="vg-roundup-list" aria-label="today's stories">
  <span data-vg-progress-of="{{ page.url }}#item-"
        data-vg-progress-total="10"
        class="vg-card-progress">0 / 10 read</span>

  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">AI</span>
    <span class="vg-roundup-section-count">1 篇</span>
  </header>

  <article class="vg-card vg-card-roundup" id="item-10"
           data-vg-readkey-item="{{ page.url }}#item-10">
    <span class="vg-card-roundup-num">#10</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">Δ-Mem：以差分表示壓縮 LLM 長序列記憶體——讓 online memory 不再是記憶體殺手</h2>
      <p class="vg-card-lede">arXiv 新 paper 提出差分編碼把 LLM online memory 從 O(N) 壓到 O(log N)，對長對話場景特別有用。</p>
      <p class="vg-card-meta">
        <a href="https://arxiv.org/abs/2605.12357">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/AI/">AI</a>
      </p>
    </div>
  </article>

  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">SYSTEMS</span>
    <span class="vg-roundup-section-count">3 篇</span>
  </header>

  <article class="vg-card vg-card-roundup vg-card-roundup-has-deep" id="item-04"
           data-vg-readkey-item="{{ page.url }}#item-04">
    <span class="vg-card-roundup-num">#04</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">CVE-2026-31431「Copy Fail」——透過 AF_ALG 與 splice() 把 shellcode 寫進 setuid 二進位</h2>
      <p class="vg-card-lede">algif_aead 對 recvmsg() scatterlist 少做的邊界檢查讓攻擊者用 splice() 改寫 setuid 二進位達到本地提權，Cloudflare 以 bpf-lsm 在 48 小時內封鎖 AF_ALG 完成緩解。</p>
      <p class="vg-card-meta">
        <a href="https://blog.cloudflare.com/copy-fail-linux-vulnerability-mitigation/">read source →</a>
        <span aria-hidden="true">·</span>
        <a href="/2026/05/16/deep-copy-fail-cve-2026-31431/">deep ↗</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/kernel/">kernel</a>
      </p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-05"
           data-vg-readkey-item="{{ page.url }}#item-05">
    <span class="vg-card-roundup-num">#05</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">Pixel 10 0-click 漏洞鏈——5 行程式碼的任意核心讀寫</h2>
      <p class="vg-card-lede">Project Zero 揭露 Dolby 解碼器 CVE-2025-54957 與 Pixel 10 WAVE677DV VPU unsafe mmap 組成的零點擊核心讀寫鏈，整個利用只需約五行程式碼。</p>
      <p class="vg-card-meta">
        <a href="https://projectzero.google/2026/05/pixel-10-exploit.html">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/kernel/">kernel</a>
      </p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-06"
           data-vg-readkey-item="{{ page.url }}#item-06">
    <span class="vg-card-roundup-num">#06</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">FreeBSD execve() 本地提權（CVE-2026-7270）——operator precedence 引發的安全漏洞</h2>
      <p class="vg-card-lede">FreeBSD execve() 路徑驗證的運算子優先級錯誤讓非特權使用者繞過 SUID 限制執行任意檔案。</p>
      <p class="vg-card-meta">
        <a href="https://www.freebsd.org/security/advisories/FreeBSD-SA-26:13.exec.asc">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/kernel/">kernel</a>
      </p>
    </div>
  </article>

  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">INFRA</span>
    <span class="vg-roundup-section-count">3 篇</span>
  </header>

  <article class="vg-card vg-card-roundup vg-card-roundup-has-deep" id="item-01"
           data-vg-readkey-item="{{ page.url }}#item-01">
    <span class="vg-card-roundup-num">#01</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">QUIC 的死亡螺旋——Linux 核心 idle 優化如何讓 CUBIC 擁塞窗口永遠卡在最低點</h2>
      <p class="vg-card-lede">Cloudflare quiche 從 Linux 移植 CUBIC idle 修補但缺核心回呼機制，導致 last_sent_time 與 last_ack_time 差一個 RTT，擁塞窗口在丟包後卡在兩個封包；改用 last_ack_time 修復，測試重現率從 60% 歸零。</p>
      <p class="vg-card-meta">
        <a href="https://blog.cloudflare.com/quic-death-spiral-fix/">read source →</a>
        <span aria-hidden="true">·</span>
        <a href="/2026/05/16/deep-quic-cubic-idle/">deep ↗</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/QUIC/">QUIC</a>
      </p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-03"
           data-vg-readkey-item="{{ page.url }}#item-03">
    <span class="vg-card-roundup-num">#03</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">GitHub 用 eBPF 守住部署安全線——阻斷部署腳本的循環依賴</h2>
      <p class="vg-card-lede">GitHub 用 BPF_PROG_TYPE_CGROUP_SOCK_ADDR 攔截 DNS 查詢 + BPF_PROG_TYPE_CGROUP_SKB 過濾出口，在 cgroup 邊界精確標記觸發循環依賴的程序，不必動到應用本身。</p>
      <p class="vg-card-meta">
        <a href="https://github.blog/engineering/infrastructure/how-github-uses-ebpf-to-improve-deployment-safety/">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/eBPF/">eBPF</a>
      </p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-07"
           data-vg-readkey-item="{{ page.url }}#item-07">
    <span class="vg-card-roundup-num">#07</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">GitHub diff 渲染的性能攀升——從 450ms INP 到 100ms 的組件重構路</h2>
      <p class="vg-card-lede">GitHub diff line 元件重寫為 virtual list + 延後 syntax-highlight，INP（互動到下一個畫面）從 450ms 砍到 100ms 以內。</p>
      <p class="vg-card-meta">
        <a href="https://github.blog/engineering/architecture-optimization/the-uphill-climb-of-making-diff-lines-performant/">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/performance/">performance</a>
      </p>
    </div>
  </article>

  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">STORAGE</span>
    <span class="vg-roundup-section-count">2 篇</span>
  </header>

  <article class="vg-card vg-card-roundup vg-card-roundup-has-deep" id="item-02"
           data-vg-readkey-item="{{ page.url }}#item-02">
    <span class="vg-card-roundup-num">#02</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">ClickHouse 帳單管線突然變慢——藏在 query planner 裡的 mutex 瓶頸</h2>
      <p class="vg-card-lede">Cloudflare 分區鍵改動讓 part 數從 3 萬升至 16 萬，query planner 的 exclusive mutex 在數百並行查詢下序列化；三階段修補已合入 ClickHouse 25.11。</p>
      <p class="vg-card-meta">
        <a href="https://blog.cloudflare.com/clickhouse-query-plan-contention/">read source →</a>
        <span aria-hidden="true">·</span>
        <a href="/2026/05/16/deep-clickhouse-query-plan/">deep ↗</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/ClickHouse/">ClickHouse</a>
      </p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-09"
           data-vg-readkey-item="{{ page.url }}#item-09">
    <span class="vg-card-roundup-num">#09</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">VLDB 2026：如何正確寫入 SSD——Flash Translation Layer 的代價與最佳策略</h2>
      <p class="vg-card-lede">VLDB 2026 paper 用 12 個 production workload 證明傳統 SSD write pattern 在現代 FTL 下產生 30-50% 的 write amplification，並提出修正策略。</p>
      <p class="vg-card-meta">
        <a href="https://www.vldb.org/pvldb/vol19/p1469-lee.pdf">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/SSD/">SSD</a>
      </p>
    </div>
  </article>

  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">INDUSTRY</span>
    <span class="vg-roundup-section-count">1 篇</span>
  </header>

  <article class="vg-card vg-card-roundup" id="item-08"
           data-vg-readkey-item="{{ page.url }}#item-08">
    <span class="vg-card-roundup-num">#08</span>
    <div class="vg-card-roundup-body">
      <h2 class="vg-card-title">Debian 強制 Reproducible Builds——新套件若無可重現性，遷移即被封鎖</h2>
      <p class="vg-card-lede">Debian dev-announce 宣布新套件遷移流程強制要求 reproducible build；無法重現的 upload 直接退回上傳者修復後再來。</p>
      <p class="vg-card-meta">
        <a href="https://lists.debian.org/debian-devel-announce/2026/05/msg00001.html">read source →</a>
        <span aria-hidden="true">·</span>
        <a class="vg-tag" href="/tags/reproducible-builds/">reproducible-builds</a>
      </p>
    </div>
  </article>

</section>
```

(Lede length: every lede is now one sentence ending with `。`. Each card uses `.vg-card-roundup-body` wrapper class for the read-tracker.js auto-injection of `↶ unread` button to find a stable home.)

- [ ] **Step 3: Build, lint, archetype-check**

```bash
npm run clean && npm run build 2>&1 | tail -3
npm run lint:html 2>&1 | tail -3
node tests/archetype-check.mjs _site/
node tests/link-check.mjs
```

Expected: all pass. The new tag URLs (`/tags/AI/`, `/tags/performance/`, `/tags/reproducible-builds/`, `/tags/QUIC/`, `/tags/eBPF/`, `/tags/ClickHouse/`, `/tags/SSD/`, `/tags/kernel/`) auto-generate via the `tag.njk` template — but only if any post has those tags in its sidecar. Since the deep-story sidecars already declare some of these tags (QUIC, kernel, ClickHouse), the link-check should mostly pass. If any tag URL 404s in link-check, add that tag to the roundup sidecar's `tags` array:

```bash
cat /Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/roundup.11tydata.json
```

If `tags` is `["roundup", "ai", "systems", "infra", "storage"]`, update to include each tag that link-check flagged.

- [ ] **Step 4: Spin up dev, manually verify in browser at mobile + desktop**

```bash
npm run dev > /tmp/vg-roundup-verify.log 2>&1 &
sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/2026/05/16/roundup/
```

Open in browser. Expected behaviors:

1. Items appear in groups: AI (1) → SYSTEMS (3) → INFRA (3) → STORAGE (2) → INDUSTRY (1)
2. Each card is ~110px tall (desktop), lede is one sentence in Spectral 400 normal (not italic)
3. Click `read source →` on any item — opens the URL, and on returning to the roundup the item shows collapsed with green `✓ ` + `↕`
4. Click a collapsed card's title — temporarily expands (shows lede + meta), but state stays read
5. Hover/click the `↶ unread` button inside an expanded read card — restores unread state

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add src/posts/2026/05/16/roundup.html
git commit -m "fix(roundup-sample): domain-grouped order + 1-sentence ledes + .vg-card-roundup-body wrapper"
```

If you needed to update the sidecar tags in Step 3, include that change in this commit:

```bash
git add src/posts/2026/05/16/roundup.html src/posts/2026/05/16/roundup.11tydata.json
```

---

## Task 5: Update `references/archetypes.md` roundup rules

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes.md`

- [ ] **Step 1: Find the existing `## Roundup spec` section**

```bash
grep -n '^## Roundup spec\|^### Content rules\|^### Visual differentiation' /Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes.md
```

- [ ] **Step 2: Replace the "Visual differentiation rules" subsection**

Find the block starting with `### Visual differentiation rules` and replace with:

```markdown
### Visual differentiation rules

**Deep-story-bearing items**: items that have a corresponding `daily-deep-story`
post must get the `vg-card-roundup-has-deep` modifier class on the `<article>`:

```html
<article class="vg-card vg-card-roundup vg-card-roundup-has-deep" id="item-NN" ...>
```

This adds a sage-colored corner mark "↗ deep" so readers can scan for which
items have drill-down content.

**Domain grouping (mandatory)**: items render in this fixed display order:

```
ai → systems → infra → storage → industry
```

Within each domain, sort by score descending. Each non-empty domain emits
exactly ONE section header at the top of its group:

```html
<header class="vg-roundup-section-label" aria-hidden="true">
  <span class="vg-roundup-section-name">SYSTEMS</span>
  <span class="vg-roundup-section-count">3 篇</span>
</header>
```

The domain name is uppercase English; the count uses CJK 「篇」 with the
integer. Empty domains are skipped (no empty section emitted).

**Important**: `news_id` (`YYYY-MM-DD-NN`) is assigned in **score order**,
NOT display order. The on-page `#NN` numeral therefore appears in
non-monotonic sequence when grouped by domain — this is a feature: it
shows the reader both score-rank and domain at once.

**Item body wrapper**: each card MUST wrap title + lede + meta in a
`<div class="vg-card-roundup-body">` for the read-tracker JS to find a
stable insertion point for the `↶ unread` button.
```

- [ ] **Step 3: Replace the "Content rules" subsection**

Find the block starting with `### Content rules` (right after the Visual differentiation block) and replace its bullet list with this updated version:

```markdown
### Content rules

- `TITLE` format: `YYYY.MM.DD —— 今日 N 則`. Use the actual N, not 10
  if fewer items qualified.
- Lede names today's thread in one sentence — the *one* signal across all
  items. Example: "今日主旋律：io_uring CVE 連環爆 + Cloudflare DNS 服務改版"
- **Item lede is ONE sentence**. Answers "what happened + why an engineer
  cares" in one breath, optionally two clauses separated by `——`. If the
  news needs three sentences to land, it belongs in a deep-story, not the
  roundup. The lede renders as Spectral 400 normal (not italic) — keep
  it readable, not decorative.
- Item meta row uses `<p class="vg-card-meta">` containing source link,
  optional deep link, optional tag chip — in that order, separated by
  `·` dots.
- Stats SVG must render correctly in dark mode (use tokens, not hex).
- The progress span text is updated by the read-tracker JS at runtime;
  never hardcode another number.
```

- [ ] **Step 4: Verify spec docs still build (no Eleventy template syntax accidentally introduced)**

```bash
npm run build 2>&1 | tail -3
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add skills/daily-news/references/archetypes.md
git commit -m "docs(skill): roundup spec — one-sentence lede + domain-grouped emit + body wrapper"
```

---

## Task 6: Update `tests/archetype-check.mjs` for new roundup rules

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/tests/archetype-check.mjs`

- [ ] **Step 1: Locate the `checkRoundup` function**

```bash
grep -n 'function checkRoundup' /Users/bluesky/arsenal/vatt-ghern/tests/archetype-check.mjs
```

- [ ] **Step 2: Replace the `checkRoundup` function with extended version**

Find:

```javascript
function checkRoundup(path, html) {
  const itemMatches = [...html.matchAll(/<article[^>]+class="[^"]*vg-card-roundup[^"]*"[^>]*id="item-(\d+)"/g)];
  if (itemMatches.length === 0) {
    violations.push(`${path}: roundup has no item cards`);
    return;
  }
  const ids = itemMatches.map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (!/^\d{2}$/.test(id)) {
      violations.push(`${path}: id="item-${id}" is not zero-padded 2 digits`);
    }
    if (seen.has(id)) violations.push(`${path}: duplicate id="item-${id}"`);
    seen.add(id);
  }
  // Each item must also have data-vg-readkey-item
  const readkeyCount = (html.match(/data-vg-readkey-item="/g) || []).length;
  if (readkeyCount < itemMatches.length) {
    violations.push(
      `${path}: ${itemMatches.length} item cards but only ${readkeyCount} data-vg-readkey-item attrs`
    );
  }
  // Progress span
  if (!/data-vg-progress-of="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-of span`);
  }
  if (!/data-vg-progress-total="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-total span`);
  }
}
```

Replace with:

```javascript
function checkRoundup(path, html) {
  const itemMatches = [...html.matchAll(/<article[^>]+class="[^"]*vg-card-roundup[^"]*"[^>]*id="item-(\d+)"/g)];
  if (itemMatches.length === 0) {
    violations.push(`${path}: roundup has no item cards`);
    return;
  }
  const ids = itemMatches.map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (!/^\d{2}$/.test(id)) {
      violations.push(`${path}: id="item-${id}" is not zero-padded 2 digits`);
    }
    if (seen.has(id)) violations.push(`${path}: duplicate id="item-${id}"`);
    seen.add(id);
  }
  // Each item must also have data-vg-readkey-item
  const readkeyCount = (html.match(/data-vg-readkey-item="/g) || []).length;
  if (readkeyCount < itemMatches.length) {
    violations.push(
      `${path}: ${itemMatches.length} item cards but only ${readkeyCount} data-vg-readkey-item attrs`
    );
  }
  // Each item must wrap content in .vg-card-roundup-body for read-tracker injection point
  const bodyWrapperCount = (html.match(/class="[^"]*vg-card-roundup-body/g) || []).length;
  if (bodyWrapperCount < itemMatches.length) {
    violations.push(
      `${path}: ${itemMatches.length} item cards but only ${bodyWrapperCount} .vg-card-roundup-body wrappers`
    );
  }
  // Progress span
  if (!/data-vg-progress-of="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-of span`);
  }
  if (!/data-vg-progress-total="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-total span`);
  }
  // Section labels: at least one .vg-roundup-section-label per item (loose
  // proxy for "items are grouped"). Be lenient: roundup with all items in
  // ONE domain only needs ≥1 section label.
  const sectionLabelCount = (html.match(/class="[^"]*vg-roundup-section-label/g) || []).length;
  if (sectionLabelCount < 1) {
    violations.push(
      `${path}: roundup has ${itemMatches.length} items but no domain section labels`
    );
  }
  // One-sentence lede check (heuristic): each lede should contain ≤2 「。」
  // periods (one ending the sentence, one allowed for inline reference like
  // "Cloudflare 25.11." or similar). >2 implies multi-sentence.
  const ledeMatches = [...html.matchAll(/<p[^>]*class="[^"]*vg-card-lede[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
  for (const m of ledeMatches) {
    const text = m[1].replace(/<[^>]+>/g, "");
    const periodCount = (text.match(/。/g) || []).length;
    if (periodCount > 2) {
      const snippet = text.slice(0, 50).trim();
      violations.push(
        `${path}: roundup item lede has ${periodCount} 「。」 periods (max 2 for one-sentence rule): "${snippet}…"`
      );
    }
  }
}
```

- [ ] **Step 3: Run archetype-check against the current built site**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: `OK: archetype-check passed for _site/`. If you get violations, the test caught a real issue — fix the underlying HTML or rule.

- [ ] **Step 4: Commit**

```bash
git add tests/archetype-check.mjs
git commit -m "test(archetype): roundup also validates body wrapper + section labels + one-sentence lede"
```

---

## Task 7: Update `SKILL.md` Step 6 to reflect new emit rules

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md`

- [ ] **Step 1: Locate Step 6 in SKILL.md**

```bash
grep -n '^### Step 6\|^### Step 7' /Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md
```

- [ ] **Step 2: Replace the Step 6 block**

Find the existing Step 6 (starts with `### Step 6: Write roundup HTML + sidecar`) and replace with:

```markdown
### Step 6: Write roundup HTML + sidecar

Read the archetype skeleton at
`${CLAUDE_PLUGIN_ROOT}/src/archetypes/daily-roundup.html` for structure
reference. Author the full HTML following
`references/archetypes.md` § "Roundup spec".

Write to `src/posts/YYYY/MM/DD/roundup.html` plus matching
`.11tydata.json` sidecar.

**Required structural attributes** (the test suite checks them):

- Each item card has `id="item-NN"` (zero-padded), corresponding to
  the score-order `news_id`
- Each item card has `data-vg-readkey-item="{{page.url}}#item-NN"`
- Each item card wraps its `<h2>` + `<p class="vg-card-lede">` +
  `<p class="vg-card-meta">` content in a `<div class="vg-card-roundup-body">`
- Progress span has `data-vg-progress-of` and `data-vg-progress-total`

**Required emit order** (NOT score order):

Items render grouped by domain in this fixed order:
`ai → systems → infra → storage → industry`. Within each domain, sort
by score descending. Each non-empty domain emits exactly ONE section
label header at the top of its group (with `<span class="vg-roundup-section-count">N 篇</span>`).
Empty domains emit no section.

**Lede length**: each item lede is ONE Chinese sentence ending with
`。`. Optionally two clauses separated by `——`. Multi-sentence ledes
fail archetype-check.

**Lede typography**: render as `<p class="vg-card-lede">` — CSS handles
the rest (Spectral 400 normal at `--fs-sm`). Do not add inline
`style=""` or italic markup.
```

- [ ] **Step 3: Verify word count is still within budget**

```bash
wc -w /Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md
```

Expected: < 2700 (was 2563 after Phase A; this task adds ~80 words and removes ~30, net ~+50). If significantly over 2700, move further detail to a reference file.

- [ ] **Step 4: Commit**

```bash
git add skills/daily-news/SKILL.md
git commit -m "docs(skill): Step 6 — domain-grouped emit + one-sentence lede + body wrapper"
```

---

## Task 8: End-to-end verification

- [ ] **Step 1: Clean build + full quality gate**

```bash
cd /Users/bluesky/arsenal/vatt-ghern
npm run clean
npm run build
npm run lint:html
node tests/archetype-check.mjs _site/
node tests/link-check.mjs
```

All five must pass.

- [ ] **Step 2: Dev server + browser smoke test on `/2026/05/16/roundup/`**

```bash
npm run dev > /tmp/vg-roundup-final.log 2>&1 &
sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/2026/05/16/roundup/
```

Expected: `200`.

Open `http://localhost:8080/2026/05/16/roundup/` in a real browser.
Resize to mobile (~390 width) and verify:

1. Items appear in domain order: AI · 1 → SYSTEMS · 3 → INFRA · 3 →
   STORAGE · 2 → INDUSTRY · 1
2. Section labels include count: `SYSTEMS · 3 篇`
3. Each card is ~110 px tall on desktop, ~130 px on mobile; lede is one
   sentence in Spectral 400 normal (not italic)
4. Click `read source →` on item `#04` (Copy Fail CVE) — browser navigates
   to Cloudflare blog. Hit Back. Item now shows collapsed: ~28 px tall,
   `✓ ` green prefix, `↕` suffix, opacity 0.55
5. Click the collapsed `#04` title — expands temporarily to show lede and
   meta (still slightly faded). `↶ unread` button visible inside body
6. Click `↶ unread` — card restores to full unread state
7. Open `/2026/05/16/` paths in dark mode (`localStorage["vg-theme"] = "dark"`
   then reload) — collapsed cards still show green ✓ visible on dark bg

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

- [ ] **Step 3: Push the branch**

```bash
git branch --show-current
```

Should be `daily/2026-05-16` (or whatever the current branch is — do not
switch). Push:

```bash
git push origin daily/2026-05-16
```

- [ ] **Step 4: Verify Cloudflare preview rebuilds**

Wait ~60 seconds, then:

```bash
curl -sL https://api.github.com/repos/XBlueSky/vatt-ghern/commits/$(git rev-parse HEAD)/check-runs | python3 -c "
import json, sys
d = json.load(sys.stdin)
for c in d.get('check_runs', []):
    if 'Cloudflare' in c.get('app', {}).get('name', ''):
        print('Status:', c.get('status'), '/', c.get('conclusion'))
        out = c.get('output', {}).get('summary', '')
        import re
        m = re.search(r\"https://[a-f0-9]+\.vatt-ghern\.pages\.dev\", out)
        if m: print('Preview:', m.group(0))
"
```

Expected: `Status: completed / success` with a `Preview: https://<sha>.vatt-ghern.pages.dev` URL printed.

---

## Self-Review

### Spec coverage walk-through

| Spec section | Plan task | Status |
|---|---|---|
| §3 Density rewrite | Task 1 (CSS) + Task 4 (HTML) | ✓ |
| §3 Lede typography (Spectral 400 normal) | Task 1 (`.vg-card-lede` rule) | ✓ |
| §3 Per-card height target | Task 1 padding + Task 4 one-sentence ledes | ✓ |
| §3 Lede content rule (one sentence) | Task 4 (ledes shortened) + Task 5 (archetypes.md) + Task 6 (lint) + Task 7 (SKILL.md) | ✓ |
| §4 Read state visual (collapse + fade) | Task 2 (`.vg-card-roundup.vg-read` rules) | ✓ |
| §4 Expand-on-click behavior | Task 3 (`bindRoundupExpandToggle`) + Task 2 (`.vg-expanded` CSS) | ✓ |
| §4 Stored state unchanged | (no change needed — existing `vg-read` localStorage continues to drive it) | ✓ |
| §5 Auto-mark on source click | Task 3 (`bindRoundupSourceAutoMark`) | ✓ |
| §5 Manual fallback (`↶ unread`) | Task 3 (`bindRoundupUnreadButton`) + Task 2 (`.vg-card-roundup-unread-btn` CSS) | ✓ |
| §5 Click universe table | Task 3 handlers handle all 6 cases | ✓ |
| §6 Domain ordering (ai→systems→infra→storage→industry) | Task 4 (HTML emit) + Task 5 (spec) + Task 7 (SKILL.md) | ✓ |
| §6 Section labels with count | Task 2 (CSS) + Task 4 (HTML) + Task 5 (spec) | ✓ |
| §6 news_id unchanged (score order) | (no change — already score-keyed) + Task 5 explains why visible | ✓ |
| §6 Card display order (non-monotonic #NN) | Task 4 (HTML emits in domain order) | ✓ |
| §7 File map | All 6 files covered across Tasks 1-7 | ✓ |
| §8 Phased rollout (linear) | Tasks 1→2→3→4→5→6→7→8 (CSS → JS → sample → docs → check → SKILL.md → verify) | ✓ |
| §10 Success criteria | Task 8 Step 2 verifies all four bullet points | ✓ |

### Placeholder scan

No "TBD", "TODO", "fill in", "appropriate", "handle edge cases", or "similar to" markers in any task. Every code block is complete and copy-pasteable. The only non-code prose conveys exact required transformations.

### Type / property consistency

- `.vg-card-roundup-body` wrapper class — used in Task 1 (CSS targets `min-width: 0`), Task 2 (`.vg-card-roundup.vg-read` does not target it), Task 3 (`bindRoundupUnreadButton` queries it as injection point), Task 4 (HTML emits it), Task 5 (spec mentions it), Task 6 (archetype-check counts it). Consistent.
- `data-vg-readkey-item="{{page.url}}#item-NN"` — Task 3 handlers read it via `getAttribute("data-vg-readkey-item")`, Task 4 HTML emits it, Task 6 counts it. Consistent.
- `.vg-card-meta` (new) — Task 1 CSS, Task 3 JS query (`.vg-card-meta a`), Task 4 HTML emits, Task 5 spec mentions. Consistent.
- `.vg-roundup-section-label`, `.vg-roundup-section-name`, `.vg-roundup-section-count` — Task 2 CSS, Task 4 HTML, Task 5 spec, Task 6 lint. Consistent.
- `.vg-card-roundup-unread-btn` — Task 2 CSS, Task 3 JS creates it. Consistent.
- `.vg-expanded` modifier on `.vg-read` — Task 2 CSS, Task 3 JS toggles. Consistent.

No mismatches.

### Spec gaps

None identified.
