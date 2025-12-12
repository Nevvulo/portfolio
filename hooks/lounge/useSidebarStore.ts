import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsedCategories: string[];
  toggleCategory: (category: string) => void;
  isCollapsed: (category: string) => boolean;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapsedCategories: [],
      toggleCategory: (category: string) => {
        const current = get().collapsedCategories;
        if (current.includes(category)) {
          set({ collapsedCategories: current.filter((c) => c !== category) });
        } else {
          set({ collapsedCategories: [...current, category] });
        }
      },
      isCollapsed: (category: string) => {
        return get().collapsedCategories.includes(category);
      },
    }),
    {
      name: "lounge-sidebar-state",
    }
  )
);
