import { FetchGitError, FetchRegistryError } from "./error.ts";
import DATA from "./DATA.ts";
import { dayjs } from "../../deps.ts";

const TIME_TEMLATE = "YYYY-MM-DD HH:mm:ss";

/**
 * package.json 中的必要信息
 */
export interface PackageData {
  name: string;
  version: string;
  publishConfig: {
    registry: string;
  };
  description: string;
  registryURL: string;
  [key: string]: unknown;
}

/**
 * fetchGitPackageJson 返回数据
 */
export interface fetchGitPackageJsonResult {
  name: string;
  version: string;
  publishConfig: string;
  description: string;
  registryURL: string;
}

/**
 * 仓库信息的数据结构
 */
export interface RegistryData {
  name: string;
  version: string;
  time: {
    created: string;
    modified: string;
    [key: string]: string;
  };
  versions: {
    [key: string]: unknown;
  };
  "dist-tags": {
    [key: string]: string;
  };
  [key: string]: unknown;
}

/**
 * 从仓库信息提取的数据结构
 */
export interface RegistryInfo {
  name: string;
  curVersion: string;
  curModified: string;
  tagsVersionList: {
    [key: string]: string;
  };
  timeCreated: string;
  timeModified: string;
}

/**
 * 拼凑完整的 registry URL
 * @param data package.json 的必要信息
 * @returns string
 */
const registryURL = (data: PackageData) =>
  `${data.publishConfig.registry}/${data.name}`;

/**
 * 获取 git 的 package 文件信息
 * @param url package.json 文件完整地址(raw地址)
 * @returns
 */
export const fetchGitPackageJson = (url: string) => {
  const headers: { cookie?: string } = {};
  if (DATA.global.git.cookie) headers.cookie = DATA.global.git.cookie;
  return fetch(url, { headers })
    .then((response) => checkLogin(url, response))
    .then((data: PackageData) => ({
      name: data.name,
      version: data.version,
      description: data.description,
      publishConfig: data.publishConfig.registry,
      registryURL: registryURL(data),
    }))
    .catch((e) => {
      throw new FetchGitError(e.message, url, 1000);
    });
};

/**
 * 获取 registry 的包信息
 * 从 package.json 中获取 registry 地址
 * @param url registry 完整地址
 * @returns
 */
export const fetchRegistryJson = (
  url: string,
  tag: string
): Promise<RegistryInfo> =>
  fetch(url)
    .then((response) => {
      const { status } = response;
      if (status !== 200)
        throw new FetchRegistryError(
          `请求NPM仓库错误，状态码 ${status}`,
          url,
          1000
        );
      return response.json();
    })
    .then((data: RegistryData) => {
      const tagsVersionList = data["dist-tags"];
      const curVersion = tagsVersionList?.[tag] ?? "";
      // if (!curVersion) throw new RegistryError(`找不到指定tag: ${tag}`, url);
      const curModified = data.time[curVersion];
      return {
        name: data.name,
        tagsVersionList,
        curVersion,
        curModified: dayjs(curModified).format(TIME_TEMLATE),
        timeCreated: dayjs(data.time.created).format(TIME_TEMLATE),
        timeModified: dayjs(data.time.modified).format(TIME_TEMLATE),
      };
    })
    .catch((e) => {
      throw new FetchRegistryError(e.message, url, 1000);
    });

/**
 * 检测是否需要登录
 */
export const checkLogin = (url: string, response: Response) => {
  const { status } = response;
  if (status !== 200)
    throw new FetchGitError(`请求Git地址错误，状态码 ${status}`, url, 1000);
  if (response.url.includes(DATA.global.git?.checkLoginURL ?? "/users/sign_in"))
    throw new FetchGitError(`Git仓库需要访问权限，请检查Cookie配置`, url, 1002);
  return response.json();
};
