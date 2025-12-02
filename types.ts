import React from 'react';

export interface AnalysisResult {
  technicalCorrectness: {
    issue: string;
    explanation: string;
    slideNumber?: string;
  }[];
  areasForImprovement: {
    suggestion: string;
    details: string;
  }[];
  strengths: {
    point: string;
    details: string;
  }[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ReviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: { title: string; description: string; badge?: string }[];
  colorTheme: 'red' | 'yellow' | 'green';
}