import {
  TEAM_BOARD_ID,
  TEAM_JIRA_PROJECT,
  TEAM_NAME,
} from "./constant/jira.constant";
import { Team } from "./type/jira.type";
import { updateConfluencePage } from "./api/confluence";
import { getConfluencePageContent } from "./api/confluence";
import { getOngoingEpics } from "./api/jira";
import {
  getAllSprintReports,
  getLatestSprints,
} from "./helper/sprintReport.helper";
import {
  getConfluenceHtmlPageContent,
  getConfluenceOngoingEpicsTableContent,
  getConfluenceSprintReportTable,
  getExistingSprintReportsSprint,
} from "./helper/confluenceHtml.helper";

async function main() {
  if (!TEAM_NAME) {
    throw new Error("TEAM_NAME environment variable is not set.");
  }
  if (!TEAM_BOARD_ID) {
    throw new Error("TEAM_BOARD_ID environment variable is not set.");
  }

  if (!TEAM_JIRA_PROJECT) {
    throw new Error("TEAM_JIRA_PROJECT environment variable is not set.");
  }

  const team: Team = {
    name: TEAM_NAME,
    boardId: parseInt(TEAM_BOARD_ID, 10),
    project: TEAM_JIRA_PROJECT,
  };
  const latestSprints = await getLatestSprints(team);
  const page = await getConfluencePageContent();
  const existingSprints = getExistingSprintReportsSprint(page);
  const newSprints = latestSprints.filter(
    (sprint) =>
      !existingSprints.some(
        (existingSprintId) => existingSprintId === sprint.name
      )
  );
  const sprintReports = await getAllSprintReports(team, newSprints);
  const confluenceSprintReportTableContent =
    await getConfluenceSprintReportTable(sprintReports, page);

  const ongoingEpics = await getOngoingEpics(team);
  const confluenceOngoingEpicsTableContent =
    getConfluenceOngoingEpicsTableContent(ongoingEpics, page);
  const confluencePageContent = getConfluenceHtmlPageContent(
    team,
    confluenceSprintReportTableContent,
    confluenceOngoingEpicsTableContent
  );

  await updateConfluencePage(confluencePageContent);
}

main().catch(console.error);
