export type EvalJobPayload = {
  jobTitle: string;
  cvPath: string;
  reportPath: string;
};

export type EvalResult = {
  cv_match_rate: number; 
  cv_feedback: string;
  project_score: number; 
  project_feedback: string;
  overall_summary: string;
};
