import {
  getAllClosedSprints,
  getJiraSprintIssues,
  getJiraSprintStats,
} from "../api/jira";
import {
  PAST_SPRINT_FETCH_COUNT,
  STORY_POINTS_FIELD,
} from "../constant/jira.constant";
import { SprintReport, Team } from "../type/jira.type";
import { askQuestion } from "../util";

export const getLatestSprints = async (team: Team) => {
  const closedSprints = await getAllClosedSprints(team.boardId);
  const sorted = closedSprints.sort(
    (a: any, b: any) =>
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
  const latestSprints = sorted.slice(0, PAST_SPRINT_FETCH_COUNT);
  latestSprints.forEach((sprint: any) => {
    console.log(`Sprint: ${sprint.name} (ID: ${sprint.id})`);
  });

  return latestSprints;
};

export const getAllSprintReports = async (
  team: Team,
  sprints: { id: string; name: string }[]
): Promise<SprintReport[]> => {
  const report: SprintReport[] = [];

  for (const sprint of sprints) {
    const sprintStats = await getJiraSprintStats(team.boardId, sprint.id);
    const {
      contents: {
        completedIssuesInitialEstimateSum: { value: commitedPoints },
        completedIssuesEstimateSum: { value: donePoints },
      },
      sprint: { goal: sprintGoal },
    } = sprintStats;

    const issues = await getJiraSprintIssues(team.boardId, sprint.id);
    let total = 0;
    let done = 0;
    let doneTickets = 0;
    const response = await askQuestion(
      `Was the sprint goal for ${sprint.name} completed? (y/n): `
    );
    const isSprintGoalCompleted = response.toLowerCase() === "y";
    const byAssignee: SprintReport["byAssignee"] = {};

    for (const issue of issues) {
      const points = issue.fields[STORY_POINTS_FIELD] || 0;

      total += points;

      const isDone = issue.fields.status.name.toLowerCase() === "done";
      if (isDone) {
        done += points;
        doneTickets += 1;

        const assignee = issue.fields.assignee?.displayName || "Unassigned";
        if (!byAssignee[assignee]) {
          let workingDays = 10;
          const response = await askQuestion(
            `How many working days did ${assignee} work on the sprint ${sprint.name}? (default is 10): `
          );
          let daysInput = response || "10";
          workingDays = parseInt(daysInput, 10);
          byAssignee[assignee] = { points: 0, tickets: 0, workingDays };
        }
        byAssignee[assignee].points += points;
        byAssignee[assignee].tickets += 1;
      }
    }

    report.push({
      team: team.name,
      sprint: sprint.name,
      isSprintGoalCompleted,
      totalPoints: total,
      sprintGoal,
      commitedPoints,
      donePoints,
      doneTickets,
      byAssignee,
    });
  }

  return report;
};
