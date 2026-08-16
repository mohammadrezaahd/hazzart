"use client";

import { IArts } from "@/interfaces";
import { DeskModeComponent } from "./DeskMode.component";
import { ListModeComponent } from "./ListMode.component";

export type GalleryMode = "list" | "desk";

interface GalleryModeProps {
  arts: IArts[];
  mode: GalleryMode;
  rows?: number;
}

export const GalleryModeComponent = ({
  arts,
  mode,
  rows = 5,
}: GalleryModeProps) => {
  return (
    <div
      data-gallery-mode={mode}
      className="relative h-full w-full overflow-hidden bg-transparent"
    >
      {mode === "desk" ? (
        <DeskModeComponent arts={arts} />
      ) : (
        <ListModeComponent arts={arts} rows={rows} />
      )}
    </div>
  );
};
