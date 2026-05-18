// vatt-ghern read-tracker
// Pure localStorage. No network. No analytics. Per-post + per-roundup-item.
// Spec ref: docs/superpowers/specs/2026-05-16-vatt-ghern-design.md §6.4

(function () {
  const KEY = "vg-read";
  const DWELL_MS = 5000;
  const SCROLL_RATIO = 0.95;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* private mode / quota — silently no-op */ }
  }
  function isRead(state, key) { return state[key] === "read"; }
  function mark(state, key, value) {
    if (value) state[key] = "read";
    else delete state[key];
    save(state);
    applyVisuals(state);
  }

  function pathKey() {
    return location.pathname.replace(/\/?$/, "/");
  }

  function applyVisuals(state) {
    // Apply to per-post links / cards on listing pages.
    document.querySelectorAll("[data-vg-readkey]").forEach((el) => {
      const k = el.getAttribute("data-vg-readkey");
      el.classList.toggle("vg-read", isRead(state, k));
    });
    // Apply to current post body if marked.
    if (isRead(state, pathKey())) {
      document.querySelectorAll(".vg-post-title").forEach((el) => el.classList.add("vg-read"));
    }
    // Apply per-item state inside a roundup.
    document.querySelectorAll("[data-vg-readkey-item]").forEach((el) => {
      const k = el.getAttribute("data-vg-readkey-item");
      el.classList.toggle("vg-read", isRead(state, k));
    });
    // Update roundup progress (N / 10).
    document.querySelectorAll("[data-vg-progress-of]").forEach((el) => {
      const prefix = el.getAttribute("data-vg-progress-of");
      const items = Object.keys(state).filter((k) => k.startsWith(prefix) && k.includes("#item-"));
      const total = parseInt(el.getAttribute("data-vg-progress-total") || "10", 10);
      el.textContent = `${items.length} / ${total} read`;
    });
  }

  function bindManualToggles(state) {
    document.querySelectorAll("[data-vg-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = btn.getAttribute("data-vg-toggle");
        mark(state, k, !isRead(state, k));
        btn.textContent = isRead(state, k) ? "↶ unread" : "✓ read";
      });
      const k = btn.getAttribute("data-vg-toggle");
      btn.textContent = isRead(state, k) ? "↶ unread" : "✓ read";
    });
  }

  function bindReset(state) {
    const reset = document.getElementById("vg-reset-read");
    if (!reset) return;
    reset.addEventListener("click", () => {
      if (!confirm("Reset all read state?")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      Object.keys(state).forEach((k) => delete state[k]);
      applyVisuals(state);
      bindManualToggles(state);
    });
  }

  function bindAutoMark(state) {
    // Only on post pages — detect via meta marker on body.
    if (!document.body.classList.contains("vg-post-page")) return;
    const k = pathKey();
    if (isRead(state, k)) return;
    let dwelled = false;
    let scrolled = false;
    function maybeMark() {
      if (dwelled && scrolled && !isRead(state, k)) mark(state, k, true);
    }
    setTimeout(() => { dwelled = true; maybeMark(); }, DWELL_MS);
    window.addEventListener("scroll", () => {
      const doc = document.documentElement;
      const ratio = (doc.scrollTop + window.innerHeight) / doc.scrollHeight;
      if (ratio >= SCROLL_RATIO) { scrolled = true; maybeMark(); }
    }, { passive: true });
  }

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

  // Inject a "✓ mark read" button into each unread card's meta row so a user
  // who scanned the lede and decided to skip can mark it without clicking
  // through to the source. Button hides itself once the card becomes read
  // (CSS .vg-read .vg-card-roundup-mark-btn { display: none }).
  function bindRoundupMarkReadButton(state) {
    document.querySelectorAll(".vg-card-roundup").forEach((card) => {
      const key = card.getAttribute("data-vg-readkey-item");
      if (!key) return;
      if (card.querySelector(".vg-card-roundup-mark-btn")) return;
      const meta = card.querySelector(".vg-card-meta");
      if (!meta) return;
      const sep = document.createElement("span");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "·";
      sep.className = "vg-card-meta-sep";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vg-card-roundup-mark-btn";
      btn.textContent = "✓ mark read";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isRead(state, key)) mark(state, key, true);
      });
      meta.appendChild(sep);
      meta.appendChild(btn);
    });
  }

  // Inject a "mark all read" link next to the N / N read progress span, so
  // the user can collapse the whole roundup in one click after a full scan.
  function bindRoundupMarkAllRead(state) {
    document.querySelectorAll("[data-vg-progress-of]").forEach((progress) => {
      if (progress.parentNode.querySelector(".vg-card-progress-mark-all")) return;
      const prefix = progress.getAttribute("data-vg-progress-of");
      const cards = [...document.querySelectorAll(`[data-vg-readkey-item^="${prefix}"]`)];
      if (cards.length === 0) return;
      const sep = document.createElement("span");
      sep.setAttribute("aria-hidden", "true");
      sep.className = "vg-card-progress-sep";
      sep.textContent = "·";
      const link = document.createElement("button");
      link.type = "button";
      link.className = "vg-card-progress-mark-all";
      link.textContent = "mark all read";
      link.addEventListener("click", () => {
        cards.forEach((card) => {
          const k = card.getAttribute("data-vg-readkey-item");
          if (k && !isRead(state, k)) mark(state, k, true);
        });
      });
      progress.parentNode.insertBefore(sep, progress.nextSibling);
      progress.parentNode.insertBefore(link, sep.nextSibling);
    });
  }

  // Mobile-only tag-cloud expander.
  // Two surfaces use chips:
  //   - /tags page: <ul class="vg-tag-cloud"><li><a class="vg-tag-cloud-item">
  //   - Post chrome: <nav class="vg-post-trail"><a class="vg-tag">…
  // For both, collapse to ~first 5 chips on mobile and add a "+N more" toggle.
  function bindTagCloudExpander() {
    if (!window.matchMedia("(max-width: 640px)").matches) return;

    document.querySelectorAll(".vg-tag-cloud").forEach((cloud) => {
      const items = cloud.querySelectorAll("li");
      if (items.length <= 6) return;
      cloud.classList.add("vg-tag-cloud-collapsed");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vg-tag-cloud-toggle";
      btn.textContent = "+" + (items.length - 6) + " more";
      btn.addEventListener("click", () => {
        const open = cloud.classList.toggle("vg-tag-cloud-collapsed");
        btn.textContent = open ? "+" + (items.length - 6) + " more" : "− less";
      });
      cloud.insertAdjacentElement("afterend", btn);
      // Start collapsed.
      cloud.classList.add("vg-tag-cloud-collapsed");
    });

    document.querySelectorAll(".vg-post-trail").forEach((trail) => {
      const chips = trail.querySelectorAll(":scope > .vg-tag");
      if (chips.length <= 5) return;
      const extras = Array.from(chips).slice(5);
      extras.forEach((c) => c.classList.add("vg-tag-collapsed-extra"));
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vg-tag-trail-toggle";
      btn.textContent = "+" + extras.length + " more";
      btn.addEventListener("click", () => {
        const open = extras[0].classList.toggle("vg-tag-collapsed-extra-show");
        extras.forEach((c, i) => {
          if (i === 0) return;
          c.classList.toggle("vg-tag-collapsed-extra-show", open);
        });
        btn.textContent = open ? "− less" : "+" + extras.length + " more";
      });
      // Inject the button right after the last visible chip (5th).
      chips[4].insertAdjacentElement("afterend", btn);
    });
  }

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
    bindRoundupMarkReadButton(state);
    bindRoundupMarkAllRead(state);
    bindTagCloudExpander();
  });
})();
