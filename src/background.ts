// src/background.ts
export {};

chrome.runtime.onInstalled.addListener(() => {
  console.log("The extension is installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  }else if (request.action === "stop") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  } 
});

// Add this listener to execute injectScript.js when the extension icon is clicked
chrome.browserAction.onClicked.addListener((tab) => {
  console.log("The extension icon is clicked");
  if (tab.id !== undefined) {
    chrome.tabs.executeScript(tab.id, { file: "injectScript.js" });
  }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     if (tabs[0] && tabs[0].id) {
//       chrome.tabs.sendMessage(tabs[0].id, request);
//     }
//   });
// });
