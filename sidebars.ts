import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "doc",
      id: "overview",
    },
    {
      type: "doc",
      id: "getting-started",
    },
    {
      type: "category",
      label: "Client SDKs",
      items: [
        "client/react",
        "client/angular",
        "client/vue",
        "client/react-native",
        "client/flutter",
      ],
    },
    {
      type: "category",
      label: "Server SDKs",
      items: ["server/nodejs", "server/python"],
    },
  ],
};

export default sidebars;
