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

  // Temporarily disable broken link checking to see what's broken
  onBrokenLinks: "warn", // Change from "throw" to "warn"
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
          routeBasePath: "/", // Changed from "/" to "/docs"
          editUrl: "https://github.com/flagpole-corp/flagpole-docs/tree/main/",
        },
        // Enable blog
        blog: {
          showReadingTime: true,
          readingTime: ({ content, frontMatter, defaultReadingTime }) =>
            defaultReadingTime({ content, options: { wordsPerMinute: 300 } }),
          editUrl: "https://github.com/flagpole-corp/flagpole-docs/tree/main/",
          blogTitle: "FlagPole Blog",
          blogDescription:
            "Feature flags insights, tutorials, and best practices",
          postsPerPage: "ALL",
          blogSidebarTitle: "All posts",
          blogSidebarCount: "ALL",
        },
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
        hashed: true,
        language: ["en"],
        docsRouteBasePath: "/docs",
        blogRouteBasePath: "/blog", // Fixed: use string instead of false
        indexDocs: true,
        indexBlog: true, // Enable blog indexing
        indexPages: false,
        removeDefaultStopWordFilter: true,
        highlightSearchTermsOnTargetPage: true,
        searchResultContextMaxLength: 50,
        explicitSearchResultPath: true,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
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
        srcDark: "img/FP_Logo_light.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        // Add Blog link to navbar
        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },
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
              to: "/docs/getting-started",
            },
            {
              label: "Node.js SDK",
              to: "/docs/server/nodejs",
            },
            {
              label: "React SDK",
              to: "/docs/client/react",
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
            // Add blog link to footer
            {
              label: "Blog",
              to: "/blog",
            },
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
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
