import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "FlagPole - Feature Flags Documentation",
  tagline: "Documentation for FlagPole Feature Flags Platform",
  favicon: "img/favicon.ico",
  url: "https://app.useflagpole.dev",
  baseUrl: "/",
  organizationName: "FlagPole",
  projectName: "FlagPole feature-flags-docs",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl: "https://github.com/flagpole-corp/flagpole-docs/tree/main/",
        },
        blog: false, // Disable blog if not needed
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    function customPlugin() {
      return {
        name: "custom-plugin",
        configureWebpack() {
          return {
            resolve: {
              alias: {
                "@site/docs/overview.md": "@site/docs/index.md",
                "@site/docs/docs/overview.md": "@site/docs/index.md",
              },
            },
          };
        },
      };
    },
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        // Whether to index docs pages
        docsRouteBasePath: "/",

        // Whether to index blog pages
        blogRouteBasePath: false, // Disable blog indexing

        // Language for search
        language: ["en"],

        // Hash the search index for better caching
        hashed: true,

        // Index all content including page title, headings, and body
        indexDocs: true,
        indexBlog: false,
        indexPages: false,

        // Remove default stop words for better search
        removeDefaultStopWordFilter: true,

        // Highlight search results
        highlightSearchTermsOnTargetPage: true,

        // Search result context length
        searchResultContextMaxLength: 50,

        // Enable search suggestions
        explicitSearchResultPath: true,

        // Search bar placeholder
        searchBarShortcut: true,
        searchBarShortcutHint: true,

        // Translations
        translations: {
          search_placeholder: "Search docs",
          see_all_results: "See all results",
          no_results: "No results.",
          search_results_for: 'Search results for "{{ keyword }}"',
          search_the_documentation: "Search the documentation",
          count_documents_found: "{{ count }} document found",
          count_documents_found_plural: "{{ count }} documents found",
          no_documents_were_found: "No documents were found",
        },
      },
    ],
  ],
  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "",
      logo: {
        alt: "Flagpole Logo",
        src: "img/FP_Logo_dark.svg",
        srcDark: "img/FP_Logo_light.svg", // Add dark mode logo
      },
      items: [
        {
          type: "search",
          position: "right",
        },
        {
          href: "https://github.com/flagpole-corp/flagpole-docs",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/getting-started",
            },
            {
              label: "Node.js SDK",
              to: "/server/nodejs",
            },
            {
              label: "React SDK",
              to: "/client/react",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/flagpole",
            },
            {
              label: "GitHub",
              href: "https://github.com/flagpole-corp",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Website",
              href: "https://useflagpole.dev",
            },
            {
              label: "GitHub",
              href: "https://github.com/flagpole-corp/flagpole-docs",
            },
          ],
        },
      ],
      copyright: `${new Date().getFullYear()} FlagPole LLC.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "typescript", "javascript"],
    },
    // Add search metadata
    metadata: [
      {
        name: "keywords",
        content: "feature flags, flagpole, documentation, sdk",
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
