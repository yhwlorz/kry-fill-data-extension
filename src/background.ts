export {};

chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("background.ts中的request打印： ", request);
  if (request.action === "fill") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("tabs打印： ", tabs);
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      }
    });
  }
  return true;  // 返回true，表明异步响应将会被发送
});

chrome.browserAction.onClicked.addListener((tab) => {
  console.log("The extension icon is clicked");
  if (tab.id !== undefined) {
    chrome.tabs.executeScript(tab.id, { file: "injectScript.js" });
  }
});
