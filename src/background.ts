import fillTable from './utils/fillTable';



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
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["injectScript.js"],
    });
  }
});

//Manifest V3跨域填充脚本
chrome.webRequest.onCompleted.addListener(
  (details) => {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      files: ['injectScript.js'],
    });
  },
  { urls: ['<all_urls>'], types: ['main_frame', 'sub_frame'] }
);



// // 监听来自content script的消息
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   // 如果收到的是fetch请求
//   if (request.type === 'fetch') {
//     // 发起fetch请求
//     fetch(request.url, {
//       headers: request.headers,
//       method: request.method,
//       body: request.body
//     })
//       .then(response => {
//         // 处理响应
//         return response.text().then(text => ({ text, response }));
//       })
//       .then(({ text, response }) => {
//         // 发送响应
//         sendResponse([{
//           body: text,
//           status: response.status,
//           statusText: response.statusText,
//         }, null]);
//       })
//       .catch(error => {
//         // 发送错误
//         sendResponse([null, error]);
//       });

//     return true; // 告知响应将异步处理
//   }
// });

// // 监听网络请求
// chrome.webRequest.onBeforeRequest.addListener(
//   (details) => {
//     // 在这里处理跨域请求，具体实现取决于你的需求
//   },
//   { urls: ["<all_urls>"] },
//   { blocking: true }
// );

//Chrome的插件架构使得content script（注入到web页面的脚本）不能直接与popup（插件弹出窗口）通信。他们都可以与background script（插件后台页面）通信，但是他们之间不能直接交流。这意味着你必须通过background script来实现content script和popup之间的通信。