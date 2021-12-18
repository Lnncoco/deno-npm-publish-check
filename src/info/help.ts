import { displayLog } from "../modules/utils.ts";
import { VERSION } from "./version.ts";

/**
 * 帮助说明
 */
const HELP = `
 仓库项目版本发包检测工具 ${VERSION}。
 
 USAGE:
    npm-publish-check <options>
 
 OPTIONS:
    check                        按配置文件检查仓库中的包信息
    init [--name config.jsonc]   生成默认的config.ts配置文件，name参数为生成文件的名称
    -c, --config <FILE>          指定配置文件路径 (默认./config.jsonc)
    -j, --jenkins <true|false>   是否触发Jenkins更新 (默认false)
    -t, --tags <TAG,..>          检查指定的tag版本信息 用逗号分隔多个tag
    -v, --verison                查看当前版本
    --on-error                   显示详细错误信息
    -h, --help                   帮助文档
 `;

/**
 * 帮助手册打印
 */
export default () => {
  displayLog(HELP);
  Deno.exit(0);
};

/**
 * 启动传参
 */
export interface Args {
  _: string[];
  // -c --config 配置文件路径 ./config.ts
  c?: string;
  config?: string;
  // -j --jenkins 自动触发Jenkins true
  j?: boolean;
  jenkins?: boolean;
  // -t --tags 检查指定的 tags更新状态
  t?: string;
  tags?: string;
  // -h --help
  h?: boolean;
  help?: boolean;
  // -v --version
  v?: boolean;
  version?: boolean;
  // --on-error 显示详细错误信息
  "on-error"?: boolean;
  // init 生成默认的config.ts配置文件
  init?: boolean;
  // --name 配合init指定生成文件名
  name?: string;
  // check 执行检测逻辑
  check?: boolean;
}
