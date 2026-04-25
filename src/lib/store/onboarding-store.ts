import { create } from 'zustand';
import type { SkillLevel, ExecutorTool, Locale, CommunicationStyle } from '@/core/types';

export interface OnboardingAnswers {
  level: SkillLevel | null;
  languages: string[];
  tools: ExecutorTool[];
  communicationStyle: CommunicationStyle | null;
  preferredLocale: Locale;
}

interface OnboardingStore {
  step: number;
  answers: OnboardingAnswers;
  setStep: (step: number) => void;
  setLevel: (level: SkillLevel) => void;
  setLanguages: (languages: string[]) => void;
  setTools: (tools: ExecutorTool[]) => void;
  setCommunicationStyle: (style: CommunicationStyle) => void;
  setLocale: (locale: Locale) => void;
  reset: () => void;
}

const defaultAnswers: OnboardingAnswers = {
  level: null,
  languages: [],
  tools: [],
  communicationStyle: null,
  preferredLocale: 'en',
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  answers: { ...defaultAnswers },
  setStep: (step) => set({ step }),
  setLevel: (level) => set((s) => ({ answers: { ...s.answers, level } })),
  setLanguages: (languages) => set((s) => ({ answers: { ...s.answers, languages } })),
  setTools: (tools) => set((s) => ({ answers: { ...s.answers, tools } })),
  setCommunicationStyle: (communicationStyle) =>
    set((s) => ({ answers: { ...s.answers, communicationStyle } })),
  setLocale: (preferredLocale) =>
    set((s) => ({ answers: { ...s.answers, preferredLocale } })),
  reset: () => set({ step: 1, answers: { ...defaultAnswers } }),
}));
