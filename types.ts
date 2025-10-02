export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  curiosity: string;
  questions: Question[];
}

export interface TopicGroup {
  title: string;
  topics: Topic[];
}
