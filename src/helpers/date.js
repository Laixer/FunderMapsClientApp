

/**
 * Convert a date string to a date object
 * Note: assumes a valid date is provided
 */
export const convertDateStringToDate = (date) => {
  date = /^(\d{4})[-](\d{1,2})[-](\d{1,2})$/.exec(date);
  return new Date(date[1], date[2] - 1, date[3]);
}

export const verifyDateInput = (input) => {
  // Verify the input format (yyyy-mm-dd)
  let matches = /^(\d{4})[-](\d{1,2})[-](\d{1,2})$/.exec(input);
  if (matches == null) return false;

  // Verify the date exists
  let d = matches[3];
  let m = matches[2] - 1;
  let y = matches[1];
  let composedDate = new Date(y, m, d);
  return composedDate.getDate() == d &&
          composedDate.getMonth() == m &&
          composedDate.getFullYear() == y;
};


export const convertDateObjectToDutchMonthYearString = (date) => {
  date = date.toLocaleDateString('nl-NL', {day: 'numeric', year: 'numeric', month: 'long'});
  date = date.split(' ');
  return date[1] + ' ' + date[2];
}
