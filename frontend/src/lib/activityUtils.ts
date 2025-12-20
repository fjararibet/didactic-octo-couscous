import { ActivityTemplate } from "@/types/activity";
import { createActivity } from "@/services/activityService";

export const assignTemplateToRandomDayInMonth = async (
  template: ActivityTemplate,
  year: number,
  month: number, // 1-12
  assigneeId: number,
  targetWeekday: number // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const possibleDates: Date[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    if (currentDate.getDay() === targetWeekday) {
      possibleDates.push(currentDate);
    }
  }

  if (possibleDates.length === 0) {
    console.warn(`No occurrences of weekday ${targetWeekday} found in ${month}/${year}.`);
    return; // Or throw an error, depending on desired behavior
  }

  const randomDate = possibleDates[Math.floor(Math.random() * possibleDates.length)];

  await createActivity({
    name: template.name,
    template_id: template.id,
    date: randomDate.toISOString(),
    assignee_id: assigneeId,
  });
};

export const assignTemplateToRandomWeekdayInMonth = async (
  template: ActivityTemplate,
  year: number,
  month: number, // 1-12
  assigneeId: number
) => {
  // 1. Choose a random weekday (1 for Monday, 5 for Friday)
  const randomWeekday = Math.floor(Math.random() * 5) + 1;

  // 2. Find all occurrences of that weekday in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const datesForWeekday: Date[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    if (currentDate.getDay() === randomWeekday) {
      datesForWeekday.push(currentDate);
    }
  }

  // 3. Create an activity for each of those dates
  const creationPromises = datesForWeekday.map(date =>
    createActivity({
      name: template.name,
      template_id: template.id,
      date: date.toISOString(),
      assignee_id: assigneeId,
    })
  );

  await Promise.all(creationPromises);
};
