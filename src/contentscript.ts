// src/contentscript.ts

import { injectScript } from './injectScript';

injectScript();

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "fill") {
//     (window as any).findAndFill(request.selector, request.value, request.pageSize);
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    (window as any).fillTable(request.headerClass, request.headerName, request.bodyClass, request.inputValue);
  }
});




//首先是内容脚本（Content Script）。内容脚本可以访问和操作网页的 DOM，但它不能直接访问页面的 JavaScript 变量和函数。同样，它也不能直接访问插件的 background 脚本，但可以通过 Chrome 的消息传递 API 和 background 脚本进行通信。

//以上代码首先导入并执行了 injectScript 函数，将 findAndFill 函数注入到了页面的上下文中。然后，监听来自 background 脚本的消息。当接收到一个动作为 "fill" 的消息时，调用 findAndFill 函数。