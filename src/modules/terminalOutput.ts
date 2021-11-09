/**
 * ANSI转义序列控制显示信息
 */

/**
 * 文字输出
 */
export const TerminalOutput = () => {
  const id = Number(Math.random().toString().substr(2)).toString(16);

  /**
   * 光标偏移量
   */
  let cursorOffset = 0;

  /**
   * 输出信息
   * @param str
   */
  const print = (str: string) => {
    const text = new TextEncoder().encode(
      `\x1b[${cursorOffset}D \x1b[K ${str}`
    );
    Deno.stdout.writeSync(text);
    cursorOffset = text.length;
  };

  /**
   * 输出空行
   */
  const printNewLine = () =>
    Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[0C \x1b[K\r\n`));

  /**
   * 移动光标
   * \x1b[nM 上移n格，\x1b[nB 下移n格，\x1b[nC 右移n列，\x1b[nD 左移n列，\x1b[nE 光标下移n行，\x1b[nF 光标上移n行
   * @param direction "up" | "down" | "left" | "right" | "upLine" | "downLine" 代表ABCDEF
   * @param lineColumnNum 移动行或列数
   */
  const moveCursor = (
    direction:
      | "up"
      | "down"
      | "left"
      | "right"
      | "upLine"
      | "downLine"
      | "reset",
    lineColumnNum = 1
  ) => {
    enum directionlist {
      up = "A",
      down = "B",
      left = "C",
      right = "D",
      upLine = "E",
      downLine = "F",
    }

    let command = "";
    console.log("cursorOffset", cursorOffset);

    if (direction === "reset") command = `\x1b[${cursorOffset}C`;
    else command = `\x1b[${lineColumnNum}${directionlist[direction]}`;
    Deno.stdout.writeSync(new TextEncoder().encode(command));
  };

  /**
   * 清理当前行 \x1b[nK
   * @param n n为0或缺少，清除从光标到行尾内容；n为1，清除从光标到行首的内容；n为2，清除当前行，光标位置不变
   */
  const clear = (n = 2) => {
    Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${n}K`));
  };

  /**
   * 清屏 \x1b[nJ
   * @param n n为0，清除光标以下区域；n为1，清除光标以上区域；n为2，清空全部
   */
  const clearScreen = (n = 2) =>
    Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${n}J`));

  return {
    id,
    print,
    printNewLine,
    moveCursor,
    clear,
    clearScreen,
  };
};

/**
 * 输出等待提示语
 */
export const WaitPrompt = () => {
  const id = Number(Math.random().toString().substr(2)).toString(16);
  const interval = 100;
  const output = TerminalOutput();
  let timeoutID = 0;
  let loopNum = 0;
  let isStart = false;

  /**
   * 原始文本
   */
  let rawText = "";
  /**
   * 输出的文本
   */
  let text = "";
  /**
   * 动效的模式
   */
  let mode: string;
  /**
   * 循环追加文本
   */
  let appendText = "";
  let appendTotalLength = 0;
  let curAppendLength = 0;

  const timer = () => {
    timeoutID = setTimeout(() => {
      loopNum++;
      if (mode === "appendText") appendTextMode(loopNum);
      output.print(text);
      if (isStart) timer();
    }, interval);
  };

  const appendTextMode = (loopNum: number) => {
    if (appendTotalLength && curAppendLength >= appendTotalLength) {
      text = rawText;
      curAppendLength = 0;
    } else {
      if (loopNum % 3 === 0) {
        text += appendText;
        curAppendLength++;
      }
    }
  };

  /**
   * 开始显示
   * @param str
   * @param option
   */
  const start = (
    str: string,
    option: false | { mode: "appendText"; len: number; text: string } = false
  ) => {
    isStart = true;
    if (option) {
      mode = option.mode;
      if (option.mode === "appendText") {
        appendTotalLength = option.len;
        appendText = option.text;
      }
    }
    updateText(str);
    // 第一次输出
    output.print(text);
    timer();
  };

  /**
   * 停止显示
   */
  const stop = () => {
    clearTimeout(timeoutID);
    isStart = false;
    loopNum = 0;
    output.clear();
    output.printNewLine();
  };

  /**
   * 清理目前显示信息
   */
  const clear = () => {
    clearTimeout(timeoutID);
    isStart = false;
    loopNum = 0;
    output.clearScreen();
  };

  /**
   * 更新文本
   * @param str
   */
  const updateText = (str: string) => {
    rawText = `${str} `;
    text = `${str} `;
  };

  return {
    id,
    timer,
    updateText,
    start,
    clear,
    stop,
  };
};
