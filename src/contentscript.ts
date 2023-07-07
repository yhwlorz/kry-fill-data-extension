// contentscript.ts
import { findElementInFrames } from './utils/elementFinder';

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("contentScript.ts中的request打印： ", request);

injectScript();
//监听background消息，将插件点击事件转发给injectscript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    (window as any).fillTable(request.headerClass, request.headerName, request.bodyClass, request.inputValue);
  }else if (request.action === "stop") {
    window.dispatchEvent(new CustomEvent("stopFill"));
  }
});

//在使用TypeScript的时候，如果你要为window添加一个自定义事件，你需要扩展WindowEventMap
declare global {
  interface WindowEventMap {
    fillError: CustomEvent; // 添加你的自定义事件
  }
}

//监听injectscript消息，将填充完成事件转发给background
window.addEventListener("fillCompleted", () => {
  chrome.runtime.sendMessage({ action: "completed" });
});

    if (columnIndex === -1) {
      console.error(`Could not find header with name ${headerName}`);
      return;
    }

//监听injectscript消息，将填充错误事件转发给background
window.addEventListener("fillError", (event: CustomEvent) => {
  chrome.runtime.sendMessage({ action: "error", message: event.detail });
});

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"));
      const cell = cells[columnIndex];
      const input = cell.querySelector("input");

      if (input) {
        input.value = inputValue;
      }
    }
  }

  if (request.action === "findElementInFrames") {
    const element = findElementInFrames(window, request.data.selector);
    sendResponse({ result: element });
  }
});
