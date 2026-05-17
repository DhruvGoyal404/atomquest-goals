import { Client } from "@microsoft/microsoft-graph-client";
import { getGraphAccessToken } from "@/lib/integrations/graph";

// ---------------------------------------------------------------------------
// Microsoft Teams notification via Graph API
// Uses the Activity Feed API (not the Mail API) to deliver notifications
// directly in the Teams activity feed.
//
// Falls back to sending an Outlook mail message if activity notifications
// are not configured (requires a Teams app manifest with activity types).
// ---------------------------------------------------------------------------

export async function sendTeamsNotification(userId: string, message: string, actionUrl: string) {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    return {
      skipped: true,
    };
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Try the Teams Activity Feed first (preferred — shows in Teams bell icon)
  try {
    await client.api(`/users/${userId}/teamwork/sendActivityNotification`).post({
      topic: {
        source: "text",
        value: "AtomQuest Goal Update",
        webUrl: actionUrl,
      },
      activityType: "goalUpdate",
      previewText: {
        content: message,
      },
    });

    return { skipped: false, channel: "teams-activity" };
  } catch {
    // Activity Feed requires a registered Teams app with activity types.
    // Fall back to an Adaptive Card sent as an Outlook message.
  }

  // Fallback: Send Adaptive Card via Outlook mail
  try {
    const adaptiveCard = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "Goal Update",
                weight: "Bolder",
                size: "Large",
              },
              {
                type: "TextBlock",
                text: message,
                wrap: true,
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "View Goal",
                url: actionUrl,
              },
            ],
          },
        },
      ],
    };

    await client.api(`/users/${userId}/messages`).post(adaptiveCard);
    return { skipped: false, channel: "outlook-mail" };
  } catch (error) {
    console.warn("Teams/Mail notification failed:", error);
    return { skipped: true, error: String(error) };
  }
}
