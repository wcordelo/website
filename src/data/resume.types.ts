export type DisciplineKey = 'ai' | 'software' | 'protocol' | 'infra' | 'aerospace';

export interface Identity {
  name: string;
  location: string;
  education: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
}

export interface Discipline {
  key: DisciplineKey;
  label: string;
  count: string;
}

export interface Metric {
  v: string;
  l: string;
}

export interface Hero {
  titles: string[];
  tag: string;
  subtitle: string;
}

export interface JobExperience {
  id: string;
  role: string;
  org: string;
  period: string;
  location: string;
  status?: 'current';
  discipline: DisciplineKey[];
  blurb: string;
  highlights: string[];
  stack: string[];
}

export interface CaseStudy {
  id: string;
  /** Used on /work to align discipline filters with case cards */
  disciplines: DisciplineKey[];
  title: string;
  context: string;
  year: string;
  summary: string;
  role: string;
  metrics: string[][];
  tags: string[];
}

export interface Project {
  title: string;
  summary: string;
  tags: string[];
  kind: string;
}

export interface Writing {
  title: string;
  date: string;
  read: string;
  tag: string;
}

export interface Consulting {
  pitch: string;
  services: { title: string; blurb: string }[];
}

export interface ResumeData {
  identity: Identity;
  disciplines: Discipline[];
  metrics: Metric[];
  hero: Hero;
  experience: JobExperience[];
  caseStudies: CaseStudy[];
  projects: Project[];
  skills: Record<string, string[]>;
  writing: Writing[];
  consulting: Consulting;
}
