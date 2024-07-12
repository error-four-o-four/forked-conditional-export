import { isPrimitiveValue } from 'aidly';

import { valid } from '../utils/validator';
import { parseModuleId } from '../utils/parser';
import { conditionMatch, fuzzyMatchKey } from './matchers';
import type { Imports, Exports } from '../types';

const defaultConditions = ['require'];

const findPath = (
  path: string,
  obj: Imports,
  conditions: Array<string>,
  isExps: boolean,
) => {
  let result = null;
  let matchKey = null;
  let matchPrefix = null;

  if (obj[path]) {
    matchKey = path;
    matchPrefix = path;
    result = conditionMatch(obj[path], conditions, isExps);
  } else {
    if (path.length > 1) {
      // When looking for path, we must match, no conditional match is required
      const [key, prefix, data] = fuzzyMatchKey(path, Object.keys(obj));
      if (key) {
        matchKey = key;
        matchPrefix = prefix;
        result = conditionMatch(obj[key], conditions, isExps, data);
      }
    }
  }
  if (result) {
    // If is dir match, the return must be dir
    const keyIsDir = matchKey!.endsWith('/');
    const resultIsDir = result.endsWith('/');
    if (keyIsDir && !resultIsDir) return null;
    if (!keyIsDir && resultIsDir) return null;
    if (path !== matchPrefix) {
      result += path.slice(matchPrefix!.length);
    }
  }
  return result;
};

export const findPathInExports = (
  path: string,
  exps: Exports,
  conditions = defaultConditions,
) => {
  if (isPrimitiveValue(exps)) return null;
  if (Array.isArray(exps)) return null;
  if (path !== '.' && !path.startsWith('./')) {
    throw new SyntaxError(`path "${path}" must be "." or start with "./"`);
  }
  return findPath(path, exps, conditions, true);
};

export const findPathInImports = (
  path: string,
  imports: Imports,
  conditions = defaultConditions,
) => {
  if (isPrimitiveValue(imports)) return null;
  if (Array.isArray(imports)) return null;
  if (!path.startsWith('#')) {
    throw new SyntaxError(`path "${path}" must start with "#"`);
  }
  return findPath(path, imports, conditions, false);
};

export const findEntryInExports = (
  field: Exports,
  conditions = defaultConditions,
) => {
  if (typeof field === 'string') {
    return valid(field, true);
  } else {
    // If syntactic sugar doesn't exist, try conditional match
    return (
      findPathInExports('.', field, conditions) ||
      conditionMatch(field, conditions, true)
    );
  }
};

export const findPkgData = (
  moduleId: string,
  exps: Exports,
  conditions = defaultConditions,
) => {
  let path = null;
  let resolve = null;
  const { raw, name, version, path: virtualPath } = parseModuleId(moduleId);

  if (!name) {
    throw new SyntaxError(`"${raw}" is not a valid module id`);
  }

  path = virtualPath
    ? findPathInExports(virtualPath, exps, conditions)
    : findEntryInExports(exps, conditions);
  // ./ => /
  // ./a => /a
  // ./a/ => /a/
  if (path) {
    resolve = `${name}${version ? `@${version}` : ''}${path.slice(1)}`;
  }

  return {
    raw,
    name,
    path,
    version,
    resolve,
  };
};
