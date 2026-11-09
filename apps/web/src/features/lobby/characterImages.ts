import type { CharacterId } from "@mystery-game/contracts";

/** Display order and card art (files are served from /images via Vite publicDir). */
export const characterTiles: { id: CharacterId; image: string }[] = [
  { id: "mustard", image: "/col_mustard.jpg" },
  { id: "plum", image: "/prof_plum.jpg" },
  { id: "green", image: "/rev_green.jpg" },
  { id: "peacock", image: "/mrs_peacock.jpg" },
  { id: "scarlet", image: "/miss_scarlett.jpg" },
  { id: "orchid", image: "/dr_orchid.jpg" },
];
