// src/utils/fillTable.ts

//导入elementFromPoint.ts中的findElement
import { findElement } from "./elementFinder";

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
  //打印node.nodeType
  console.log(
    "node.nodeType打印：",
    node.nodeType,
    node.nodeType === Node.TEXT_NODE,
    node.textContent
  );
  if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === text) {
    return node;
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findElementWithText(node.childNodes[i], text);
    //打印found
    console.log("found打印：", found);
    if (found) {
      return found;
    }
  }

  return null;
};

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

  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findEditableElement(node.childNodes[i]);
    if (found) {
      return found;
    }
  }

  return null;
};

const fillTable = async (
  headerClass: string,
  headerName: string,
  bodyClass: string,
  inputValue: string
) => {
  //打印全部入参
  console.log(
    "fillTable入参打印：",
    headerClass,
    headerName,
    bodyClass,
    inputValue
  );

  const header = await findElement(`.${headerClass}`);
  const body = await findElement(`.${bodyClass}`);

  if (!header || !body) {
    console.error("Could not find table header or body");
    return;
  }

  if (!(header instanceof Element) || !(body instanceof Element)) {
    console.error("Header or body is not an Element");
    return;
  }
  const headers = Array.from((header as Element).querySelectorAll("th"));
  
  //打印全部th
  console.log("headers打印：", headers);
  const columnIndex = headers.findIndex(
    (th) => findElementWithText(th, headerName) !== null
  );

  if (columnIndex === -1) {
    console.error(`Could not find header with name "${headerName}"`);
    return;
  }

  const rows = Array.from(body.querySelectorAll("tr"));
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    const cell = cells[columnIndex];
    if (cell) {
      const editable = findEditableElement(cell);
      if (editable) {
        if (editable.tagName === "INPUT" || editable.tagName === "TEXTAREA") {
          (editable as HTMLInputElement).value = inputValue;
          editable.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true })
          );
        } else if (editable.contentEditable === "true") {
          editable.textContent = inputValue;
        }
      }
    }
  });
};

window.fillTable = fillTable;

export default fillTable;
