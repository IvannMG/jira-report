import {
  NON_ASSIGNEE_COLUMNS,
  ONGOING_EPICS_TABLE_HEADERS,
  SPRINT_ASSIGNEE_TABLE_START,
  SPRINT_ASSIGNEE_TABLE_WIDTH,
} from "../constant/jira.constant";
import { EpicSummary, SprintReport, Team } from "../type/jira.type";

const getSprintReportHtmlRow = async (
  sprintReport: SprintReport,
  assignees: string[]
): Promise<string> => {
  let html = `<tr><td>${sprintReport.sprint}</td>`;

  const sprintGoalEmoji = sprintReport.isSprintGoalCompleted ? "✅" : "❌";

  html += `<td>${sprintReport.sprintGoal} ${sprintGoalEmoji || ""}</td>`;
  html += `<td>${sprintReport.donePoints}</td>`;
  html += `<td>${sprintReport.commitedPoints}</td>`;
  for (const assignee of assignees) {
    const { points, workingDays } = sprintReport.byAssignee[assignee] || {
      points: 0,
      workingDays: 0,
    };
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

export const getExistingSprintReportsSprint = (
  existingPageContent: string
): string[] => {
  const sprintReportTableMatch = existingPageContent.match(
    /<table (.*?)>(.*?)<\/table>/s
  );
  if (!sprintReportTableMatch || !sprintReportTableMatch[2]) {
    console.log("No existing sprint assignee table found");
    return [];
  }

  const sprintReportTableContent = sprintReportTableMatch[2];

  return (
    sprintReportTableContent.match(/<tr><td>(.*?)<\/td>/gs)?.map((cell) => {
      const match = cell.match(/<td>(.*?)<\/td>/);

      return match ? match[1].replace(/<\/?p>/g, "").trim() : "";
    }) || []
  );
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

  if (!existingAssigneeHeaders?.length) {
    console.log(
      "No existing assignee headers or sprints found, initializing new table.",
      `${existingAssigneeHeaders.length} headers, ${reports.length} sprints`
    );
    return await initAssigneeTable(reports);
  }

  const newAssignees = reports.reduce((acc, report) => {
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

  if (reports.length === 0) {
    console.log("No new sprint reports to add.");
    return `<table data-table-width="${SPRINT_ASSIGNEE_TABLE_WIDTH}" data-layout="center">${newPageContent}</table>`;
  }

  console.log(`Found ${reports.length} new sprint reports to add.`, reports);

  // Add new sprint reports
  for (const sprintReport of reports.reverse()) {
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

const initOngoingEpicsTable = (epics: EpicSummary[]): string => {
  let html = ONGOING_EPICS_TABLE_HEADERS;

  for (const epic of epics) {
    html += getEpicHtmlRow(epic.key, epic.dueDate || "-", epic.completion);
  }

  html += "</tbody></table>";
  return html;
};

const getEpicHtmlRow = (
  key: string,
  dueDate: string,
  completion: number,
  rdp?: string,
  qrqc?: string,
  actions?: string
): string => {
  return `<tr><td><ac:structured-macro ac:name="jira"><ac:parameter ac:name="key">${key}</ac:parameter></ac:structured-macro></td>
                <td>${dueDate}</td>
                <td>${Math.round(completion)}%</td>
                <td>${rdp || ""}</td>
                <td>${qrqc || ""}</td>
                <td>${actions || ""}</td>
            </tr>`;
};

const updateExistingOngoingEpicsHtmlRow = (
  existingOngoingEpicsTableContent: string,
  epic: EpicSummary
) => {
  const existingRowMatch = existingOngoingEpicsTableContent.match(
    new RegExp(
      `<tr><td>.*?<ac:parameter ac:name="key">${epic.key}</ac:parameter>(.*?)</tr>`,
      "s"
    )
  );

  if (!existingRowMatch || !existingRowMatch[1]) {
    throw new Error(
      `Epic ${epic.key} not found in existing ongoing epics table.`
    );
  }

  const existingRowContent = existingRowMatch[1];

  const updatedRowContent = existingRowContent
    .match(/<td>(.*?)<\/td>/gs)
    ?.map((cell, index) => {
      switch (index) {
        case 0:
          return epic.dueDate || "-";
        case 1:
          return `${Math.round(epic.completion)}%`;
        default:
          return cell.replace(/<\/?td>/g, "").trim();
      }
    });

  return getEpicHtmlRow(
    epic.key,
    updatedRowContent?.[0] || "-",
    parseFloat(updatedRowContent?.[1] || "0"),
    updatedRowContent?.[2],
    updatedRowContent?.[3],
    updatedRowContent?.[4]
  );
};

export const getExistingOngoingEpics = (page: string): string[] => {
  const existingTableMatch = page.match(/<table(.*?)>(.*?)<\/table>/gs);

  if (!existingTableMatch || !existingTableMatch[1]) {
    console.log("No existing ongoing epics table found.");
    return [];
  }

  const existingOngoingEpicsTableContent = existingTableMatch[1];
  return (
    existingOngoingEpicsTableContent
      .match(/<tr><td>(.*?)<\/td>/gs)
      ?.map((cell) => {
        const match = cell.match(
          /<ac:parameter ac:name="key">(.*?)<\/ac:parameter>/
        );
        return match ? match[1].replace(/<\/?p>/g, "").trim() : "";
      }) || []
  );
};

export const getConfluenceOngoingEpicsTableContent = (
  epics: EpicSummary[],
  existingOngoingEpics: string[],
  page: string
): string => {
  const existingTableMatch = page.match(/<table(.*?)>(.*?)<\/table>/gs);

  if (
    existingOngoingEpics.length === 0 ||
    !existingTableMatch ||
    !existingTableMatch[1]
  ) {
    console.log(
      "No existing ongoing epics table found, initializing new table."
    );
    return initOngoingEpicsTable(epics);
  }
  const existingOngoingEpicsTableContent = existingTableMatch[1];

  const newOngoingEpics = epics.filter(
    (epic) => !existingOngoingEpics.includes(epic.key)
  );
  const toUpdateEpics = epics.filter((epic) =>
    existingOngoingEpics.includes(epic.key)
  );

  console.log(
    newOngoingEpics.length,
    "new ongoing epics found:",
    newOngoingEpics
  );

  console.log(
    toUpdateEpics.length,
    "epics to update in existing ongoing epics table:",
    toUpdateEpics
  );
  if (newOngoingEpics.length === 0 && toUpdateEpics.length === 0) {
    console.log("No new ongoing epics or updates needed.");
    return existingOngoingEpicsTableContent;
  }

  const newContent = `
${ONGOING_EPICS_TABLE_HEADERS}
        ${newOngoingEpics
          .map((epic) =>
            getEpicHtmlRow(epic.key, epic.dueDate, epic.completion)
          )
          .join("")}
        ${toUpdateEpics
          .map((epic) =>
            updateExistingOngoingEpicsHtmlRow(
              existingOngoingEpicsTableContent,
              epic
            )
          )
          .join("")}`;

  return `${newContent}</tbody></table>`;
};
