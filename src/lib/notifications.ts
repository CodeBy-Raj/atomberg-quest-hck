import { logAudit } from './repository';

/**
 * @fileOverview Notification system for AtomQuest. 
 * In a production environment, this would interface with Resend or SendGrid.
 * For the hackathon demo, it logs notifications to the system Audit Trail
 * and the browser console to demonstrate transactional triggers.
 */

export type NotificationTemplate = 
  | 'GOAL_SUBMITTED' 
  | 'GOAL_APPROVED' 
  | 'GOAL_RETURNED' 
  | 'WINDOW_OPEN' 
  | 'WINDOW_CLOSING_REMINDER';

interface NotificationParams {
  template: NotificationTemplate;
  to: string;
  recipientName: string;
  vars: Record<string, any>;
  actorId: string;
}

export async function sendNotification({ template, to, recipientName, vars, actorId }: NotificationParams) {
  const subjectMap: Record<NotificationTemplate, string> = {
    GOAL_SUBMITTED: `Quest Sheet Submitted: ${vars.employeeName}`,
    GOAL_APPROVED: `Quests Locked & Approved!`,
    GOAL_RETURNED: `Quest Sheet Returned for Rework`,
    WINDOW_OPEN: `Performance Window Open: ${vars.quarter}`,
    WINDOW_CLOSING_REMINDER: `Urgent: ${vars.quarter} Window Closing Soon`
  };

  const subject = subjectMap[template];
  
  // Log to console for demo visibility
  console.log(`[EMAIL SENT] To: ${to} (${recipientName}) | Subject: ${subject}`);
  
  // Log to Audit Trail so it's visible in the Admin UI
  await logAudit({
    entity: 'Notification',
    entityId: template,
    actorId: actorId,
    action: 'SEND_EMAIL',
    before: null,
    after: {
      recipient: to,
      subject,
      content: `Template: ${template} sent with vars: ${JSON.stringify(vars)}`
    }
  });

  return { success: true, messageId: Math.random().toString(36).substring(7) };
}
