import { create } from 'zustand';
import type { Project, Step } from '@/core/types';

interface ProjectStore {
  project: Project | null;
  selectedStepId: string | null;
  setProject: (p: Project) => void;
  selectStep: (id: string | null) => void;
  refresh: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  selectedStepId: null,

  setProject: (p) => set({ project: p }),

  selectStep: (id) => set({ selectedStepId: id }),

  refresh: async () => {
    const { project } = get();
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.meta.id}`);
      const json = (await res.json()) as { data?: Project };
      if (json.data) set({ project: json.data });
    } catch {
      // ignore network errors
    }
  },
}));

export type { ProjectStore };
