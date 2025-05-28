import axios from "axios";
import {
  CONFLUENCE_AUTH,
  CONFLUENCE_BASE_URL,
  CONFLUENCE_PAGE_ID,
} from "../constant/jira.constant";

export async function getConfluencePageContent(): Promise<string> {
  const response = await axios.get(
    `${CONFLUENCE_BASE_URL}/rest/api/content/${CONFLUENCE_PAGE_ID}`,
    {
      auth: CONFLUENCE_AUTH,
      params: { expand: "body.storage" },
    }
  );
  return response.data.body.storage.value;
}

export async function updateConfluencePage(content: string) {
  const page = await axios.get(
    `${CONFLUENCE_BASE_URL}/rest/api/content/${CONFLUENCE_PAGE_ID}`,
    {
      auth: CONFLUENCE_AUTH,
      params: { expand: "body.storage,version" },
    }
  );

  const version = page.data.version.number + 1;

  await axios.put(
    `${CONFLUENCE_BASE_URL}/rest/api/content/${CONFLUENCE_PAGE_ID}`,
    {
      id: CONFLUENCE_PAGE_ID,
      type: "page",
      title: page.data.title,
      version: { number: version },
      body: {
        storage: {
          value: `${content}`,
          representation: "storage",
        },
      },
    },
    { auth: CONFLUENCE_AUTH }
  );
}
