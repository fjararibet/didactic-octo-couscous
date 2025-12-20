import { ActivityTemplate } from "@/types/activity";
import { createActivity } from "@/services/activityService";

export const assignTemplateToRandomDayInMonth = async (
  template: ActivityTemplate,
  year: number,
  month: number, // 1-12
  assigneeId: number
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let date: Date;
  let randomDay: number;
  let dayOfWeek: number;

  do {
    randomDay = Math.floor(Math.random() * daysInMonth) + 1;
    date = new Date(year, month - 1, randomDay);
    dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday
  } while (dayOfWeek === 0 || dayOfWeek === 6);

  await createActivity({
    name: template.name,
    template_id: template.id,
    date: date.toISOString(),
    assignee_id: assigneeId,
  });
};
