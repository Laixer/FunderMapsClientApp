import crypto from 'crypto';

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function StringToColor(str: string) {
  return `#${crypto.createHash('md5').update(str).digest('hex').substr(0, 6)}`;
}
