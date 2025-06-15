import { create } from "zustand";
import { ContentItem, Slide, Theme } from "@/lib/types";
import { persist } from "zustand/middleware";
import { Project } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import type { PersistStorage } from "zustand/middleware";
import localforage from "localforage";
const zustandLocalForageStorage: PersistStorage<SlideState> = {
  getItem: async (name) => {
    const value = await localforage.getItem<{
      state: SlideState;
      version: number;
    }>(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

interface SlideState {
  slides: Slide[];
  project: Project | null;
  setSlides: (slides: Slide[]) => void;
  setProject: (id: Project) => void;
  currentTheme: Theme;
  currentSlide: number;
  removeSlide: (id: string) => void;
  addSlideAtIndex: (slide: Slide, index: number) => void;
  setCurrentTheme: (theme: Theme) => void;
  getOrderedSlides: () => Slide[];
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setCurrentSlide: (index: number) => void;
  updateContentItem: (
    slideId: string,
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void;
  addComponentInSlide: (
    slideId: string,
    item: ContentItem,
    parentId: string,
    index: number
  ) => void;
}

const defaultTheme: Theme = {
  name: "Default",
  fontFamily: "'Inter','sans-serif",
  fontColor: "#333333",
  backgroundColor: "#f0f0f0",
  slideBackgroundColor: "#ffffff",
  accentColor: "#3b82f6",
  type: "light",
};

export const useSlideStore = create(
  persist<SlideState>(
    (set, get) => ({
      project: null,
      slides: [],
      setSlides: (slides: Slide[]) => set({ slides }),
      setProject: (project) => set({ project }),
      currentTheme: defaultTheme,
      currentSlide: 0,
      setCurrentTheme: (theme: Theme) => set({ currentTheme: theme }),
      getOrderedSlides: () => {
        const state = get();
        return [...state.slides].sort((a, b) => a.slideOrder - b.slideOrder);
      },
      addSlideAtIndex: (slide: Slide, index: number) =>
        set((state) => {
          const newSlides = [...state.slides];
          newSlides.splice(index, 0, { ...slide, id: uuidv4() });
          newSlides.forEach((s, i) => {
            s.slideOrder = i;
          });
          return { slides: newSlides, currentSlide: index };
        }),
      removeSlide: (id) =>
        set((state) => ({
          slides: state.slides.filter((slide) => slide.id !== id),
        })),
      updateContentItem(slideId, contentId, newContent) {
        set((state) => {
          const updateContentRecursively = (item: ContentItem): ContentItem => {
            if (item.id === contentId) {
              return { ...item, content: newContent };
            }
            if (
              Array.isArray(item.content) &&
              item.content.every((i) => typeof i !== "string")
            ) {
              return {
                ...item,
                content: item.content.map((subItem) => {
                  if (typeof subItem !== "string") {
                    return updateContentRecursively(subItem as ContentItem);
                  }
                  return subItem;
                }) as ContentItem[],
              };
            }
            return item;
          };
          return {
            slides: state.slides.map((slide) =>
              slide.id === slideId
                ? { ...slide, content: updateContentRecursively(slide.content) }
                : slide
            ),
          };
        });
      },
      setCurrentSlide(index) {
        set({ currentSlide: index });
      },
      addComponentInSlide: (
        slideId: string,
        item: ContentItem,
        parentId: string,
        index: number
      ) => {
        set((state) => {
          const updatedSlides = state.slides.map((slide) => {
            if (slide.id === slideId) {
              const updateContentRecursively = (
                content: ContentItem
              ): ContentItem => {
                if (content.id === parentId && Array.isArray(content.content)) {
                  const updatedContent = [...content.content];
                  updatedContent.splice(index, 0, item);

                  return {
                    ...content,
                    content: updatedContent as unknown as string[],
                  };
                }
                return content;
              };
              return {
                ...slide,
                content: updateContentRecursively(slide.content),
              };
            }
            return slide;
          });
          return { slides: updatedSlides };
        });
      },
      reorderSlides: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newSlides = [...state.slides];
          const [removed] = newSlides.splice(fromIndex, 1);
          newSlides.splice(toIndex, 0, removed);
          return {
            slides: newSlides.map((slide, index) => ({
              ...slide,
              slideOrder: index,
            })),
          };
        });
      },
    }),
    {
      name: "slides-storage",
      storage: zustandLocalForageStorage,
    }
  )
);

// export const useSlideStore = create(
//   persist<SlideState>(
//     (set, get) => ({
//       project: null,
//       slides: [],
//       setSlides: (slides: Slide[]) => set({ slides }),
//       setProject: (project) => set({ project }),
//       currentTheme: defaultTheme,
//       currentSlide: 0,
//       setCurrentTheme: (theme: Theme) => set({ currentTheme: theme }),
//       getOrderedSlides: () => {
//         const state = get();
//         return [...state.slides].sort((a, b) => a.slideOrder - b.slideOrder);
//       },
//       addSlideAtIndex: (slide: Slide, index: number) =>
//         set((state) => {
//           const newSlides = [...state.slides];
//           newSlides.splice(index, 0, { ...slide, id: uuidv4() });
//           newSlides.forEach((s, i) => {
//             s.slideOrder = i;
//           });
//           return { slides: newSlides, currentSlide: index };
//         }),
//       removeSlide: (id) =>
//         set((state) => ({
//           slides: state.slides.filter((slide) => slide.id !== id),
//         })),
//       updateContentItem(slideId, contentId, newContent) {
//         set((state) => {
//           const updateContentRecursively = (item: ContentItem): ContentItem => {
//             if (item.id === contentId) {
//               return { ...item, content: newContent };
//             }
//             if (
//               Array.isArray(item.content) &&
//               item.content.every((i) => typeof i !== "string")
//             ) {
//               return {
//                 ...item,
//                 content: item.content.map((subItem) => {
//                   if (typeof subItem !== "string") {
//                     return updateContentRecursively(subItem as ContentItem);
//                   }
//                   return subItem;
//                 }) as ContentItem[],
//               };
//             }
//             return item;
//           };
//           return {
//             slides: state.slides.map((slide) =>
//               slide.id === slideId
//                 ? { ...slide, content: updateContentRecursively(slide.content) }
//                 : slide
//             ),
//           };
//         });
//       },
//       setCurrentSlide(index) {
//         set({ currentSlide: index });
//       },
//       addComponentInSlide: (
//         slideId: string,
//         item: ContentItem,
//         parentId: string,
//         index: number
//       ) => {
//         set((state) => {
//           const updatedSlides = state.slides.map((slide) => {
//             if (slide.id === slideId) {
//               const updateContentRecursively = (
//                 content: ContentItem
//               ): ContentItem => {
//                 if (content.id === parentId && Array.isArray(content.content)) {
//                   const updatedContent = [...content.content];
//                   updatedContent.splice(index, 0, item);

//                   return {
//                     ...content,
//                     content: updatedContent as unknown as string[],
//                   };
//                 }
//                 return content;
//               };
//               return {
//                 ...slide,
//                 content: updateContentRecursively(slide.content),
//               };
//             }
//             return slide;
//           });
//           return { slides: updatedSlides };
//         });
//       },
//       reorderSlides: (fromIndex: number, toIndex: number) => {
//         set((state) => {
//           const newSlides = [...state.slides];
//           const [removed] = newSlides.splice(fromIndex, 1);
//           newSlides.splice(toIndex, 0, removed);
//           return {
//             slides: newSlides.map((slide, index) => ({
//               ...slide,
//               slideOrder: index,
//             })),
//           };
//         });
//       },
//     }),
//     {
//       name: "slides-storage",
//     }
//   )
// );
