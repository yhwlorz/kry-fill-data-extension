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
      fields: { thName: string; tdValue: string }[]
    ) => void;
  }
}

const fillTable = async (
  theadClass: string,
  tbodyClass: string,
  fields: { thName: string; tdValue: string }[]
) => {
  //打印fillTable函数全部入参
  console.log("fllTable全部入参：", theadClass, tbodyClass, fields);

  let error: any = null;
  let stop = false;
  const onStop = () => {
    stop = true;
  };

  try {
    window.addEventListener("stopFill", onStop);

    const theadEls = Array.from(
      document.querySelectorAll<HTMLElement>(`.${theadClass}`)
    );
    const tbodyEls = Array.from(
      document.querySelectorAll<HTMLElement>(`.${tbodyClass}`)
    );

    //打印theadEls
    console.log("theadEls:", theadEls);

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
      await processTrRowEl(trRowEl, fields, thElsIndexMap);
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
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
          const newTrRowEls = addedNodes.filter(
            (node) => !processedRows.has(node)
          );
          //打印newRows
          console.log("newRows:", newTrRowEls);
          for (let newTrRowEl of newTrRowEls) {
            if (newTrRowEl instanceof Element) {
              await processTrRowEl(newTrRowEl, fields, thElsIndexMap);
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
    window.removeEventListener("stopFill", onStop);
    if (error) {
      window.dispatchEvent(
        new CustomEvent("fillError", { detail: error.message })
      );
    } else if (!stop) {
      window.dispatchEvent(new CustomEvent("fillCompleted"));
    }
  }
};

window.fillTable = fillTable;

export default fillTable;
