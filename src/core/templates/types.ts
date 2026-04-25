import type { Step, RecommendedLibrary, ProjectKind } from '../types';

export interface StepBlueprint {
  id: string;
  title: { en: string; ar: string };
  type: Step['type'];
  goal: { en: string; ar: string };
  contextFiles?: string[];
  recommendedLibraries: RecommendedLibrary[];
  successCriteria: { en: string[]; ar: string[] };
  restrictions: { en: string[]; ar: string[] };
  dependsOn?: string[];
  includeWhen?: (features: string[]) => boolean;
}

export interface Template {
  id: string;
  kind: ProjectKind;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  defaultStack: string[];
  baseSteps: StepBlueprint[];
  conditionalSteps: StepBlueprint[];
  protectedFiles: string[];
}
