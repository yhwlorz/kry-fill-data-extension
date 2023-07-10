chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //打印request
  console.log("background接收到request：",request);
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
  return true; // 返回true，表明异步响应将会被发送
});

//Manifest V3跨域填充脚本
chrome.webRequest.onCompleted.addListener(
  (details) => {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      files: ["injectScript.js"],
    });
  },
  { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] }
);

export {};

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
