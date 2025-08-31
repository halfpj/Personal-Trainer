
export enum AppStep {
  WELCOME = 'welcome',
  GOALS = 'goals',
  PHOTOS = 'photos',
  ANALYZING = 'analyzing',
  DASHBOARD = 'dashboard',
}

export enum Goal {
  FAT_LOSS = 'Perda de Gordura',
  MUSCLE_GAIN = 'Ganho Muscular',
  IMPROVE_ENDURANCE = 'Melhorar Resistência',
  INCREASE_FLEXIBILITY = 'Aumentar Flexibilidade',
  GENERAL_FITNESS = 'Fitness Geral'
}

export interface UserGoals {
  primaryGoal: Goal | null;
  secondaryGoals: Goal[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // in seconds
  description?: string;
  image?: string;
}

export interface DailyWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  weeklyPlan: DailyWorkout[];
  planSummary: string;
}

export interface BodyAnalysis {
  analysis: string;
  focusAreas: string[];
}