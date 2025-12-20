import type { ActivityTemplate } from "@/types/activity";
import { activityService } from "@/services/activityService";

export const assignTemplateToRandomDayInMonth = async (
  template: ActivityTemplate,
  year: number,
  month: number, // 1-12
  assigneeId: number,
  targetWeekday: number // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const possibleDates: Date[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0); // Normalize current date to start of day

    if (currentDate >= today && currentDate.getDay() === targetWeekday) {
      possibleDates.push(currentDate);
    }
  }

  if (possibleDates.length === 0) {
    console.warn(`No occurrences of weekday ${targetWeekday} found in ${month}/${year}.`);
    return; // Or throw an error, depending on desired behavior
  }

  const randomDate = possibleDates[Math.floor(Math.random() * possibleDates.length)];

  await activityService.createActivity({
    name: template.name,
    activity_template_id: template.id,
    scheduled_date: randomDate.toISOString(),
    assigned_to_id: assigneeId,
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

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0); // Normalize current date to start of day

    if (currentDate >= today && currentDate.getDay() === randomWeekday) {
      datesForWeekday.push(currentDate);
    }
  }

  // 3. Create an activity for each of those dates
  const creationPromises = datesForWeekday.map(date =>
    activityService.createActivity({
      name: template.name,
      activity_template_id: template.id,
      scheduled_date: date.toISOString(),
      assigned_to_id: assigneeId,
    })
  );

  await Promise.all(creationPromises);
};

export const assignUpToFiveActivitiesPerWeekday = async (
  templates: ActivityTemplate[],
  year: number,
  month: number, // 1-12
  assigneeId: number
) => {
  if (templates.length === 0) {
    console.warn("No activity templates provided.");
    return;
  }

  // 1. Create a "weekly schedule template" for the month.
  const weeklySchedule = new Map<number, ActivityTemplate[]>();

  for (let weekday = 1; weekday <= 5; weekday++) { // Monday to Friday
    const numberOfActivities = Math.floor(Math.random() * 6); // 0 to 5
    const activitiesForDay: ActivityTemplate[] = [];

    for (let i = 0; i < numberOfActivities; i++) {
      const randomTemplateIndex = Math.floor(Math.random() * templates.length);
      activitiesForDay.push(templates[randomTemplateIndex]);
    }
    weeklySchedule.set(weekday, activitiesForDay);
  }

  // 2. Apply this template to every week in the month.
  const creationPromises: Promise<void>[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0); // Normalize current date to start of day

    if (currentDate >= today) {
      const dayOfWeek = currentDate.getDay();

      if (weeklySchedule.has(dayOfWeek)) {
        const activitiesForThisDay = weeklySchedule.get(dayOfWeek)!;

        activitiesForThisDay.forEach(template => {
          creationPromises.push(
            activityService.createActivity({
              name: template.name,
              activity_template_id: template.id,
              scheduled_date: currentDate.toISOString(),
              assigned_to_id: assigneeId,
            })
          );
        });
      }
    }
  }

  await Promise.all(creationPromises);
};
