'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/lib/store/project-store';
import type { Project } from '@/core/types';

interface ProjectProviderProps {
  project: Project;
  children: React.ReactNode;
}

export function ProjectProvider({ project, children }: ProjectProviderProps) {
  const setProject = useProjectStore((s) => s.setProject);

  useEffect(() => {
    setProject(project);
  }, [project, setProject]);

  return <>{children}</>;
}
