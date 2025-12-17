export interface Character {
  id: string;
  name: string;
  voiceName: string; // Internal Gemini voice name (e.g., 'Puck', 'Kore')
  color: string;
  accent: string;
  speed: number; // 0.5 (Slow) to 1.5 (Fast)
}

export interface ScriptLine {
  id: string;
  characterId: string;
  text: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  duration: string;
  createdAt: string;
  status: 'draft' | 'published';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  LIVE_STUDIO = 'LIVE_STUDIO',
  SETTINGS = 'SETTINGS'
}

export const AVAILABLE_VOICES = [
  { name: 'Kore', label: 'Kore (Femenina, Calma)', gender: 'Female' },
  { name: 'Puck', label: 'Puck (Masculino, Energético)', gender: 'Male' },
  { name: 'Charon', label: 'Charon (Masculino, Profundo)', gender: 'Male' },
  { name: 'Fenrir', label: 'Fenrir (Masculino, Intenso)', gender: 'Male' },
  { name: 'Zephyr', label: 'Zephyr (Femenina, Suave)', gender: 'Female' },
];

export const AVAILABLE_ACCENTS = [
  { id: 'neutral', label: 'Español Neutro' },
  { id: 'mexican', label: 'Mexicano' },
  { id: 'argentine', label: 'Argentino' },
  { id: 'spanish', label: 'Español (España)' },
  { id: 'colombian', label: 'Colombiano' },
  { id: 'chilean', label: 'Chileno' },
];