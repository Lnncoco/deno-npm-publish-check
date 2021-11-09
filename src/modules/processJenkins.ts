import type { DefaultJenkins, Jenkins } from "../info/config.d.ts";
import { processTemplate, isTemplate } from "./utils.ts";

/**
 * 将配置中的参数处理成可访问的URL
 *
 * Jenkins参数稍多
 * 1、局部参数存在url键名，则优先使用url值。不做变量替换。
 * 2、局部参数参数不存在url键名，取全局Jenkins配置中的template字段作为模板。
 *    除了url、cookie键名，其余的值作为字符串模板的变量匹配，局部中没有找到则到全局中查找。
 *
 * @param globalJenkins 全局Jenkins配置参数
 * @param localJenkins 局部Jenkins配置参数
 * @returns {string | false}
 */
export const processJenkinsURL = (
  globalJenkins?: DefaultJenkins | null,
  localJenkins?: Jenkins
) => {
  /**
   * 不存在局部Jenkins配置
   */
  if (!localJenkins) {
    const template = getTemplate(globalJenkins);
    if (!template) return false; // 未定义全局URL
    const url = processTemplate(template, globalJenkins!);
    if (!url || isTemplate(url)) return false; // 返回false 或者 未替换完全
    return url;
  }

  /**
   * 存在局部Jenkins配置
   */
  // deno-lint-ignore no-unused-vars
  const { url, cookie, ...params } = localJenkins;

  // 存在url参数 则直接使用
  if (url) return url;

  // 不存在url
  const template = getTemplate(globalJenkins);
  if (!template) return false;
  return processTemplate(template, {
    token: globalJenkins?.token,
    cause: globalJenkins?.cause,
    ...params,
  });
};

/**
 * 获取全局配置的模板信息
 * @param globalJenkins
 */
const getTemplate = (globalJenkins: DefaultJenkins | null | undefined) =>
  globalJenkins?.template ?? false;
