// contentscript.ts
import { findElementInFrames } from './utils/elementFinder';

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("contentScript.ts中的request打印： ", request);

  if (request.action === "fill") {
    const headerClass = request.data.headerClass;
    const headerName = request.data.headerName;
    const bodyClass = request.data.bodyClass;
    const inputValue = request.data.inputValue;

    const header = await findElementInFrames(window, `.${headerClass}`);
    const body = await findElementInFrames(window, `.${bodyClass}`);

    if (!header || !body) {
      console.error("Could not find table header or body");
      return;
    }

    const headers = Array.from(header.querySelectorAll("th") as NodeListOf<HTMLTableHeaderCellElement>);
    const columnIndex = headers.findIndex((th) => th.textContent === headerName);


    if (columnIndex === -1) {
      console.error(`Could not find header with name ${headerName}`);
      return;
    }

    const rows = Array.from(body.querySelectorAll("tr"));

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
