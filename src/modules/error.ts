/**
 * 获取Git仓库时的错误信息
 */
export class FetchGitError extends Error {
  constructor(message: string, public url: string, public code: number) {
    super(message);
    this.url = url;
    this.code = code;
  }
}

/**
 * 获取Registry包时的错误信息
 */
export class FetchRegistryError extends Error {
  constructor(message: string, public url: string, public code: number) {
    super(message);
    this.url = url;
    this.code = code;
  }
}

/**
 * 触发Jenkins产生的错误
 */
export class FetchJenkinsError extends Error {
  constructor(message: string, public url: string, public code: number) {
    super(message);
    this.url = url;
    this.code = code;
  }
}

/**
 * Registry的信息解析时的错误
 */
export class RegistryError extends Error {
  constructor(message: string, public url: string) {
    super(message);
    this.url = url;
  }
}

/**
 * 版本号解析时的错误
 */
export class VersionError extends Error {}
