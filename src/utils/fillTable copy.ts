// src/utils/fillTable.ts
import { simulateInput } from "./simulateInput";
import { normalizeString } from "./stringUtils";

declare global {
  interface Window {
    fillTable: (
      theadClass: string,
      tbodyClass: string,
      fields: { thName: string; tdValue: string }[]
    ) => void;
  }
}

//查找表头元素位置
const findElementWithText = (
  node: Node,
  text: string,
  exactText: boolean
): Node | null => {
  if (
    node.nodeType === Node.TEXT_NODE &&
    (exactText
      ? normalizeString(node.textContent || "") === normalizeString(text)
      : normalizeString(node.textContent || "").includes(normalizeString(text)))
  ) {
    return node;
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findElementWithText(node.childNodes[i], text, exactText);
    if (found) {
      return found;
    }
  }

  return null;
};

const headerIndex = (
  thEls: HTMLTableCellElement[],
  thName: string
): number => {
  let exactMatchIndex = thEls.findIndex(
    (th) => findElementWithText(th, thName, true) !== null
  );

  if (exactMatchIndex !== -1) {
    // 找到了精确匹配的表头
    return exactMatchIndex;
  } else {
    let partialMatches = thEls.filter(
      (th) => findElementWithText(th, thName, false) !== null
    );

    if (partialMatches.length === 1) {
      // 只有一个部分匹配的表头
      return thEls.indexOf(partialMatches[0]);
    } else if (partialMatches.length > 1) {
      // 有多个部分匹配的表头
      throw new Error(
        `Multiple th include name "${thName}", please refine your input.`
      );
    } else {
      // 没有找到匹配的表头
      throw new Error(`Could not find th with name "${thName}"`);
    }
  }
};

//查找表体中可编辑元素
const findEditableElement = (node: Node): HTMLElement | null => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    if (
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.contentEditable === "true"
    ) {
      return element;
    }
  }

  let deepestElement: HTMLElement | null = null;

  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findEditableElement(node.childNodes[i]);
    if (found) {
      return found;
    }

    if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
      const childElement = node.childNodes[i] as HTMLElement;
      if (!deepestElement || childElement.contains(deepestElement)) {
        deepestElement = childElement;
      }
    }
  }

  return deepestElement;
};



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

    let theadEl: HTMLElement | null = null;
    let tbodyEl: HTMLElement | null = null;

    // 找到真正可见的header和body
    const isVisible = (element: HTMLElement) => {
      // 检查元素是否真正可见 。在可见性检查函数 isVisible 中检查元素的 offsetParent 属性。如果元素是隐藏的，那么 offsetParent 将是 null。
      return element.offsetParent !== null;
    };
    for (let i = 0; i < theadEls.length; i++) {
      if (isVisible(theadEls[i])) {
        theadEl = theadEls[i];
        break;
      }
    }
    for (let i = 0; i < tbodyEls.length; i++) {
      if (isVisible(tbodyEls[i])) {
        tbodyEl = tbodyEls[i];
        break;
      }
    }

    if (!theadEl || !tbodyEl) {
      throw new Error("Could not find  thead or tbody");
    }

    //记录表头中指定字段的位置
    let columnIndexMap: { [key: string]: number } = {};

    const thEls = Array.from(theadEl.querySelectorAll("th"));

    for (let field of fields) {
      //如果field.headerName的值为空字符串，则继续下一次循环
      if (!field.thName) {
        continue;
      }
      const columnIndex = headerIndex(thEls, field.thName);

      columnIndexMap[field.thName] = columnIndex;
    }

    let processedRows = new Set<Node>();

    //逐行填充函数
    const processRow = async (row: Element) => {
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
        return;
      }
      const cells = Array.from(row.querySelectorAll("td"));

      //打印第一个字段的名字
      console.log(
        "行：cell[0,1,2]",
        cells[0].textContent,
        cells[1].textContent,
        cells[2].textContent,
        cells[3].textContent
      );
      for (let field of fields) {
        const cell = cells[columnIndexMap[field.thName]];

        if (cell) {
          const editableEl = findEditableElement(cell);
          //打印可编辑元素el
          console.log("可编辑元素el:", editableEl);
          if (editableEl) {
            await simulateInput(editableEl, field.tdValue);
          }
        }
      }
    };

    //处理表体中的行表体中所有的行 ( const是常量，let是变量 )
    let initialRows = Array.from(tbodyEl.querySelectorAll("tr"));
    //排除initialRows中属性为hidden的行并更新initialRows数组
    initialRows = initialRows.filter((row) => !row.hidden);
    //适用于报损出库的两项排除
    //排除initialRows中class值为cook-table-placeholder的行，除initialRows中aria-hidden属性值为true的行,并更新initialRows数组
    initialRows = initialRows
      .filter((row) => !row.classList.contains("cook-table-placeholder"))
      .filter((row) => row.getAttribute("aria-hidden") !== "true");

    //判断initialRows中是否有数据,没有数据则抛出异常
    if (initialRows.length === 0) {
      throw new Error("Could not find any rows in tbody");
    }

    //打印row行数
    console.log("打印row行数", initialRows.length);

    for (let row of initialRows) {
      await processRow(row);
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
        break;
      }
      processedRows.add(row);
    }

    const observer = new MutationObserver(async (mutationsList) => {
      console.log("执行了observer,打印mutationsList", mutationsList);
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const newRows = addedNodes.filter((node) => !processedRows.has(node));
          //打印newRows
          console.log("newRows:", newRows);
          for (let row of newRows) {
            if (row instanceof Element) {
              await processRow(row);
              processedRows.add(row);
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