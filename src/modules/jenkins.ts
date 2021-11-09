import { FetchJenkinsError } from "./error.ts";
import DATA from "./DATA.ts";

/**
 * 触发 Jenkins
 * @param url package.json 文件完整地址(raw地址)
 * @returns
 */
export const fetchTriggerJenkins = (url: string, cookie?: string) => {
  const headers: { cookie?: string } = {};
  if (cookie ?? DATA.global.jenkins?.cookie)
    headers.cookie = cookie ?? DATA.global.jenkins?.cookie;
  return fetch(url, { headers })
    .then((response) => checkLogin(url, response))
    .catch((e) => {
      throw new FetchJenkinsError(e.message, url, 1000);
    });
};

/**
 * 检测是否需要登录
 * @param url
 * @param response
 * @returns
 */
export const checkLogin = (url: string, response: Response) => {
  if (response.ok) return true;

  const { status } = response;
  if (
    status === 403 &&
    response.headers.get("x-you-are-authenticated-as") === "anonymous"
  )
    throw new FetchJenkinsError(
      `Jenkins需要访问权限，请检查Cookie配置`,
      url,
      1002
    );
  if (status === 405)
    throw new FetchJenkinsError(
      `Jenkins Token 不匹配，请检查Token配置`,
      url,
      1003
    );
  if (status >= 300 || status < 200)
    throw new FetchJenkinsError(`请求错误，状态码 ${status}`, url, 1000);
  return true;
};
