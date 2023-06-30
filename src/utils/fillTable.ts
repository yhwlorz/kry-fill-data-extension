// fillTable.ts
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
  const header = document.querySelector(`.${headerClass}`);
  const body = document.querySelector(`.${bodyClass}`);

  //打印fillTable函数全部入参
  console.log(
    "fllTable全部入参：",
    headerClass,
    headerName,
    bodyClass,
    inputValue
  );

  if (!header || !body) {
    console.error("Could not find table header or body");
    return;
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
    console.error(`Could not find header with name "${headerName}"`);
    return;
  }

  let processedRows = new Set<Node>();

  const processRow = async (row: Element) => {
    const cells = Array.from(row.querySelectorAll("td"));
    const cell = cells[columnIndex];
    if (cell) {
      const el = findEditableElement(cell);
      if (el) {
        await simulateInput(el, inputValue);
      }
    }

    //临时将成本单价赋值
    const cell2 = cells[columnIndex+5];
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
    processedRows.add(row);
  }

  observer.observe(body, { childList: true });

  // const rows = Array.from(body.querySelectorAll("tr"));
  // //打印rows
  // console.log("rows:", rows);

  // //在JavaScript中，当你在forEach的回调函数中使用async关键字时，这些回调函数会并发（并行）地运行，而不是串行地运行。这意味着forEach不会等待每个回调函数完成，而是立即启动下一个回调函数
  // //rows.forEach(async (row) => {
  
  // //如果你需要等待所有的回调函数完成，你应该使用Promise.all方法，或者使用for...of循环。这两种方法都会等待所有的回调函数完成。例如：
  // //for(const row of rows){
  // await Promise.all(rows.map(async (row) => {
  //   const cells = Array.from(row.querySelectorAll("td"));
  //   //打印cells
  //   console.log("cells:", cells);
  //   //如果cells为空，直接返回
  //   if (cells.length === 0) return;
  //   const cell = cells[columnIndex];
  //   //打印cell
  //   console.log("cell:", cell);
  //   if (cell) {
  //     const el = findEditableElement(cell);
  //     //打印editable
  //     console.log("editable:", el);
  //     if (el) {
  //       const content = inputValue;
  //       //填充数据
  //       await simulateInput(el, content);
  //     }

  //         //临时将成本单价赋值
  //   const cell2 = cells[columnIndex+5];
  //   if (cell2) {
  //     const el2 = findEditableElement(cell2);
  //     if (el2) {
  //       await simulateInput(el2, "1");
  //     }}
  //   }
  // }));

  // console.log("填充完成！");



};

window.fillTable = fillTable;

export default fillTable;
