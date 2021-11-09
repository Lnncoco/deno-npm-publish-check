import { normalize, toFileUrl, jsoncParser } from "../../deps.ts";
import { displayError } from "./utils.ts";
import type { CONFIG } from "../info/config.d.ts";
import DEFAULT_CONFIG from "../info/defaultConfig.ts";

/**
 * 默认配置文件的路径
 */
const PATH = "./config.jsonc";
const CWD = Deno.cwd();
/**
 * init 生成配置文件名称
 */
const FILE_NAME = "config";

/**
 * 读取配置文件数据
 * @param configPath 配置文件路径
 * @returns
 */
export const readConfigData: (configPath?: string) => Promise<CONFIG> = async (
  configPath?: string
) => {
  let path = PATH;
  if (configPath) path = configPath;
  try {
    const URL = toFileUrl(normalize(`${CWD}/${path}`));
    const decoder = new TextDecoder("utf-8");
    const configFile = await Deno.readFile(URL);
    return jsoncParser(decoder.decode(configFile));
  } catch (e) {
    displayError(`❗找不到配置文件: ${e.message.match(/\"(.*?)\"/g)}`, true);
    Deno.exit(1);
  }
};

/**
 * 创建 config 文件
 */
export const createConfigFile = (fileName?: string) => {
  try {
    Deno.writeTextFile(`${fileName ?? FILE_NAME}.jsonc`, DEFAULT_CONFIG);
  } catch (e) {
    displayError(`❗写入文件错误: ${e.message}`, true);
    Deno.exit(1);
  }
};

/**
 * 读取 cookie 文件
 */
export const readCookieFile = async (path: string) => {
  try {
    const URL = toFileUrl(normalize(`${CWD}/${path}`));
    const decoder = new TextDecoder("utf-8");
    const buf = await Deno.readFile(URL);
    return decoder.decode(buf);
  } catch (e) {
    displayError(`❗找不到cookie文件: ${e.message.match(/\"(.*?)\"/g)}`, true);
    Deno.exit(1);
  }
};
