// src/utils/fillTable.ts
import { simulateInput } from "./simulateInput";
import { normalizeString } from "./stringUtils";

declare global {
  interface Window {
    fillTable: (
      headerClass: string,
      bodyClass: string,
      fields: { headerName: string; inputValue: string }[]
    ) => void;
  }
}

//查找表头元素位置
const findElementWithText = (
  node: Node,
  text: string,
  exactText: boolean
): Node | null => {
  //打印node
  console.log("findElementWithTextnode:", node);
  //打印normalizeString(node.textContent || "")
  console.log("normalizeString[node.textContent ]", normalizeString(node.textContent || ""));
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
  headerThs: HTMLTableCellElement[],
  headerName: string
): number => {
  let exactMatchIndex = headerThs.findIndex(
    (th) => findElementWithText(th, headerName, true) !== null
  );

  if (exactMatchIndex !== -1) {
    // 找到了精确匹配的表头
    return exactMatchIndex;
  } else {
    let partialMatches = headerThs.filter(
      (th) => findElementWithText(th, headerName, false) !== null
    );

    if (partialMatches.length === 1) {
      // 只有一个部分匹配的表头
      return headerThs.indexOf(partialMatches[0]);
    } else if (partialMatches.length > 1) {
      // 有多个部分匹配的表头
      throw new Error(
        `Multiple headers include name "${headerName}", please refine your input.`
      );
    } else {
      // 没有找到匹配的表头
      throw new Error(`Could not find header with name "${headerName}"`);
    }
  }
};

//查找表体中可编辑元素
const findEditableElement = (node: Node): HTMLElement | null => {
  //打印node
  console.log("findEditableElementnode:", node);
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
  headerClass: string,
  bodyClass: string,
  fields: { headerName: string; inputValue: string }[]
  //headerName: string,
  //inputValue: string
) => {
  let error: any = null;
  let stop = false;
  const onStop = () => {
    stop = true;
  };

  try {
    //打印fillTable函数全部入参
    console.log("fllTable全部入参：", headerClass, bodyClass, fields);

    window.addEventListener("stopFill", onStop);

    const headers = Array.from(
      document.querySelectorAll<HTMLElement>(`.${headerClass}`)
    );
    const bodies = Array.from(
      document.querySelectorAll<HTMLElement>(`.${bodyClass}`)
    );

    //打印headers
    console.log("headers:", headers);

    let header: HTMLElement | null = null;
    let body: HTMLElement | null = null;

    // 检查元素是否真正可见 。在可见性检查函数 isVisible 中检查元素的 offsetParent 属性。如果元素是隐藏的，那么 offsetParent 将是 null。
    const isVisible = (element: HTMLElement) => {
      return element.offsetParent !== null;
    };

    // 找到真正可见的header和body
    for (let i = 0; i < headers.length; i++) {
      if (isVisible(headers[i])) {
        //打印i+1
        console.log("head i+1:", i + 1);
        header = headers[i];
        break;
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      if (isVisible(bodies[i])) {
        //打印i+1
        console.log("body i+1:", i + 1);
        body = bodies[i];
        break;
      }
    }

    if (!header || !body) {
      throw new Error("Could not find table header or body");
    }

    //记录表头中指定字段的位置
    let columnIndexMap: { [key: string]: number } = {};

    const headerThs = Array.from(header.querySelectorAll("th"));

    for (let field of fields) {
      //如果field.headerName的值为空字符串，则继续下一次循环
      if (!field.headerName) {
        continue;
      }
      const columnIndex = headerIndex(headerThs, field.headerName);

      //  = headerThs.findIndex(
      //   (th) => findElementWithText(th, field.headerName) !== null
      // );

      // if (columnIndex === -1) {
      //   throw new Error(
      //     `Could not find header with name "${field.headerName}"`
      //   );
      // }

      columnIndexMap[field.headerName] = columnIndex;
    }

    let processedRows = new Set<Node>();

    //逐行填充函数
    const processRow = async (row: Element) => {
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
        return;
      }
      const cells = Array.from(row.querySelectorAll("td"));

      for (let field of fields) {
        const cell = cells[columnIndexMap[field.headerName]];

        if (cell) {
          const el = findEditableElement(cell);
          //打印可编辑元素el
          console.log("可编辑元素el:", el);
          if (el) {
            await simulateInput(el, field.inputValue);
          }
        }
      }
    };

    const observer = new MutationObserver(async (mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const newRows = addedNodes.filter((node) => !processedRows.has(node));
          for (let row of newRows) {
            if (row instanceof Element) {
              await processRow(row);
              processedRows.add(row);
            }
          }
        }
      }

      // 检查 body 是否存在，然后再访问其子元素
      if (body) {
        // 检查是否需要滚动加载更多数据
        if (body.scrollTop + body.clientHeight >= body.scrollHeight) {
          // 触发滚动事件
          body.scrollTop = body.scrollHeight;
        } // ...
      } else {
        throw new Error("Body is null");
      }
    });

    //表体中所有的行 const是常量，let是变量
    let initialRows = Array.from(body.querySelectorAll("tr"));
    //排除initialRows中属性为hidden的行并更新initialRows数组
    initialRows = initialRows.filter((row) => !row.hidden);

    //适用于报损出库的两项排除
    //排除initialRows中class值为cook-table-placeholder的行，除initialRows中aria-hidden属性值为true的行,并更新initialRows数组
    initialRows = initialRows
      .filter((row) => !row.classList.contains("cook-table-placeholder"))
      .filter((row) => row.getAttribute("aria-hidden") !== "true");

    //判断initialRows中是否有数据,没有数据则抛出异常
    if (initialRows.length === 0) {
      throw new Error("Could not find any rows in table body");
    }
    for (let row of initialRows) {
      await processRow(row);
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
        break;
      }
      processedRows.add(row);
    }

    observer.observe(body, { childList: true });
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
