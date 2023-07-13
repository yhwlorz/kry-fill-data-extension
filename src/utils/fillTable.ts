// src/utils/fillTable.ts
import {
  getThElsIndexMap,
  findVisibleElement,
  processTrRowEl,
  scrollToBottom,
} from "./tableOperation";
import { waitamoment } from "./timerUtil";
import { hashString } from "./hashUtil";

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

let stop = false;
const onStop = () => {
  stop = true;
};

const fillTable = async (
  theadClass: string,
  tbodyClass: string,
  thtdFieldMapList: { thName: string; tdValue: string }[],
  frameId: number
) => {
  //打印fillTable函数全部入参
  console.log(
    "fllTable全部入参：",
    theadClass,
    tbodyClass,
    thtdFieldMapList,
    frameId
  );

  let error: any = null;

  // 定义监听器函数并赋值给一个变量
  const messageListener = function (event: MessageEvent) {
    console.log("Listener is working!", event);
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
  //再定义一个监听器
  const chromeListener = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (request.action === "stopFill" || request.action == "stop") {
      console.log("fillTable收到background的stop消息", request.action, window);
      stop = true;
    }
  };

  try {
    //开始填充数据，发送一个消息给background，表明开始处理填充请求
    chrome.runtime.sendMessage({ action: "fillStart", frameId: frameId });

    //开始监听停止填充的消息
    window.addEventListener("stopFill", onStop);
    window.addEventListener("message", messageListener, false);
    //能收到background的消息，无法收到popup的消息
    chrome.runtime.onMessage.addListener(chromeListener);

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
    const thElsIndexMap = getThElsIndexMap(theadEl, thtdFieldMapList);

    //op(...) 监听器监控dom变化，对新的tr进行填充。由于上方逐行timeout释放执行权，实时渲染。执行到此后tbody已固话。op无法监控到变化。此方法最当前场景无用

    //由于当前页面tr加载的规则是：初次加载51行，填充过程逐渐替换tr。总量始终保持在一定数量。递归拉取tr，过滤重复tr后并填充
    let processedRows: HTMLTableRowElement[] = []; // 使用数组字面量
    //const processedRows = new WeakSet();
    //const processedRows = new Set();
    let depth = 0;
    await dealTrs(
      tbodyEl,
      thtdFieldMapList,
      thElsIndexMap,
      processedRows,
      frameId,
      depth
    );
  } catch (e) {
    error = e;
  } finally {
    console.log("执行了finally");
    window.removeEventListener("stopFill", onStop);
    window.removeEventListener("message", messageListener, false);
    chrome.runtime.onMessage.removeListener(chromeListener);

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

const dealTrs = async (
  tbodyEl: HTMLElement,
  thtdFieldMapList: any,
  thElsIndexMap: any,
  processedRows: HTMLTableRowElement[],
  //processedRows: WeakSet<object>
  //processedRows: Set<unknown>,
  //processedRows: Set<unknown>,
  frameId: number,
  depth: number
) => {
  depth++;
  //处理表体中的行表体中所有的行 ( const是常量，let是变量 )
  let trRowEls = Array.from(tbodyEl.querySelectorAll("tr"));
  //排除 hidden-row
  trRowEls = trRowEls.filter((trEl) => !trEl.hidden);
  //排除 报损出库前两个row
  trRowEls = trRowEls
    .filter((trRowEl) => !trRowEl.classList.contains("cook-table-placeholder"))
    .filter((trRowEl) => trRowEl.getAttribute("aria-hidden") !== "true");

  // if (depth > 1) {
  //   console.log("trRowEls", trRowEls);
  //   console.log("processedRows", processedRows);
  // }

  //过滤已处理过的trEl
  trRowEls = trRowEls.filter((node) => !processedRows.includes(node));
  //trRowEls = trRowEls.filter((node) => !processedRows.has(node));
  //   trRowEls = trRowEls.filter((node) => {
  //     let hash = hashString(node.innerHTML); // 使用元素的HTML内容作为哈希输入
  //     return !processedRows.has(hash);
  // });

  if (trRowEls.length === 0) {
    if (1 == depth) {
      throw new Error("Could not find any trRow in tbody");
    } else {
      return;
    }
  }

  //打印tr行数
  console.log("深度:", depth, ",tbody.tr行数:", trRowEls.length);

  //逐行填充数据
  for (let i = 0; i < trRowEls.length; i++) {
    const trRowEl = trRowEls[i];
    // 返回一个新的 Promise
    const resultPromise = new Promise(async (resolve) => {
      // 在这个 Promise 中，我们将处理一行并检查是否已经接收到了"stop"消息
      await processTrRowEl(trRowEl, thtdFieldMapList, thElsIndexMap);
      await waitamoment(0);

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
      return;
    }

    processedRows.push(trRowEl);
    //processedRows.add(trRowEl);
    // let hash = hashString(trRowEl.innerHTML);
    // processedRows.add(hash);
  }

  await dealTrs(
    tbodyEl,
    thtdFieldMapList,
    thElsIndexMap,
    processedRows,
    frameId,
    depth
  );
};

const op = async (
  tbodyEl: any,
  processedRows: any,
  fields: any,
  thElsIndexMap: any,
  stop: any,
  frameId: any
) => {
  let isScrolling = false;
  let autoScroll = false;

  let observerResolve: any;
  let observerReject: any;
  //监听tbody行数变化，滚动加载。MutationObserver监听 DOM 的变化，并在变化发生时进行相应的操作
  const observerPromise = new Promise((resolve, reject) => {
    observerResolve = resolve;
    observerReject = reject;

    //如果dom始终没有变化，监听将会一直持续。要求，如果dom始终没有变化，等待三秒后结束监听；如果在三秒计时期间发生了变化，等待变化处理完成后，重新计时
    let timeoutId: any = null;
    const TIMEOUT_DURATION = 1500; // 3 秒

    // 用于处理超时的函数
    const handleTimeout = () => {
      // 停止观察
      observer.disconnect();
      observerResolve();
    };

    const observer = new MutationObserver(async (mutationsList) => {
      // 如果之前有一个倒计时正在进行，那么清除它
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      //MutationObserver 的回调函数（在此例中就是你的 observer 变量）会在目标节点或其子节点发生变化时立即触发，而不等待当前或其他 JavaScript 代码块完成。在你的代码中，当你执行 scrollToBottom 函数并尝试滚动 tbodyEl 时，这种滚动很可能会导致 tbodyEl 或其子节点发生改变（比如，加载新的行）。因此，即使 scrollToBottom 函数可能还没有执行完，MutationObserver 的回调函数就可能因此被再次触发。你的目标应该是在滚动结束并且新的行加载完成后，再启动下一轮的 MutationObserver 回调。你可以通过设置一个标志来防止 observer 在 scrollToBottom 运行期间触发
      // 如果正在滚动，不执行 MutationObserver 回调
      if (isScrolling) {
        //return;
      }
      autoScroll = true;
      console.log(
        "执行了observer,打印mutationsList",
        mutationsList.length,
        mutationsList
      );
      let newTrRowCount = 0;
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          if (addedNodes.length == 0) {
            continue;
          }
          //打印addedNodes
          const newTrRowEls = addedNodes.filter(
            (node) => !processedRows.has(node)
          );
          //打印newRows
          //console.log("过滤后的newRows:", newTrRowEls.length, newTrRowEls);
          for (let newTrRowEl of newTrRowEls) {
            //console.log( "newrow类型",newTrRowEl.constructor.name,newTrRowEl instanceof HTMLTableRowElement,Object.getPrototypeOf(newTrRowEl) ===HTMLTableRowElement.prototype);
            if (newTrRowEl instanceof HTMLTableRowElement) {
              newTrRowCount++;
              await processTrRowEl(newTrRowEl, fields, thElsIndexMap);
              //停止填充
              if (stop) {
                console.log("filltable发送fillStopped消息。frameId:", frameId);
                observer.disconnect(); // 停止 MutationObserver 的观察
                observerResolve(); // 或者 observerReject(error)
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
      //await waitamoment(0);

      console.log("tbody变化后,trRow个数", newTrRowCount);
      //根据测试结果来看，可以这样判断。不确定是否有坑
      if (newTrRowCount == 0) {
        observer.disconnect;
        observerResolve(); // 或者 observerReject(error)
        return;
      }

      // isScrolling = true;
      // const hasBeenScrolled = await scrollToBottom(tbodyEl);
      // if (!hasBeenScrolled) {
      //   // 已经滚动到底部或不再需要滚动，停止监听。调用 observer.disconnect() 方法会立即停止监听，并且移除 MutationObserver 对象与目标元素之间的关联。这样可以确保释放资源，避免不必要的内存占用。
      //   observer.disconnect();
      //   console.log("滚动到底，卸载监听");
      // }
      // isScrolling = false;
      // 重新设置倒计时
      timeoutId = setTimeout(handleTimeout, TIMEOUT_DURATION);
    });

    observer.observe(tbodyEl, { childList: true });

    // 初始化倒计时
    timeoutId = setTimeout(handleTimeout, TIMEOUT_DURATION);
  });

  await observerPromise; // 等待观察者完成

  // //手动滚动
  // await waitamoment(200);
  // if (!autoScroll) {
  //   console.log("手动滚动一次");
  //   isScrolling = true;
  //   const hasBeenScrolled = await scrollToBottom(tbodyEl);
  //   if (!hasBeenScrolled) {
  //     observer.disconnect();
  //     console.log("无需滚动，已结束");
  //     isScrolling = false;
  //     return;
  //   } else {
  //     isScrolling = false;
  //   }
  // }
};
