export type Team = {
  name: string;
  boardId: number;
  project: string; // e.g., "FR - supply"
};

export interface SprintReport {
  team: string;
  sprint: string;
  totalPoints: number;
  donePoints: number;
  sprintGoal: string;
  commitedPoints: number;
  doneTickets: number;
  byAssignee: Record<string, { points: number; tickets: number }>;
}

export type EpicSummary = {
  key: string; // e.g., EPIC-123
  dueDate: string; // from custom field
  completion: number; // from custom field (e.g., 0.73 = 73%)
  url: string; // direct Jira link
  summary: string; // Epic summary
};
