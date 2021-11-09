import { parse } from "../../deps.ts";
import type {
  checkTags,
  PackageIndexes,
  DefaultGit,
  DefaultJenkins,
} from "../info/config.d.ts";
import type { Args } from "../info/help.ts";
import type { CONFIG } from "../info/config.d.ts";
import type { RegistryInfo, fetchGitPackageJsonResult } from "./package.ts";
import { readCookieFile } from "./configFile.ts";
import { processGitURL } from "./processGit.ts";
import { processJenkinsURL } from "./processJenkins.ts";
import { deepClone } from "./utils.ts";

export interface DATA {
  args: Args;
  global: {
    checkTags: string[];
    curTags: string[];
    git: DefaultGit;
    jenkins: DefaultJenkins | null;
  };
  cur: curPackageItem[];
  packageConfig: PackageIndexes | null;
  init: init;
  findData: findData;
}

type init = (CONFIG: CONFIG) => void;
type findData = (findTag?: string | string[]) => curPackageItem[];
type NewDATA = Omit<DATA, "init">;

/**
 * 符合tag条件的项数据结构
 */
export interface curPackageItem {
  name: string;
  tag: string;
  git: string | false;
  jenkins: string | false;
  jenkinsCookie?: string; // jenkins Cookie
  jenkinsTriggerError?: string; // jenkins 触发是否异常 其中存储异常提示信息
  // 仓库地址
  registry?: string;
  // git版本信息
  fetchGitError?: boolean; // 错误时为true
  gitVersion?: string;
  // 仓库版本信息
  fetchRegistryError?: boolean; // 错误时为true
  publishVersion?: string;
  publishTime?: string;
  // 错误信息
  errorMessage?: string;
  // 是否更新标识
  canUpdate?: number; // 是否升级 1 升级 0 不升级 -1 无法比较
  anomalyUpdate?: number; // git仓库比npm仓库版本低  1 异常  0 正常 -1 无法比较
  // 暂存数据
  gitInfo?: fetchGitPackageJsonResult; // 存储获取的远程信息
  registryInfo?: RegistryInfo; // 存储获取的远程信息
}

/**
 * 默认查询标签
 */
const defaultcheckTags = ["latest"];

/**
 * 将配置中的 checkTags 字段处理成数组
 * @param tags
 * @returns
 */
const processConfigTags = (tags: checkTags) =>
  tags ? (Array.isArray(tags) ? tags : [tags]) : null;

/**
 * 将配置中的 cookiePath 字段转换成 cookie
 * @param config
 * @returns
 */
const processConfigCookiePath = async (config: DefaultGit | DefaultJenkins) => {
  if (config.cookie || !config.cookiePath) return config;
  config.cookie = await readCookieFile(config.cookiePath);
  return config;
};

/**
 * 初始化独立的DATA对象
 */
export const initDATA = async (CONFIG: CONFIG) => {
  const newDATA: NewDATA = {
    args: { _: [] },
    global: {
      checkTags: defaultcheckTags,
      curTags: [],
      git: { cookie: "" },
      jenkins: null,
    },
    cur: [],
    packageConfig: null,
    findData,
  };
  // args
  newDATA.args = <Args>parse(Deno.args);
  // global
  if (CONFIG?.git)
    newDATA.global.git = await processConfigCookiePath(CONFIG.git);
  if (CONFIG?.jenkins)
    newDATA.global.jenkins = await processConfigCookiePath(CONFIG.jenkins);
  newDATA.global.checkTags =
    processConfigTags(CONFIG.checkTags) ?? defaultcheckTags;
  // config 中的 package 字段数据
  newDATA.packageConfig = deepClone(CONFIG.package);
  return newDATA;
};

/**
 * 初始化函数
 * 将读取的 consig.ts 解析并存储
 */
const init: init = async (CONFIG) => {
  // args
  DATA.args = <Args>parse(Deno.args);
  // global
  if (CONFIG?.git) DATA.global.git = await processConfigCookiePath(CONFIG.git);
  if (CONFIG?.jenkins)
    DATA.global.jenkins = await processConfigCookiePath(CONFIG.jenkins);
  DATA.global.checkTags =
    processConfigTags(CONFIG.checkTags) ?? defaultcheckTags;
  // config 中的 package 字段数据
  DATA.packageConfig = deepClone(CONFIG.package);
  return DATA;
};

/**
 * 按标签查询包信息
 */
const findData: findData = (findTag) => {
  if (!DATA.packageConfig) return DATA.cur;
  let tagList = DATA.global.checkTags;
  if (findTag) tagList = Array.isArray(findTag) ? findTag : [findTag];
  DATA.global.curTags = tagList;

  DATA.cur = Object.entries(DATA.packageConfig).reduce<curPackageItem[]>(
    (list, [packageName, packageTagList]) => {
      tagList.forEach((tag) => {
        if (packageTagList[tag])
          list.push({
            name: packageName,
            tag: tag,
            git: processGitURL(DATA.global.git, packageTagList[tag].git),
            jenkins: processJenkinsURL(
              DATA.global.jenkins,
              packageTagList[tag].jenkins
            ),
            jenkinsCookie: packageTagList[tag].jenkins?.cookie,
          });
      });
      return list;
    },
    []
  );
  return DATA.cur;
};

/**
 * 配置数据存储
 */
const DATA: DATA = {
  args: { _: [] },
  global: {
    checkTags: defaultcheckTags,
    curTags: [],
    git: { cookie: "" },
    jenkins: null,
  },
  cur: [],
  packageConfig: null,
  init,
  findData,
};
export default DATA;
