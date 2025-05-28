import axios from "axios";
import {
  CONFLUENCE_AUTH,
  CONFLUENCE_BASE_URL,
  CONFLUENCE_PAGE_ID,
} from "../constant/jira.constant";

const confluenceApi = axios.create({
  baseURL: CONFLUENCE_BASE_URL,
  auth: CONFLUENCE_AUTH,
});

export async function getConfluencePageContent(): Promise<string> {
  const response = await confluenceApi.get(
    `/rest/api/content/${CONFLUENCE_PAGE_ID}`,
    {
      params: { expand: "body.storage" },
    }
  );
  return response.data.body.storage.value;
}

export async function updateConfluencePage(content: string) {
  const page = await confluenceApi.get(
    `/rest/api/content/${CONFLUENCE_PAGE_ID}`,
    {
      params: { expand: "version" },
    }
  );

  const version = page.data.version.number + 1;

  await confluenceApi.put(`/rest/api/content/${CONFLUENCE_PAGE_ID}`, {
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
  });
}
