import { log, colors } from "../../deps.ts";

type Color =
  | "green"
  | "yellow"
  | "blue"
  | "red"
  | "magenta"
  | "cyan"
  | "white"
  | "gray";

/**
 * 控制台输出信息
 * @param str {string}
 * @param color {string}
 * @returns
 */
export const displayLog = (str: string, color?: Color) => {
  if (!color) return console.log(str);
  console.log(colors[color](str));
};

/**
 * 控制台输出错误信息
 * @param str {string}
 * @returns
 */
export const displayError = (str: string, color?: boolean) =>
  color ? log.error(str) : console.log(str);

/**
 * 根据模板输出处理后的字符串
 * @param template 字符串模板
 * @param data 变量
 */
export const processTemplate = (
  template: string,
  data: { [key: string]: string | undefined }
) => {
  let flag = true;
  const result = template.replace(/{{=?(\w+)}}/g, (vars, key) => {
    if (!data[key]) return (flag = false) || vars;
    return vars[2] === "=" ? `${key}=${data[key]}` : data[key]!;
  });
  return flag ? result : false;
};

/**
 * 判断是否是模板字符串
 * @param string 字符串
 */
export const isTemplate = (string: string) => {
  const reg = /{{=?(\w+)}}/g;
  return reg.test(string);
};

/**
 * 简单深拷贝
 * @param obj
 */
export const deepClone: <T>(obj: T) => T = (obj) =>
  JSON.parse(JSON.stringify(obj));
