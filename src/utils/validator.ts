export const valid = (path: null | string, isExps: boolean) => {
  if (typeof path !== 'string') {
    return null;
  } else if (path.includes('../')) {
    return null;
  } else if (path.includes('/node_modules/')) {
    return null;
  } else if (!path.startsWith('./')) {
    if (isExps) return null;
  }
  return path;
};
