// src/background.ts
export {};

chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        let request = {
          action: "fill",
          selector: ".fill-target",
          value: "100",
          pageSize: 50,
        };
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  }
});

//背景脚本是插件的事件处理程序，可以监听浏览器的各种事件。但它不能直接访问网页的 DOM。如果需要访问和操作 DOM，需要通过内容脚本来实现。

//以上代码首先监听了 onInstalled 事件，当插件被安装时打印一条消息。然后，监听来自内容脚本的消息。当接收到一个动作为 "fill" 的消息时，查询当前窗口的当前激活的标签页，并向其发送消息。
