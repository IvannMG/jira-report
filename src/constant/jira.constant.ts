export const JIRA_BASE_URL = process.env.JIRA_BASE_URL!;
export const JIRA_AUTH = {
  username: process.env.JIRA_EMAIL!,
  password: process.env.JIRA_API_TOKEN!,
};

export const CONFLUENCE_AUTH = {
  username: process.env.CONFLUENCE_EMAIL!,
  password: process.env.CONFLUENCE_API_TOKEN!,
};
export const PAST_SPRINT_FETCH_COUNT = 3;

export const STORY_POINTS_FIELD = "customfield_10026";
export const EPIC_COMPLETION_FIELD = "customfield_10435";
export const EPIC_DUE_DATE_FIELD = "duedate";
export const SPRINT_NAME_COLUMN = "Sprint";
export const SPRINT_GOAL_COLUMN = "Sprint Goal";
export const SPRINT_POINTS_DONE_COLUMN = "Points Done";
export const SPRINT_COMMITS_COLUMN = "Commited points";
export const NON_ASSIGNEE_COLUMNS = [
  SPRINT_NAME_COLUMN,
  SPRINT_GOAL_COLUMN,
  SPRINT_POINTS_DONE_COLUMN,
  SPRINT_COMMITS_COLUMN,
];
export const {
  TEAM_NAME,
  TEAM_BOARD_ID,
  TEAM_JIRA_PROJECT,
  CONFLUENCE_PAGE_ID,
  CONFLUENCE_BASE_URL,
} = process.env;
export const SPRINT_ASSIGNEE_TABLE_WIDTH = 1382; // width in pixels
export const SPRINT_ASSIGNEE_TABLE_START = `<table data-table-width="${SPRINT_ASSIGNEE_TABLE_WIDTH}" data-layout="center"><thead><tr>${NON_ASSIGNEE_COLUMNS.map(
  (col) => `<th>${col}</th>`
).join("")}`;
export const ONGOING_EPICS_TABLE_HEADERS =
  "<table><thead><tr><th>Jira link</th><th>Completion</th><th>Due date</th><th>RDP</th><th>QRQC</th><th>Actions</th></tr></thead><tbody>";
