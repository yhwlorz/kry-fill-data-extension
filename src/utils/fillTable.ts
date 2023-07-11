// src/utils/fillTable.ts
import {
  getThElsIndexMap,
  findVisibleElement,
  processTrRowEl,
} from "./tableOperation";

declare global {
  interface Window {
    fillTable: (
      theadClass: string,
      tbodyClass: string,
      fields: { thName: string; tdValue: string }[],
      frameId: number
    ) => void;
  }
}

const fillTable = async (
  theadClass: string,
  tbodyClass: string,
  fields: { thName: string; tdValue: string }[],
  frameId: number
) => {
  //打印fillTable函数全部入参
  console.log("fllTable全部入参：", theadClass, tbodyClass, fields, frameId);

  let error: any = null;
  let stop = false;

  //能收到background的消息，无法收到popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stopIt") {
      console.log("收到收到收到收到收到收到收到收到收到收到收到收到收到");
      stop = true;
    }
  });

  // 定义监听器函数并赋值给一个变量
  const messageListener = function (event: MessageEvent) {
    console.log("Listener is working!", event); // 添加这行代码

    if (event.source !== window) {
      return;
    }

    if (
      event.data.type &&
      event.data.type === "FROM_CONTENT_SCRIPT" &&
      event.data.action === "stopFill"
    ) {
      stop = true;
    }
  };

  try {
    //开始填充数据，发送一个消息给background，表明开始处理填充请求
    chrome.runtime.sendMessage({ action: "fillStart", frameId: frameId });
    //监听停止填充的消息
    //window.addEventListener("stopFill", onStop);
    window.addEventListener("message", messageListener, false);

    let theadEls;
    let tbodyEls;

    if (theadClass !== "") {
      theadEls = Array.from(
        document.querySelectorAll<HTMLElement>(`.${theadClass}`)
      );
    } else {
      theadEls = Array.from(document.getElementsByTagName("thead"));
    }

    if (tbodyClass !== "") {
      tbodyEls = Array.from(
        document.querySelectorAll<HTMLElement>(`.${tbodyClass}`)
      );
    } else {
      tbodyEls = Array.from(document.getElementsByTagName("tbody"));
    }

    //打印theadEls
    console.log("theadEls:", theadEls);

    //TODO 不止一个可用元素
    const theadEl = findVisibleElement(theadEls);
    const tbodyEl = findVisibleElement(tbodyEls);

    if (!theadEl || !tbodyEl) {
      throw new Error("Could not find  thead or tbody");
    }

    //记录表头中指定字段的位置
    const thElsIndexMap = getThElsIndexMap(theadEl, fields);

    //处理表体中的行表体中所有的行 ( const是常量，let是变量 )
    let trRowEls = Array.from(tbodyEl.querySelectorAll("tr"));
    //排除 hidden-row
    trRowEls = trRowEls.filter((trEl) => !trEl.hidden);
    //排除 报损出库前两个row
    trRowEls = trRowEls
      .filter(
        (trRowEl) => !trRowEl.classList.contains("cook-table-placeholder")
      )
      .filter((trRowEl) => trRowEl.getAttribute("aria-hidden") !== "true");

    if (trRowEls.length === 0) {
      throw new Error("Could not find any trRow in tbody");
    }

    //打印tr行数
    console.log("打印tbody.tr行数", trRowEls.length);

    let processedRows = new Set<Node>();
    //逐行填充数据
    for (let trRowEl of trRowEls) {
      // 返回一个新的 Promise
      const resultPromise = new Promise(async (resolve) => {
        // 在这个 Promise 中，我们将处理一行并检查是否已经接收到了"stop"消息
        await processTrRowEl(trRowEl, fields, thElsIndexMap);
        if (stop) {
          resolve("stop");
        } else {
          resolve("continue");
        }
      });

      // 等待这个 Promise 完成
      const result = await resultPromise;
      if (result === "stop") {
        // 如果 Promise 返回了 'stop'，那么我们就退出这个循环
        console.log("filltable发送fillStopped消息。frameId:", frameId);
        chrome.runtime.sendMessage({ action: "fillStopped", frameId: frameId });
        break;
      }

      processedRows.add(trRowEl);
    }

    //监听tbody行数变化，滚动加载
    const observer = new MutationObserver(async (mutationsList) => {
      console.log("执行了observer,打印mutationsList", mutationsList);
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          //打印addedNodes
          console.log("tbody变化后，所有的row", addedNodes.length, addedNodes);
          const newTrRowEls = addedNodes.filter(
            (node) => !processedRows.has(node)
          );
          //打印newRows
          console.log("过滤后的newRows:", newTrRowEls.length, newTrRowEls);
          for (let newTrRowEl of newTrRowEls) {
            //打印newRow对象类型
            console.log(
              "newrow类型",
              newTrRowEl.constructor.name,
              newTrRowEl instanceof HTMLTableRowElement,
              Object.getPrototypeOf(newTrRowEl) ===
                HTMLTableRowElement.prototype
            ); // 输出：HTMLTableRowElement
            if (newTrRowEl instanceof HTMLTableRowElement) {
              await processTrRowEl(newTrRowEl, fields, thElsIndexMap);
              //停止填充
              if (stop) {
                console.log("filltable发送fillStopped消息。frameId:", frameId);
                observer.disconnect(); // 停止 MutationObserver 的观察
                chrome.runtime.sendMessage({
                  action: "fillStopped",
                  frameId: frameId,
                });
                //window.dispatchEvent(new CustomEvent("fillCompleted"));
                return; // 退出 MutationObserver 的回调函数，结束所有循环
              }
              processedRows.add(newTrRowEl);
             
            }
          }
        }
      }

      // 检查 body 是否存在，然后再访问其子元素
      if (tbodyEl) {
        // 检查是否需要滚动加载更多数据
        if (tbodyEl.scrollTop + tbodyEl.clientHeight >= tbodyEl.scrollHeight) {
          // 触发滚动事件
          tbodyEl.scrollTop = tbodyEl.scrollHeight;
        } // ...
      } else {
        throw new Error("tbody is null");
      }
    });

    observer.observe(tbodyEl, { childList: true });
  } catch (e) {
    error = e;
  } finally {
    window.removeEventListener("message", messageListener, false);
    if (error) {
      // window.dispatchEvent(
      //   new CustomEvent("fillError", { detail: error.message })
      // );
      chrome.runtime.sendMessage({
        action: "fillError",
        errorMessage: error.message,
        frameId: frameId,
      });
    } else if (!stop) {
      //window.dispatchEvent(new CustomEvent("fillCompleted"));
      chrome.runtime.sendMessage({ action: "fillCompleted", frameId: frameId });
    }

    //填充数据完成，发送一个消息给background，表明填充请求已处理完毕
    //chrome.runtime.sendMessage({ action: "completed", frameId: frameId });
  }
};

window.fillTable = fillTable;

export default fillTable;
