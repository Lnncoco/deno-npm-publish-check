import { VersionError } from "./error.ts";

/**
 * 版本号规范说明
 * https://semver.org/lang/zh-CN/
 */

/**
 * 比较操作符
 */
export type operation = operationSymbol | operationLetter;
export type operationSymbol = ">" | "<" | "=" | "==" | "!=" | ">=" | "<=";
export type operationLetter = "gt" | "lt" | "eq" | "neq" | "ge" | "le";

/**
 * 比较先行版本号
 */
export type preVersion =
  | boolean // 同时开启或关闭
  | {
      tag?: boolean; // 比较先行版本号标签
      version?: boolean; // 比较先行版本号版本  支持数字与点
    };

/**
 * 版本号解析后的格式
 */
export interface parseVersion {
  major: number;
  minor: number;
  patch: number;
  preVersion?: {
    tag?: string;
    version?: (string | number)[];
  };
}

/**
 * 条件为真时的返回值
 */
const TRUE = 1;
/**
 * 条件为假时的返回值
 */
const FALSE = 0;
/**
 * 无法判断时的返回值
 */
const ERROR = -1;

/**
 * 转换为数字类型
 * @param variable
 */
export const toNumber = (variable: string | number) => {
  if (!variable.toString) return NaN;
  if (!/^[0-9]+$/.test(variable.toString())) return NaN;
  return Number(variable);
};

/**
 * 判断是否是数字
 * @param variable
 */
export const isNumber = <T>(variable: T) =>
  typeof variable === "number" && isFinite(variable);

/**
 * 能成为数字
 * @param variable
 */
export const canBeNumber = (variable: number | string) =>
  toNumber(variable) === 0 || !Number.isNaN(toNumber(variable));

/**
 * 解析版本号
 *
 * 传入格式：
 * major.minor.patch-preVersion
 * preVersion: alpha.1 或 alpha.1.0.3 或 1.0.3
 * @param version {string}
 */
export const parseVersion = (version: string): never | parseVersion => {
  const verAndPre = version.split("-");
  if (verAndPre.length > 2)
    throw new VersionError("版本号内只允许有一个短横线");
  const [mainVerString, preVerString] = verAndPre;
  const mainArray = mainVerString.split(".");
  if (mainArray.length !== 3) throw new VersionError("版本号不符合X.Y.Z格式");

  if (
    !canBeNumber(mainArray[0]) ||
    !canBeNumber(mainArray[1]) ||
    !canBeNumber(mainArray[2])
  )
    throw new VersionError("版本号 major.minor.patch 中不能有数字以外的字符");
  const parseVersion: parseVersion = {
    major: toNumber(mainArray[0]),
    minor: toNumber(mainArray[1]),
    patch: toNumber(mainArray[2]),
  };

  // 无 preVersion
  if (!preVerString) return parseVersion;
  // 存在 preVersion 无tag
  const preArray = preVerString.split(".");
  if (preArray.some((item) => item === ""))
    throw new VersionError("版本号中.符号不能相连");
  if (canBeNumber(preArray[0])) {
    parseVersion.preVersion = {
      version: preArray.map((item) => {
        const num = Number(item);
        return isNumber(num) ? num : item;
      }),
    };
    return parseVersion;
  }
  // 存在 preVersion 有tag
  const [tag, ...preVerArray] = preArray;
  parseVersion.preVersion = { tag };
  if (preVerArray.length)
    parseVersion.preVersion.version = preVerArray.map((item) => {
      const num = toNumber(item);
      return num || num === 0 ? num : item;
    });
  return parseVersion;
};

/**
 * 比较版本
 * @param ver1
 * @param ver2
 * @param operation 判断符号
 * @returns {number}  1 符合条件  0 不符合条件  -1 无法比较
 */
export const compare = (
  ver1: number | string,
  ver2: number | string,
  operation: operationLetter
) => {
  if (!isNumber(ver1) || !isNumber(ver2)) {
    if (operation === "eq")
      return ver1.toString() === ver2.toString() ? TRUE : FALSE;
    else if (operation === "neq")
      return ver1.toString() !== ver2.toString() ? TRUE : FALSE;
    else return ERROR;
  }

  switch (operation) {
    case "gt":
      return ver1 > ver2 ? TRUE : FALSE;
    case "lt":
      return ver1 < ver2 ? TRUE : FALSE;
    case "eq":
      return ver1 === ver2 ? TRUE : FALSE;
    case "neq":
      return ver1 !== ver2 ? TRUE : FALSE;
    case "ge":
      return ver1 >= ver2 ? TRUE : FALSE;
    case "le":
      return ver1 <= ver2 ? TRUE : FALSE;
    default:
      return ERROR;
  }
};

/**
 * 版本号对比
 * @param target {string} 目标版本号
 * @param version {string} 比较版本号
 * @param operation {string} 比较操作符
 * @param preVersion {boolean} 是否比较先行版本号（Pre-release Version）
 * @returns {number} 1 符合条件  0 不符合条件  -1 无法比较
 */
export const compareSemver = (
  target: string,
  version: string,
  operation: operation,
  preVersion: preVersion = true
) => {
  enum operationShrink {
    ">" = "gt",
    "<" = "lt",
    "=" = "eq",
    "==" = "eq",
    "!=" = "neq",
    ">=" = "ge",
    "<=" = "le",
    "gt" = "gt",
    "lt" = "lt",
    "eq" = "eq",
    "neq" = "neq",
    "ge" = "ge",
    "le" = "le",
  }
  const symbol = operationShrink[operation] ?? <operationLetter>operation;
  const keyList: (keyof Omit<parseVersion, "preVersion">)[] = [
    "major",
    "minor",
    "patch",
  ];

  const ver1 = parseVersion(target);
  const ver2 = parseVersion(version);

  let result = ERROR;
  // 版本号比较
  for (const key of keyList) {
    if (ver1[key] !== ver2[key]) return compare(ver1[key], ver2[key], symbol);
    result = compare(ver1[key], ver2[key], symbol);
  }
  if (result === ERROR) return ERROR;

  // 先行版本号比较
  let preVersionTag: boolean;
  let preVersionVer: boolean;
  if (typeof preVersion === "boolean") {
    if (preVersion) preVersionTag = preVersionVer = true;
    else preVersionTag = preVersionVer = false;
  } else {
    preVersionTag = preVersion.tag ?? true;
    preVersionVer = preVersion.version ?? true;
  }
  // 先行版本号 tag
  if (preVersionTag && ver1?.preVersion?.tag !== ver2?.preVersion?.tag) {
    return ERROR; // 如果tag不同则无法比较大小
  }
  // 先行版本号 version
  if (preVersionVer) {
    if (!ver1?.preVersion?.version && !ver2?.preVersion?.version) return result;
    if (!ver1?.preVersion?.version || !ver2?.preVersion?.version) return ERROR; // pre-version不同 无法比较大小
    // 数组中有一个字符串时，则比对另一个数组同位置是否是相同字符串，否则无法比较
    if (
      isPreVerDifferentStringExists(
        ver1.preVersion.version,
        ver2.preVersion.version
      ) ||
      isPreVerDifferentStringExists(
        ver2.preVersion.version,
        ver1.preVersion.version
      )
    )
      return ERROR;

    const ver1pv = ver1.preVersion.version;
    const ver2pv = ver2.preVersion.version;
    const length =
      ver1pv.length > ver2pv.length ? ver1pv.length : ver2pv.length;

    for (let i = 0; i < length; i++) {
      // 最后位是0的时候 视为相等
      if (typeof ver1pv[i] === "undefined") {
        if (ver2pv[i] === 0) return result;
        else return compare(0, ver2pv[i], symbol);
      }
      if (typeof ver2pv[i] === "undefined") {
        if (ver1pv[i] === 0) return result;
        else return compare(ver1pv[i], 0, symbol);
      }

      if (!canBeNumber(ver1pv[i]) || !canBeNumber(ver2pv[i])) {
        // 为字符的情况
        if (ver1pv[i].toString() === ver2pv[i].toString()) continue;
        else return ERROR; // 如果带字符且不相等则无法比较大小
      } else {
        // 为数字的情况
        if (ver1pv[i] != ver2pv[i])
          return compare(ver1pv[i], ver2pv[i], symbol);
        result = compare(ver1pv[i], ver2pv[i], symbol);
      }
    }
  }
  return result;
};

/**
 * 判断数组中是否存在不同的字符串
 */
const isPreVerDifferentStringExists = (
  arr1: (number | string)[],
  arr2: (number | string)[]
) =>
  arr1.reduce<boolean>((flag, item, i) => {
    if (!canBeNumber(item) && item !== arr2[i]) flag = true;
    return flag;
  }, false);
