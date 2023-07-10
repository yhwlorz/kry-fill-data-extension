import fillTable from './utils/fillTable';

console.log('🚀 Injected into:', window.location.href);
console.log('🚀 Is top frame?', window.self === window.top);

//测试发现，在background中使用chrome.scripting.executeScript注入文件后。此函数会被自动执行。但函数将以 "isolated world" 的形式执行脚本。这意味着这段脚本将在与页面主要 JavaScript 上下文隔离的环境中运行。这也就解释了为什么你在 Elements 面板中看不到插入的 <script> 标签：它实际上并没有作为一个 DOM 元素被插入到页面中。
function injectScript() {
  // 检查是否已存在具有相同特征的脚本元素
  const existingScript = document.querySelector('script[data-injected-script="true"]');
  if (existingScript) {
    console.log('🚀🚀Script already injected:', existingScript);
    return; // 如果已存在脚本元素，则不再插入新的脚本
  }

  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('data-injected-script', 'true');
  scriptElement.textContent = `(${fillTable.toString()})();`;

  const parent = document.head || document.documentElement;
  parent.appendChild(scriptElement);

  console.log('🚀🚀Script injected:', scriptElement);
}

//injectScript(); // 注意这一行，它调用了你定义的 injectScript 函数。加上这一行，能在目标网页的Elements中看到插入的script

//export { injectScript };





//首先，需要明确的是，注入脚本（injected script）是指在页面上下文中执行的脚本，它可以直接访问页面的 DOM，但是不能访问插件的其他脚本。要在页面上下文中执行脚本，我们可以创建一个脚本元素，并将其插入到页面的 DOM 中。以下是injectScript.ts的基础实现：

//这段代码首先从findAndFill.ts文件导入findAndFill函数。然后，创建一个新的script元素，并将findAndFill函数转换为字符串后设置为新script元素的textContent。最后，将新script元素插入到页面的head元素或者documentElement（html元素）中。

//注意：以上代码是一个基础的实现，你可能需要根据你的具体需求来调整代码。例如，如果你需要注入多个函数，你可能需要修改script.textContent的值。同时，因为注入的脚本会在页面的上下文中执行，所以它们不能访问插件的其他脚本，包括背景脚本和内容脚本。如果你需要让注入的脚本和其他脚本进行通信，你可能需要使用window.postMessage等API。