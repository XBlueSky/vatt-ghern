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

  const state = load();
  document.addEventListener("DOMContentLoaded", () => {
    applyVisuals(state);
    bindManualToggles(state);
    bindReset(state);
    bindAutoMark(state);
    bindCopyLink();
  });
})();
