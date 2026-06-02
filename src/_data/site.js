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
    { href: "/", label: "today" },
    { href: "/archive/", label: "archive" },
    { href: "/topics/", label: "topics", showIfTopics: true },
    { href: "/tags/", label: "tags" },
    { href: "/archetypes/", label: "archetypes" },
    { href: "/widgets/", label: "widgets" },
    { href: "/feed.xml", label: "feed" },
  ],
};
