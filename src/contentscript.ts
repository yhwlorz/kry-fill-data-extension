// src/contentscript.ts

//监听background消息，将插件点击事件转发给injectscript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    //在contentscript中打印request
    console.log("contentscript中打印request，sender:",request,sender);
    //关于 (window as any).fillTable(...) 这部分，如果你在其他地方定义了 fillTable，并确保它被正确地添加到 window 对象上，那么你就可以直接在 TypeScript 中调用 window.fillTable(...)。如果没有定义 fillTable，这可能会导致运行时错误。如果 fillTable 函数是在 injectScript.js 中定义的，你需要确保 injectScript.js 脚本在你的 content script 之前执行。否则，当你的 content script 试图访问 window.fillTable 时，可能会找不到这个函数。
    (window as any).fillTable(
      request.theadClass,
      request.tbodyClass,
      request.fields,
      sender.frameId
    );
  } else if (request.action === "stop") {
    //(window as any).fillStop(sender.frameId); 新增一个fillstop函数的方案不行，js要先处理完filltable才处理fillstop函数
    window.postMessage({ type: "FROM_CONTENT_SCRIPT", action: "stopFill" }, "*");
    //window.dispatchEvent(new CustomEvent("stopFill"));
  }
});

// //监听injectscript消息，将填充完成事件转发给background
// window.addEventListener("fillCompleted", () => {
//   chrome.runtime.sendMessage({ action: "completed" });
// });

// //监听injectscript消息，将填充错误事件转发给background
// window.addEventListener("fillError", ((event: CustomEvent) => {
//   chrome.runtime.sendMessage({ action: "error", message: event.detail });
// }) as (ev: Event) => void);//这里，as (ev: Event) => void 告诉 TypeScript，你确定这个函数可以接受任何 Event，即使它实际上只处理 CustomEvent。注意，这样做可能会导致运行时错误，如果 fillError 事件不总是 CustomEvent 的实例。因此，如果你能确保所有的 fillError 事件都是 CustomEvent，那么这种方法应该是安全的。

//这个语句不会实际导出任何东西，但它会让 TypeScript 将这个文件视为模块，而不是全局脚本。
export {};


//首先是内容脚本（Content Script）。内容脚本可以访问和操作网页的 DOM，但它不能直接访问页面的 JavaScript 变量和函数。同样，它也不能直接访问插件的 background 脚本，但可以通过 Chrome 的消息传递 API 和 background 脚本进行通信。

//以上代码首先导入并执行了 injectScript 函数，将 findAndFill 函数注入到了页面的上下文中。然后，监听来自 background 脚本的消息。当接收到一个动作为 "fill" 的消息时，调用 findAndFill 函数。
