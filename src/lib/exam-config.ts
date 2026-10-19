export const EXAM_DURATION_MS = 120 * 60 * 1000;

export const TEXT_QUESTIONS = Array.from({ length: 18 }, (_, index) => index + 1);
export const DESIGN_QUESTIONS = [19, 20, 21, 22, 23];
export const VIDEO_QUESTIONS = [24, 25];
export const QUESTION_COUNT = 25;

export const DESIGN_EXTENSIONS = ["pdf", "png"];
export const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
export const DESIGN_MAX_BYTES = 20 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

export function getQuestionType(questionNumber: number): "text" | "design" | "video" | null {
  if (TEXT_QUESTIONS.includes(questionNumber)) return "text";
  if (DESIGN_QUESTIONS.includes(questionNumber)) return "design";
  if (VIDEO_QUESTIONS.includes(questionNumber)) return "video";
  return null;
}
