export const monthYearStringFromDate = ({ date, locale }) => {
  date = date.toLocaleDateString(locale || 'nl-NL', { day: 'numeric', year: 'numeric', month: 'long' });
  date = date.split(' ');
  return date[1] + ' ' + date[2];
}

export const weekDayFromDate = ({ date, locale }) => {
  return date.toLocaleDateString(locale || 'nl-NL', {
    weekday: 'long'
  })
}