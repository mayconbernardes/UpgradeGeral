export interface Source {
  name: string;
  url: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  curiosity: string;
  questions: Question[];
  timeline?: TimelineEvent[];
  sources?: Source[];
}

export interface TopicGroup {
  title: string;
  topics: Topic[];
}