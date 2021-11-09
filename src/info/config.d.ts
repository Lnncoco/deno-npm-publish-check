/**
 * CONFIG 配置定义
 */
export interface CONFIG {
  /**
   * 需要检测的 tag 名称
   */
  checkTags: checkTags;
  /**
   * 全局 git 配置
   */
  git: DefaultGit;
  /**
   * 全局 jenkins 配置
   */
  jenkins?: DefaultJenkins;
  /**
   * 检查 package 的信息
   */
  package: PackageIndexes;
}

/**
 * 模板的URL 可以使用变量
 */
type templateURL = string;
/**
 * 普通URL 无法使用变量
 */
type URL = string;

/**
 * 需要检测的 tag 名称
 */
export type checkTags = string | string[];

/**
 * package配置信息
 */
export interface PackageIndexes {
  /**
   * key 为包名
   */
  [key: string]: PackageNameItem;
}

/**
 * packageName项数据的结构
 */
export interface PackageNameItem {
  /**
   * key 为tag名称
   */
  [key: string]: tagNameItem;
}

/**
 * tag项数据的结构
 */
export interface tagNameItem {
  git: Git;
  jenkins?: Jenkins;
}

/**
 * 全局默认Git查询配置
 */
export type DefaultGit = {
  cookie?: string;
  cookiePath?: string; // cookie的存放文件 存在cookie优先使用cookie字段
  template?: templateURL; // 全局 url模板  使用 {{}} {{=}} 符号定义替换变量名
  checkLoginURL?: string; // 登录页的路径
};

/**
 * 局部的git配置
 */
export type Git =
  /**
   * Git url
   * 存在局部url优先使用url 无法使用变量
   */
  | URL
  | {
      /**
       * 模板使用变量
       * 其值会替换模板中相同名称的变量
       */
      [key: string]: string;
    };

/**
 * 全局默认Jenkins查询配置
 */
export type DefaultJenkins = DefaultJenkinsItem;

export type DefaultJenkinsItem = {
  /**
   * 全局 Jenkins cookie
   */
  cookie?: string;
  /**
   * 全局 Jenkins cookie 的存放文件
   * 存在cookie优先使用cookie字段
   */
  cookiePath?: string;
  /**
   * 全局 url模板
   * 使用 {{}} 符号定义替换变量名
   * 使用 {{=}} 符号拼接带变量名的参数 如{{=cause}}替换为cause=参数值
   */
  template?: string;
  /**
   * 全局 Jenkins token
   * 拼接在访问的url之后 ?token=token
   */
  token?: string;
  /**
   * 全局 Jenkins cause参数值
   * 拼接在访问的url之后 ?cause=cause
   */
  cause?: string;
};

/**
 * 局部的Jenkins配置
 */
export interface Jenkins {
  /**
   * 局部 Jenkins cookie
   */
  cookie?: string;
  /**
   * Jenkins url
   * 存在局部url优先使用url 无法使用变量
   * 当前局部配置中存在token字段则会拼接token,否则将忽略全局token配置,直接访问url
   */
  url?: URL;
  /**
   * 模板使用变量
   * 除了以上保留关键字 其余值会替换模板中相同名称的变量
   */
  [key: string]: string | undefined;
}
