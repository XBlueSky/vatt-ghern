(function () {
  if (window.__vgWidget_feature_flags__bound) return;
  window.__vgWidget_feature_flags__bound = true;

  const ENVS = ["production", "staging", "dev"];

  const INITIAL = [
    { name: "new_billing_flow",      desc: "Switch to v2 invoice rendering pipeline",   enabled: { production: false, staging: true,  dev: true }, rollout: 25 },
    { name: "inline_mention_picker", desc: "Doc-comment @-mentions with type-ahead",     enabled: { production: true,  staging: true,  dev: true }, rollout: 100 },
    { name: "compact_activity_feed", desc: "Collapse repeated edit events in the feed",  enabled: { production: false, staging: false, dev: true }, rollout: 0 }
  ];

  function init(root) {
    // Deep-copy per instance so toggles on one widget don't bleed to siblings.
    const flags = INITIAL.map((f) => ({
      name: f.name,
      desc: f.desc,
      enabled: { ...f.enabled },
      rollout: f.rollout,
    }));

    const table = root.querySelector("[data-flag-table]");
    const output = root.querySelector("[data-json-output]");

    function renderTable() {
      table.replaceChildren();
      for (const flag of flags) {
        const row = document.createElement("div");
        row.className = "vg-w-feature-flags__row";
        row.setAttribute("data-flag-row", flag.name);

        const nameCell = document.createElement("span");
        nameCell.className = "vg-w-feature-flags__name";
        nameCell.textContent = flag.name;
        row.appendChild(nameCell);

        for (const env of ENVS) {
          const toggle = document.createElement("input");
          toggle.type = "checkbox";
          toggle.className = "vg-w-feature-flags__env-toggle";
          toggle.setAttribute("data-env-toggle", env);
          toggle.checked = flag.enabled[env];
          toggle.setAttribute("aria-label", `${flag.name} in ${env}`);
          toggle.title = env;
          toggle.addEventListener("change", () => {
            flag.enabled[env] = toggle.checked;
            renderOutput();
          });
          row.appendChild(toggle);
        }

        const pct = document.createElement("input");
        pct.type = "number";
        pct.min = "0";
        pct.max = "100";
        pct.step = "5";
        pct.value = String(flag.rollout);
        pct.className = "vg-w-feature-flags__pct";
        pct.setAttribute("data-rollout-pct", flag.name);
        pct.setAttribute("aria-label", `${flag.name} rollout percentage`);
        pct.addEventListener("input", () => {
          const v = Math.max(0, Math.min(100, Number(pct.value) || 0));
          flag.rollout = v;
          renderOutput();
        });
        row.appendChild(pct);

        const desc = document.createElement("p");
        desc.className = "vg-w-feature-flags__desc";
        desc.textContent = flag.desc;
        row.appendChild(desc);

        table.appendChild(row);
      }
    }

    function esc(s) {
      return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    }

    // Render the config as syntax-highlighted JSON. Tokens: k=key, b=boolean,
    // n=number, p=punctuation — coloured by scoped CSS in the partial. All
    // values are booleans/numbers and keys are constants, so no escaping risk
    // beyond the defensive esc() on flag names.
    function renderOutput() {
      const lines = ['<span class="p">{</span>'];
      flags.forEach((flag, fi) => {
        lines.push('  <span class="k">"' + esc(flag.name) + '"</span><span class="p">:</span> <span class="p">{</span>');
        const entries = [
          ...ENVS.map((env) => ['"' + env + '"', String(flag.enabled[env]), "b"]),
          ['"rollout_pct"', String(flag.rollout), "n"],
        ];
        entries.forEach(([key, val, cls], i) => {
          const comma = i < entries.length - 1 ? '<span class="p">,</span>' : "";
          lines.push('    <span class="k">' + key + '</span><span class="p">:</span> <span class="' + cls + '">' + val + "</span>" + comma);
        });
        lines.push('  <span class="p">}</span>' + (fi < flags.length - 1 ? '<span class="p">,</span>' : ""));
      });
      lines.push('<span class="p">}</span>');
      output.innerHTML = lines.join("\n");
    }

    renderTable();
    renderOutput();
  }

  function bindAll() {
    document.querySelectorAll(".vg-w-feature-flags").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAll);
  } else {
    bindAll();
  }
})();
