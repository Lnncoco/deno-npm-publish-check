import { parse } from "../deps.ts";
import DATA, { curPackageItem } from "./modules/DATA.ts";
import displayHelp, { Args } from "./info/help.ts";
import displayVersion from "./info/version.ts";
import { displayError, displayLog } from "./modules/utils.ts";
import {
  FetchGitError,
  FetchRegistryError,
  FetchJenkinsError,
} from "./modules/error.ts";
import { createConfigFile, readConfigData } from "./modules/configFile.ts";
import {
  fetchGitPackageJson,
  fetchRegistryJson,
  RegistryInfo,
} from "./modules/package.ts";
import { fetchTriggerJenkins } from "./modules/jenkins.ts";
import { compareSemver } from "./modules/semver.ts";
import { getUpdateList, displayPackageList } from "./modules/interaction.ts";
import { colors } from "../deps.ts";
import { WaitPrompt } from "./modules/terminalOutput.ts";
// 导出
export { initDATA } from "./modules/DATA.ts";
export { jsoncParser } from "../deps.ts";
export type { curPackageItem } from "./modules/DATA.ts";
export { processUpdateList } from "./modules/interaction.ts";

/**
 * 存储网络请求数据
 */
const CACHE_REGISTRY: {
  /**
   * registry地址
   */
  [key: string]: RegistryInfo;
} = {};

const waitPrompt = WaitPrompt();

/**
 * 启动函数
 */
export default async () => {
  const args = <Args>parse(Deno.args); // 获取启动参数
  if (args.v ?? args.version) return displayVersion();
  if (args.h ?? args.help) return displayHelp();
  if (args._.includes("init")) return createConfigFile(args?.name);
  if (args._.includes("check")) {
    await DATA.init(await readConfigData(args.c ?? args.config));

    waitPrompt.start("analysis config", {
      mode: "appendText",
      len: 3,
      text: ".",
    });
    let packageData = DATA.findData(
      args.t?.split(",") ?? args.tags?.split(",")
    );
    if (!packageData.length)
      return displayLog(
        `待检测的包列表为空 tag: ${DATA.global.curTags}`,
        "yellow"
      );

    packageData = await loopGetPackageVersion(packageData);
    const selected = await getUpdateList(packageData);
    const triggerInfo = await loopTriggerJenkins(selected);
    displayPackageList(triggerInfo);
    return;
  }
  return displayVersion("NPM模块发包检测工具");
};

/**
 * 输出提示信息
 */
const outputCurInfo = (str: string, callback?: (text: string) => void) => {
  if (callback) callback(str);
  else waitPrompt.updateText(str);
};

/**
 * 循环遍历获取版本信息
 * @param data
 */
export const loopGetPackageVersion = async (
  data: curPackageItem[],
  callback?: (text: string) => void
) => {
  if (!data.length) return [];
  const packageTotal = data.length;
  let curPackageIndex = 0;

  // 获取版本信息处理数据
  for await (const item of data) {
    curPackageIndex++;
    const ordinal = `${curPackageIndex}/${packageTotal}`;
    const curPackageInfo = `${item.name} [${item.tag}]`;
    try {
      // git
      outputCurInfo(
        `(${ordinal}) ${curPackageInfo} Git package.json`,
        callback
      );
      if (item.git) item.gitInfo = await fetchGitPackageJson(item.git);
      if (!item.gitInfo) throw Error("获取Git信息异常");
      item.gitVersion = item.gitInfo.version;
      item.registry = item.gitInfo.registryURL;

      // registry
      outputCurInfo(
        `(${ordinal}) ${curPackageInfo} NPM registry info`,
        callback
      );
      if (CACHE_REGISTRY[item.name])
        item.registryInfo = CACHE_REGISTRY[item.name];
      else
        item.registryInfo = CACHE_REGISTRY[item.name] = await fetchRegistryJson(
          item.registry,
          item.tag
        );
      if (!item.registryInfo) throw Error("获取NPM仓库信息异常");
      item.publishVersion = item.registryInfo.curVersion;
      item.publishTime = item.registryInfo.curModified;

      // compare version
      item.canUpdate = compareSemver(item.gitVersion, item.publishVersion, ">");
      item.anomalyUpdate = compareSemver(
        item.gitVersion,
        item.publishVersion,
        "<"
      );
    } catch (e) {
      item.errorMessage = e.message;
      if (e instanceof FetchGitError) item.fetchGitError = true;
      if (e instanceof FetchRegistryError) item.fetchRegistryError = true;
      if (DATA.args["on-error"]) {
        if (item.fetchGitError || item.fetchRegistryError) {
          const info = `${e.message}  URL：${e.url}`;
          displayError(`❗${item.name} [${item.tag}] ${colors.gray(info)}`);
        } else {
          displayError(
            `❗${item.name} [${item.tag}] ${colors.gray(e.message)}`
          );
        }
      }
    }
  }
  waitPrompt.stop();
  return data;
};

/**
 * 触发Jenkins
 * @param selected
 * @returns
 */
export const loopTriggerJenkins = async (
  selected: curPackageItem[],
  callback?: (text: string) => void
) => {
  if (!selected.length) return [];
  const packageTotal = selected.length;
  let curPackageIndex = 0;
  for await (const item of selected) {
    curPackageIndex++;
    const ordinal = `${curPackageIndex}/${packageTotal}`;
    const curPackageInfo = `${item.name} [${item.tag}]`;
    try {
      outputCurInfo(`(${ordinal}) trigger Jenkins ${curPackageInfo}`, callback);
      if (!item.jenkins) throw Error(`${item.name} Jenkins URL 异常`);
      await fetchTriggerJenkins(item.jenkins, item.jenkinsCookie);
    } catch (e) {
      item.errorMessage = e.message;
      item.jenkinsTriggerError = e.message;
      if (DATA.args["on-error"]) {
        if (e instanceof FetchJenkinsError) {
          const info = `${e.message}  URL：${e.url}`;
          displayError(`❗${item.name} [${item.tag}] ${colors.gray(info)}`);
        } else
          displayError(
            `❗${item.name} [${item.tag}] ${colors.gray(e.message)}`
          );
      }
    }
  }
  waitPrompt.stop();
  return selected;
};
