import { findPkgData } from './core';
import { parseModuleId } from './utils/parser';

export type PrimitiveType =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

export type Imports = Record<string, Exports>;
export type Exports =
  | PrimitiveType
  | Array<Exports>
  | { [key: string]: Exports; };

export type PkgData = ReturnType<typeof findPkgData>;
export type ModuleIdData = ReturnType<typeof parseModuleId>;
