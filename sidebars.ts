import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  docs: [
    "overview",
    {
      type: "category",
      label: "Client SDKs",
      items: ["client/react", "client/angular"],
    },
    {
      type: "category",
      label: "Server SDKs",
      items: ["server/nodejs"],
    },
  ],
};

export default sidebars;
