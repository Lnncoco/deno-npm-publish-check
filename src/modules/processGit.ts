import type { DefaultGit, Git } from "../info/config.d.ts";
import { processTemplate } from "./utils.ts";

/**
 * 将配置中的参数处理成可访问的URL
 *
 * git配置就两种情况
 * 1、局部git为字符串，则直接使用
 * 2、局部git为对象，则作为全局git字符串模板的参数
 * @param gitTemplate 全局git配置参数
 * @param params 局部git配置参数
 * @returns {string | false}
 */
export const processGitURL = (globalGit?: DefaultGit | null, params?: Git) => {
  if (!params) return false;
  if (typeof params === "string") return params;
  if (!(globalGit && globalGit.template && globalGit.cookie)) return false;
  if (Object.prototype.toString.call(params) === "[object Object]")
    return processTemplate(globalGit.template, params);
  return false;
};
