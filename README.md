## Instalation

```
yarn install

```

### fill dotenv file

```
JIRA_BASE_URL=https://healthhero.atlassian.net
JIRA_EMAIL=ivann.morice@healthhero.com
JIRA_API_TOKEN=your_api_token_create_here >> https://id.atlassian.com/manage-profile/security/api-tokens
CONFLUENCE_BASE_URL=https://healthhero.atlassian.net/wiki
CONFLUENCE_EMAIL=ivann.morice@healthhero.com
CONFLUENCE_API_TOKEN=your_api_token_create_here >> https://id.atlassian.com/manage-profile/security/api-tokens
CONFLUENCE_PAGE_ID=4933877815 # The page id where you want to publish the report should be empty page at first
TEAM_NAME=MarGrowth
TEAM_BOARD_ID=116
TEAM_JIRA_PROJECT=FR - Supply
```

## Try to launch first report

```
yarn start
```

You will be asked how many working days the dev from your team worked in the last 3 sprints and if the sprint goal was completed, then it will add a table where you can see the results

If you want more than 3 sprints change the constant `export const PAST_SPRINT_FETCH_COUNT` in `src/constant/jira.constant.ts`

The results are based on jira API

Every time a sprint is closed you can launched the command again and it will add a new line

⚠️ to update an existing page the script will kind of parse the html which was provided last update (kind of beacause it's not exactly the same, but it's not the final html rendered in the page either 🤷‍♂️)

This parsing is based on shady regex so the results might not be consistant in time if confluence make an update for instance

The second array will show every ongoing epics

TO AUTOMATIZE: when an epic is done move it in another table with the existing column

TO AUTOMATIZE: update the epic array instead of recreating it
