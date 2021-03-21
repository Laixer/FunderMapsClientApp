

/**
 * Take care of loading an asset
 */
function asset(path: string): any {
  return require('@/assets/' + path);
}

/**
 * Take care of loading an icon
 */
export function icon(name: string): any {
  return asset('icons/' + name);
}

/**
 * Take care of loading an image
 */
export function image(name: string): any {
  return asset('image/' + name);
}