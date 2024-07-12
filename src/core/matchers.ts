import { valid } from '../utils/validator';
import type { Exports } from '../types';

export const conditionMatch = (
  exps: Exports,
  conditions: Array<string>,
  isExps: boolean,
  data?: Array<string>,
): null | string => {
  if (exps === null) {
    return null;
  } else if (typeof exps === 'string') {
    if (!data || !data.length) {
      return valid(exps, isExps);
    }
    let j = 0;
    let result = '';
    for (let i = 0; i < exps.length; i++) {
      if (exps[i] === '*') {
        if (exps[i + 1] === '*') return null;
        result += data[j++] || '';
      } else {
        result += exps[i];
      }
    }
    return valid(result, isExps);
  } else if (Array.isArray(exps)) {
    for (const val of exps) {
      const result = conditionMatch(val, conditions, isExps, data);
      if (result) return result;
    }
    return null;
  } else if (typeof exps === 'object') {
    let result;
    const keys = Object.keys(exps);
    for (const key of keys) {
      if (key === 'default' || conditions.includes(key)) {
        result = conditionMatch(exps[key], conditions, isExps, data);
        if (result) return result;
      }
    }
  }
  return null;
};

// Support more complex fuzzy matching rules,
// backward compatible with the definition of the specification
export const fuzzyMatchKey = (path: string, keys: Array<string>) => {
  let prefix;
  let matched;
  const data = [];
  const pathLen = path.length;

  const findPathMatchIdx = (char: string | undefined, idx: number) => {
    if (!char) return pathLen;
    for (let i = idx; i < pathLen; i++) {
      if (char === path[i]) return i;
    }
    return -1;
  };

  keys = keys.sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (matched) break;
    let i = 0;
    let j = 0;
    for (i = 0; i < pathLen; i++) {
      if (path[i] === key[j]) {
        j++;
      } else if (key[j] === '*') {
        const next = key[j + 1];
        if (next === '*') break;
        const pathMatchIdx = findPathMatchIdx(next, i + 1);
        if (pathMatchIdx === -1) break;
        data.push(path.slice(i, pathMatchIdx));
        j += 2;
        i = pathMatchIdx;
      } else {
        break;
      }
    }

    if (j < key.length) {
      data.length = 0;
    } else if (i < pathLen) {
      if (key.endsWith('/')) {
        matched = key;
        prefix = path.slice(0, i);
      } else {
        data.length = 0;
      }
    } else {
      matched = key;
      prefix = path.slice(0, i);
    }
  }
  return [matched, prefix, data] as const;
};
