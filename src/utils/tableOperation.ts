// tableOperation.ts

import { simulateInput } from "./simulateInput";
import { normalizeString } from "./stringUtils";



//递归查找可编辑的元素
export const findEditableElement = (node: Node): HTMLElement | null => {
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

//递归查找元素BYtextContent
export const findElementWithText = (
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
  

  
//find th index BY testContent
 const findThIndexWithText = (
  theadEl: HTMLElement,
  thName: string
): number => {
  const thEls = Array.from(theadEl.querySelectorAll("th"));

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


export const getThElsIndexMap = (
  theadEl: HTMLElement,
  fields: { thName: string; tdValue: string }[]
): { [key: string]: number } => {
  let columnIndexMap: { [key: string]: number } = {};
  for (let field of fields) {
    if (!field.thName) {
      continue;
    }
    const columnIndex = findThIndexWithText(theadEl, field.thName);
    columnIndexMap[field.thName] = columnIndex;
  }
  return columnIndexMap;
};


export const findVisibleElement = (elements: HTMLElement[]): HTMLElement | null => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].offsetParent !== null) {
      return elements[i];
    }
  }
  return null;
};

export const processTrRowEl = async (
  trRowEl: Element,
  fields: { thName: string; tdValue: string }[],
  thElsIndexMap: { [key: string]: number }
) => {
  const tdCellEls = Array.from(trRowEl.querySelectorAll("td"));
  for (let field of fields) {
    const tdCellEl = tdCellEls[thElsIndexMap[field.thName]];

    if (tdCellEl) {
      const editableEl = findEditableElement(tdCellEl);
      if (editableEl) {
        await simulateInput(editableEl, field.tdValue);
      }
    }
  }
};

// 填充表格的输入函数
export const fillInput = async (
  el: HTMLElement,
  inputValue: string
): Promise<void> => {
  await simulateInput(el, inputValue);
};