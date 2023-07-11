interface FrameStatus {
  fillingStatus:
    | "idle"
    | "fillStart"
    | "fillCompleted"
    | "fillStopped"
    | "fillError";
  rebackMessage: string | null;
}

interface TabStatus {
  [frameId: number]: FrameStatus;
}

let tabs: { [tabId: number]: TabStatus } = {};

const resetTab = (tabId: number) => {
  let frames = tabs[tabId];
  if (!frames) {
    frames = {};
    tabs[tabId] = frames;
  }

  for (let frameId in frames) {
    frames[frameId].fillingStatus = "idle";
  }
};

const setIframeFillingStatus = (
  tabId: number,
  iframId: number,
  fillingStatus: FrameStatus["fillingStatus"],
  rebackMessage: FrameStatus["rebackMessage"]
) => {
  if (!tabs[tabId]) {
    tabs[tabId] = {};
  }
  if (!tabs[tabId][iframId]) {
    tabs[tabId][iframId] = {
      fillingStatus: "idle",
      rebackMessage: "idle",
    };
  }
  tabs[tabId][iframId] = {
    fillingStatus: fillingStatus,
    rebackMessage: rebackMessage,
  };
};

//实时返回更新状态
const getIframeFillingStatus = (tabId: number) => {
  let rebackMessages: string[] = [];
  let frames = tabs[tabId];
  for (let frameId in frames) {
    const rebackMessage = `[iframe ${frameId}] ${frames[frameId]
      .rebackMessage!}`;
    rebackMessages.push(rebackMessage);
  }

  return rebackMessages.join("\n");
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

// //记录tabId_iframeId
// chrome.webNavigation.onCommitted.addListener((details) => {
//   if (details.tabId !== -1) {
//     setIframeFillingStatus(details.tabId,details.frameId,"idle",null);
//   }
// });

//Manifest V3跨域填充脚本
chrome.webRequest.onCompleted.addListener(
  (details) => {
    console.log("background_iframe_detail:",details.tabId,details.frameId,details.url);

    //if (details.url.includes("keruyun")) {
      //页面的tabId被设置为-1，以表示它们并不是一个真正的浏览器标签
      if (details.tabId != -1) {
        //插入脚本
        chrome.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          files: ["injectScript.js"],
        });
        //记录tabId_iframeId,填充状态置为idle
        setIframeFillingStatus(details.tabId, details.frameId, "idle", "idle");
      }
    //}
  },
  { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("background监听到消息:", request.action);

  //console.trace("处理消息的线程信息:");

  const sendTabId = sender.tab?.id ?? -1;
  const senderFrameId = sender.frameId ?? -1;

  if (request.action === "fill") {
    resetTab(request.tabId);

    chrome.tabs.sendMessage(request.tabId, request, (response) => {
      //打印填充结果
      console.log("fillResp:", response);
      sendResponse(response);
    });
  } else if (request.action === "stopIt") {
    chrome.tabs.sendMessage(request.tabId, request, (response) => {
      console.log("stopResp:", response);
      sendResponse(response);
    });
  } else {
    if (sendTabId != -1 && senderFrameId != -1) {
      if (request.action === "fillStart") {
        setIframeFillingStatus(sendTabId, senderFrameId, "fillStart", "fillStart");
      } else if (request.action === "fillCompleted") {
        setIframeFillingStatus(sendTabId, senderFrameId, "fillCompleted", "fillCompleted");
      } else if (request.action === "fillError") {
        setIframeFillingStatus(sendTabId,senderFrameId,"fillError",request.errorMessage);
      }else if (request.action === "fillStopped") {
        setIframeFillingStatus(sendTabId,senderFrameId,"fillStopped","fillStopped");
      }
      //发送填充状态到popup
      const rebackMessage = getIframeFillingStatus(sendTabId);
      chrome.runtime.sendMessage({ action: request.action, message: rebackMessage });
    } else {
      console.error("the sendTabId or reqestFrameId is -1");
      console.log("background接收到request:", request.action, request);
      console.log("background接收到sender:", request.action, sender);
    }
  }
  console.log("处理后的 tabs 内容:\n", JSON.stringify(tabs));
});

//使用 chrome.tabs.onRemoved 事件监听器来监测标签页的关闭事件。它的作用是在标签页关闭时，从存储的 tabs 对象中移除对应的标签页信息
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabs[tabId]) {
    delete tabs[tabId];
  } else {
    console.log("Tab with ID: " + tabId + " does not exist.");
  }
});

export {};

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("background接收到request：", request);
//   if (request.action === "fill" || request.action === "stop") {
//     chrome.tabs.query({}, (tabs) => {
//       console.log("所有标签页信息：", tabs);
//     });

//     if (request.tabId) {
//       chrome.tabs.sendMessage(request.tabId, request, (response) => {
//         sendResponse(response);
//       });
//     }
//   } else if (request.action === "completed" || request.action === "error") {
//     chrome.runtime.sendMessage(request);
//   }
//   return true;
// });

//app.tsx中直接传递标签页id，取代从background中查询活跃标签页
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   //打印request
//   console.log("background接收到request：",request);
//   if (request.action === "fill" || request.action === "stop") {
//     chrome.tabs.query({}, (tabs) => {
//       console.log("所有标签页信息：", tabs);
//     });
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       console.log("活跃tab打印： ", tabs);
//       if (tabs[0] && tabs[0].id) {
//         chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
//           sendResponse(response);
//         });
//       }
//     });
//   } else if (request.action === "completed" || request.action === "error") {
//     // 当收到 "completed" 或 "error" 消息时，转发给 app (popup)
//     chrome.runtime.sendMessage(request);
//   }
//   return true; // 返回true，表明异步响应将会被发送
// });

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
