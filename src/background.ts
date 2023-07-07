export {};

chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill" || request.action === "stop") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("tabs打印： ", tabs);
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      }
    });
  } else if (request.action === "completed" || request.action === "error") {
    // 当收到 "completed" 或 "error" 消息时，转发给 app (popup)
    chrome.runtime.sendMessage(request);
  }
  return true;  // 返回true，表明异步响应将会被发送
});

chrome.browserAction.onClicked.addListener((tab) => {
  console.log("The extension icon is clicked");
  if (tab.id !== undefined) {
    chrome.tabs.executeScript(tab.id, { file: "injectScript.js" });
  }
});


//Chrome的插件架构使得content script（注入到web页面的脚本）不能直接与popup（插件弹出窗口）通信。他们都可以与background script（插件后台页面）通信，但是他们之间不能直接交流。这意味着你必须通过background script来实现content script和popup之间的通信。