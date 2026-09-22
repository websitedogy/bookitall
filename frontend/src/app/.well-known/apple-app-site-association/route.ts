const TEAM_ID = process.env.APPLE_TEAM_ID ?? "TEAMID";

export async function GET() {
  return Response.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${TEAM_ID}.com.bookitall.app`,
            paths: ["*"],
          },
        ],
      },
      webcredentials: {
        apps: [`${TEAM_ID}.com.bookitall.app`],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
