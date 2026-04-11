export interface PromptMessage {
  type: 'ANALYZE_PROMPT';
  payload: {
    text: string;
    userId: string;
    timestamp?: string; 
  };
}