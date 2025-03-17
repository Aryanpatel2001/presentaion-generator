import { create } from "zustand";
import { Slide } from "@/lib/types";
import { persist } from "zustand/middleware";
import { Project } from "@prisma/client";

interface SlideState {
  slides: Slide[];
  project: Project | null;
  setSlides: (slides: Slide[]) => void;
  setProject: (id: Project) => void;
}

export const useSlideStore = create(
  persist<SlideState>(
    (set) => ({
      project: null,
      slides: [],
      setSlides: (slides: Slide[]) => set({ slides }),
      setProject: (project) => set({ project }),
    }),
    {
      name: "slides-storage",
    }
  )
);
