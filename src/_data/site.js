// Site-wide data accessible in any template as `site.*`.
// Nav `topics` link is filtered out at render time when no posts have topics yet.
export default {
  name: "vatt'ghern",
  subtitle: "jaskier's ballads",
  description: "Daily tech news for engineers — curated and storied by an AI bard.",
  url: "https://vatt-ghern.pages.dev",
  lang: "zh-Hant",
  startedYear: 2026,
  nav: [
    { href: "/", label: "今日" },
    { href: "/archive/", label: "歷史" },
    { href: "/topics/", label: "主題", showIfTopics: true },
    { href: "/tags/", label: "標籤" },
    { href: "/feed.xml", label: "feed" },
  ],
};
