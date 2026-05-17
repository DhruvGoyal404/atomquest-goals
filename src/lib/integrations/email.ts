import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendGoalApprovalEmail(to: string, goalTitle: string, managerName: string) {
  if (!resend) {
    return {
      skipped: true,
    };
  }

  return resend.emails.send({
    from: "AtomQuest <noreply@atomquest.com>",
    to,
    subject: "Your goal has been approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Goal Approved</h2>
        <p>Great news. Your goal <strong>${escapeHtml(goalTitle)}</strong> has been approved by ${escapeHtml(managerName)}.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/employee/goals"
           style="background: #2563eb; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View goal
        </a>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
