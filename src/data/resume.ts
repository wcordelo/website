import type { ResumeData } from './resume.types';
import raw from './resume.json';

export const RESUME_DATA = raw as ResumeData;

export const CURRENT_ROLE = RESUME_DATA.experience.find((role) => role.status === 'current')!;
