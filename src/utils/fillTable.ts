// src/utils/fillTable.ts
import { simulateInput } from "./simulateInput";

declare global {
  interface Window {
    fillTable: (
      headerClass: string,
      headerName: string,
      bodyClass: string,
      inputValue: string
    ) => void;
  }
}

const findElementWithText = (node: Node, text: string): Node | null => {
  //打印node
  console.log("findElementWithTextnode:", node);
  if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === text) {
    return node;
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findElementWithText(node.childNodes[i], text);
    if (found) {
      return found;
    }
  }

  return null;
};

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
  headerName: string,
  bodyClass: string,
  inputValue: string
) => {
  let error: any = null;
  let stop = false;
  const onStop = () => {
    stop = true;
  };

  try {
    //打印fillTable函数全部入参
    console.log(
      "fllTable全部入参：",
      headerClass,
      headerName,
      bodyClass,
      inputValue
    );

    window.addEventListener("stopFill", onStop);

    const header = document.querySelector(`.${headerClass}`);
    const body = document.querySelector(`.${bodyClass}`);

    if (!header || !body) {
      throw new Error("Could not find table header or body");
    }

    const headers = Array.from(header.querySelectorAll("th"));
    //打印headers
    console.log("headers:", headers);
    const columnIndex = headers.findIndex(
      (th) => findElementWithText(th, headerName) !== null
    );
    //打印columnIndex
    console.log("columnIndex:", columnIndex);
    if (columnIndex === -1) {
      throw new Error(`Could not find header with name "${headerName}"`);
    }

    let processedRows = new Set<Node>();

    const processRow = async (row: Element) => {
      if (stop) {
        window.dispatchEvent(new CustomEvent("fillCompleted"));
        return;
      }
      const cells = Array.from(row.querySelectorAll("td"));
      const cell = cells[columnIndex];
      if (cell) {
        const el = findEditableElement(cell);
        if (el) {
          await simulateInput(el, inputValue);
        }
      }

      //临时将成本单价赋值
      const cell2 = cells[columnIndex + 5];
      if (cell2) {
        const el2 = findEditableElement(cell2);
        if (el2) {
          await simulateInput(el2, "1");
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

      // 检查是否需要滚动加载更多数据
      if (body.scrollTop + body.clientHeight >= body.scrollHeight) {
        // 触发滚动事件
        body.scrollTop = body.scrollHeight;
      }
    });

    const initialRows = Array.from(body.querySelectorAll("tr"));
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
