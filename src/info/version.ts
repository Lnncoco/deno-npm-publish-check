import { displayLog } from "../modules/utils.ts";

/**
 * 版本信息
 */
export const VERSION = "1.0.0";

export default (str?: string) => {
  if (str) displayLog(str);
  displayLog(`version: ${VERSION}`); // 🦕
  Deno.exit(0);
};
