import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velvet Journal Co",
    short_name: "Velvet Journal",
    description:
      "Thoughtfully designed gratitude journals, goal planners, wellness journals and guided notebooks for intentional living.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ede7",
    theme_color: "#f4ede7",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
