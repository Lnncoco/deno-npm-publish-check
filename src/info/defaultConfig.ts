import type { CONFIG } from "./config.d.ts";

// deno-lint-ignore no-unused-vars
const CONFIG: CONFIG = {
  checkTags: ["latest"],
  git: {
    cookie: "",
    template: "http://git/{{name}}/-/raw/{{branch}}/package.json",
  },
  jenkins: {
    token: "",
    cookie: "",
    // 模板语法有两种 1. 普通的变量替换 {{变量名}}  2. 拼接变量名的参数替换 {{=变量名}}
    // 比如 "http://Jenkins/job/{{name}}/build?{{=cause}}" name为test,cause为t1, 替换后会变成 http://Jenkins/job/test/build?cause=t1
    template: "http://Jenkins/job/{{name}}/build",
    cause: "脚本构建",
  },
  package: {
    packageName1: {
      latest: {
        git: {
          // 其中所有的值会与模板中定义的变量匹配替换
          name: "git-packagename",
          branch: "develop",
        },
        jenkins: {
          // 除了 url cookie 保留关键字, 其余所有的值会与模板中定义的变量匹配替换
          name: "jenkins-packagename-develop",
        },
      },
    },
    packageName2: {
      latest: {
        git: "http://git/packageName2/-/raw/develop/package.json", // 局部配置存在url 会用局部url 不能使用模板变量
        jenkins: {
          url: "http://Jenkins/job/jenkins-packageName2-develop/build", // 局部配置存在url 会用局部url 不能使用模板变量
          token: "token", // 存在token时 会自动拼接token 不存在在只访问url不会读取全局Jenkins配置
        },
      },
      stable: {
        git: "http://git/packageName2/-/raw/master/package.json",
        jenkins: {
          url: "http://Jenkins/job/jenkins-packageName2-master/build?token=token", // 简写方式
        },
      },
    },
    packageName3: {
      latest: {
        git: "http://git/packageName3/-/raw/develop/package.json",
        // 没有jenkins字段则不会触发jenkins逻辑
      },
    },
  },
};

export default `{
  "checkTags": ["latest"],
  "git": {
    "template": "http://git/{{name}}/-/raw/{{branch}}/package.json",
    "cookie": ""
  },
  "jenkins": {
    "token": "",
    "cookie": "",
    // 模板语法有两种 1. 普通的变量替换 {{变量名}}  2. 拼接变量名的参数替换 {{=变量名}}
    // 比如 "http://Jenkins/job/{{name}}/build?{{=cause}}" name为test,cause为t1, 替换后会变成 http://Jenkins/job/test/build?cause=t1
    "template": "http://Jenkins/job/{{name}}/build",
    "cause": "脚本构建"
  },
  "package": {
    "packageName1": {
      "latest": {
        "git": {
          // 其中所有的值会与模板中定义的变量匹配替换
          "name": "git-packagename",
          "branch": "develop"
        },
        "jenkins": {
          // 除了 url cookie 保留关键字, 其余所有的值会与模板中定义的变量匹配替换
          "name": "jenkins-packagename-develop"
        }
      }
    },
    "packageName2": {
      "latest": {
        "git": "http://git/packageName2/-/raw/develop/package.json", // 局部配置存在url 会用局部url 不能使用模板变量
        "jenkins": {
          "url": "http://Jenkins/job/jenkins-packageName2-develop/build", // 局部配置存在url 会用局部url 不能使用模板变量
          "token": "token" // 存在token时 会自动拼接token 不存在在只访问url不会读取全局Jenkins配置
        }
      },
      "stable": {
        "git": "http://git/packageName2/-/raw/master/package.json",
        "jenkins": {
          "url": "http://Jenkins/job/jenkins-packageName2-master/build?token=token" // 简写方式
        }
      }
    },
    "packageName3": {
      "latest": {
        "git": "http://git/packageName3/-/raw/develop/package.json"
        // 没有jenkins字段则不会触发jenkins逻辑
      }
    }
  }
}
`;
