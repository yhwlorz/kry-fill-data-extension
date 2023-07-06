// src/contentscript.ts

import { injectScript } from './injectScript';

injectScript();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    (window as any).fillTable(request.headerClass, request.headerName, request.bodyClass, request.inputValue);
  }else if (request.action === "stop") {
    window.dispatchEvent(new CustomEvent("stopFill"));
  }
});

window.addEventListener("fillCompleted", () => {
  chrome.runtime.sendMessage({ action: "completed" });
});


//在使用TypeScript的时候，如果你要为window添加一个自定义事件，你需要扩展WindowEventMap
declare global {
  interface WindowEventMap {
    fillError: CustomEvent; // 添加你的自定义事件
  }
}
//转发错误事件
window.addEventListener("fillError", (event: CustomEvent) => {
  chrome.runtime.sendMessage({ action: "error", message: event.detail });
});

//首先是内容脚本（Content Script）。内容脚本可以访问和操作网页的 DOM，但它不能直接访问页面的 JavaScript 变量和函数。同样，它也不能直接访问插件的 background 脚本，但可以通过 Chrome 的消息传递 API 和 background 脚本进行通信。

//以上代码首先导入并执行了 injectScript 函数，将 findAndFill 函数注入到了页面的上下文中。然后，监听来自 background 脚本的消息。当接收到一个动作为 "fill" 的消息时，调用 findAndFill 函数。