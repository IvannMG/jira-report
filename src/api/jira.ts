import axios from "axios";
import {
  EPIC_COMPLETION_FIELD,
  EPIC_DUE_DATE_FIELD,
  JIRA_AUTH,
  JIRA_BASE_URL,
} from "../constant/jira.constant";
import { EpicSummary, Team } from "../type/jira.type";

const jiraApi = axios.create({
  baseURL: JIRA_BASE_URL,
  auth: JIRA_AUTH,
});

export const getJiraSprintIssues = async (
  boardId: number,
  sprintId: string
): Promise<any[]> => {
  const response = await jiraApi.get(
    `/rest/agile/1.0/board/${boardId}/sprint/${sprintId}/issue?maxResults=100`
  );
  return response.data.issues;
};
export const getJiraSprintStats = async (
  boardId: number,
  sprintId: string
): Promise<any> => {
  const response = await jiraApi.get(
    `/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`
  );
  return response.data;
};

export const getAllClosedSprints = async (boardId: number): Promise<any[]> => {
  const allSprints: any[] = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const res = await jiraApi.get(
      `/rest/agile/1.0/board/${boardId}/sprint?state=closed&startAt=${startAt}&maxResults=${maxResults}`
    );

    const sprints = res.data.values;
    allSprints.push(...sprints);

    if (res.data.isLast || sprints.length < maxResults) {
      break;
    }

    startAt += maxResults;
  }

  return allSprints.filter((s) => s.endDate);
};

export const getOngoingEpics = async (team: Team): Promise<EpicSummary[]> => {
  const jql = `project = "${team.project}" AND issuetype = Epic AND status = "In Progress"`;
  const res = await jiraApi.get(`/rest/api/2/search`, {
    params: {
      jql,
      maxResults: 100,
      fields: ["summary", EPIC_DUE_DATE_FIELD, EPIC_COMPLETION_FIELD], // your due date and % complete fields
    },
    auth: JIRA_AUTH,
  });

  const epics = res.data.issues;

  const ongoingEpics: EpicSummary[] = epics.map((issue: any) => ({
    key: issue.key,
    dueDate: issue.fields[EPIC_DUE_DATE_FIELD] || "No due date ❌",
    completion: issue.fields[EPIC_COMPLETION_FIELD] || 0,
    url: `${JIRA_BASE_URL}/browse/${issue.key}`,
    summary: issue.fields.summary,
  }));

  return ongoingEpics;
};
