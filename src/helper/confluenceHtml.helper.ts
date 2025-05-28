import {
  NON_ASSIGNEE_COLUMNS,
  ONGOING_EPICS_TABLE_HEADERS,
  SPRINT_ASSIGNEE_TABLE_START,
  SPRINT_ASSIGNEE_TABLE_WIDTH,
} from "../constant/jira.constant";
import { EpicSummary, SprintReport, Team } from "../type/jira.type";
import { askQuestion } from "../util";

const getSprintReportHtmlRow = async (
  sprintReport: SprintReport,
  assignees: string[]
): Promise<string> => {
  let html = `<tr><td>${sprintReport.sprint}</td>`;
  let sprintGoalEmoji;
  const response = await askQuestion(
    `Was the sprint goal for ${sprintReport.sprint} completed? (y/n): `
  );
  sprintGoalEmoji = response.toLowerCase() === "y" ? "✅" : "❌";

  html += `<td>${sprintReport.sprintGoal} ${sprintGoalEmoji || ""}</td>`;
  html += `<td>${sprintReport.donePoints}</td>`;
  html += `<td>${sprintReport.commitedPoints}</td>`;
  for (const assignee of assignees) {
    let workingDays = 10;
    const response = await askQuestion(
      `How many working days did ${assignee} work on the sprint ${sprintReport.sprint}? (default is 10): `
    );
    let daysInput = response || "10";
    workingDays = parseInt(daysInput, 10);

    const points = sprintReport.byAssignee[assignee]?.points;
    html += `<td>${points || 0} points
      ${
        workingDays > 0
          ? `(${((points || 0) / workingDays).toFixed(2)} points/day)`
          : ""
      }
      </td>`;
  }
  html += "</tr>";
  return html;
};

const initAssigneeTable = async (reports: SprintReport[]): Promise<string> => {
  let html = SPRINT_ASSIGNEE_TABLE_START;
  const assignees = reports.reduce((acc, report) => {
    const sprintAssignees = Object.keys(report.byAssignee);
    for (const assignee of sprintAssignees) {
      if (!acc.includes(assignee)) {
        acc.push(assignee);
      }
    }
    return acc;
  }, [] as string[]);

  // header columns for assignees
  for (const assignee of assignees) {
    html += `<th>${assignee}</th>`;
  }

  html += "</tr></thead><tbody>";

  for (const sprintReport of reports) {
    html += await getSprintReportHtmlRow(sprintReport, assignees);
  }

  html += "</tbody></table>";
  return html;
};

export const getConfluenceSprintReportTable = async (
  reports: SprintReport[],
  existingPageContent: string
): Promise<string> => {
  const sprintReportTableMatch = existingPageContent.match(
    /<table (.*?)>(.*?)<\/table>/s
  );

  if (!sprintReportTableMatch || !sprintReportTableMatch[2]) {
    console.log(
      "No existing sprint assignee table found, initializing new table."
    );
    return await initAssigneeTable(reports);
  }
  const sprintReportTableContent = sprintReportTableMatch[2];

  const existingAssigneeHeaders =
    sprintReportTableContent.match(/<th>(.*?)<\/th>/gs)?.map((header) =>
      header
        .replace(/<\/?th>/g, "")
        .replace(/<\/?p>/g, "")
        .trim()
    ) || [];

  const existingAssignees = existingAssigneeHeaders.filter(
    (header) => !NON_ASSIGNEE_COLUMNS.includes(header)
  );

  const existingSprints =
    sprintReportTableContent.match(/<tr><td>(.*?)<\/td>/gs)?.map((cell) => {
      const match = cell.match(/<td>(.*?)<\/td>/);

      return match ? match[1].replace(/<\/?p>/g, "").trim() : "";
    }) || [];

  if (!existingAssigneeHeaders?.length || !existingSprints?.length) {
    console.log(
      "No existing assignee headers or sprints found, initializing new table.",
      `${existingAssigneeHeaders.length} headers, ${existingSprints.length} sprints`
    );
    return await initAssigneeTable(reports);
  }

  const newSprintReports = reports.filter(
    (report) => !existingSprints.includes(report.sprint)
  );

  const newAssignees = newSprintReports.reduce((acc, report) => {
    const sprintAssignees = Object.keys(report.byAssignee);
    for (const assignee of sprintAssignees) {
      if (!acc.includes(assignee) && !existingAssignees.includes(assignee)) {
        acc.push(assignee);
      }
    }
    return acc;
  }, [] as string[]);

  let newPageContent = sprintReportTableContent;
  if (newAssignees.length > 0) {
    // Add new assignees to the existing headers
    for (const assignee of newAssignees) {
      existingAssigneeHeaders.push(assignee);
    }
    newPageContent = newPageContent.replace(
      /<\/th><\/tr>/,
      `<th>${newAssignees.join("</th><th>")}</th></tr>`
    );

    // Add new assignees to the existing rows
    newPageContent = newPageContent.replace(
      /<\/td><\/tr>/g,
      `</td>${newAssignees.map(() => "<td>-</td>").join("")}</tr>`
    );
  }

  const allAssignees = [...existingAssignees, ...newAssignees];

  if (newSprintReports.length === 0) {
    console.log("No new sprint reports to add.");
    return `<table data-table-width="${SPRINT_ASSIGNEE_TABLE_WIDTH}" data-layout="center">${newPageContent}</table>`;
  }

  console.log(
    `Found ${newSprintReports.length} new sprint reports to add.`,
    newSprintReports,
    existingSprints
  );

  // Add new sprint reports
  for (const sprintReport of newSprintReports.reverse()) {
    const row = await getSprintReportHtmlRow(sprintReport, allAssignees);

    newPageContent = newPageContent.replace("</tr><tr>", `</tr>${row}<tr>`);
  }

  return `<table data-table-width="${SPRINT_ASSIGNEE_TABLE_WIDTH}" data-layout="center">${newPageContent}</table>`;
};

export const getConfluenceHtmlPageContent = (
  team: Team,
  confluenceSprintReportTableContent: string,
  confluenceOngoingEpicsTableContent: string
): string => {
  return `
          <h1>Weekly Report for ${team.name}</h1>
          <h2>Closed Sprints</h2>
          ${confluenceSprintReportTableContent}
          <h2>Ongoing Epics</h2>
          ${confluenceOngoingEpicsTableContent}
      `;
};

export const getConfluenceOngoingEpicsTableContent = (
  epics: EpicSummary[],
  page: string
): string => {
  let html = ONGOING_EPICS_TABLE_HEADERS;

  for (const epic of epics) {
    html += `<tr>
          <td>
              <ac:structured-macro ac:name="jira">
              <ac:parameter ac:name="key">${epic.key}</ac:parameter>
              </ac:structured-macro>
          </td>
          <td>${epic.dueDate || "-"}</td>
          <td>${Math.round(epic.completion)}%</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>`;
  }

  html += "</tbody></table>";

  return html;
};
