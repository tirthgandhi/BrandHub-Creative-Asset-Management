export function themeAt(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 300 && minutes < 660) return "morning";
  if (minutes >= 660 && minutes < 990) return "afternoon";
  if (minutes >= 990 && minutes < 1170) return "sunset";
  return "night";
}
