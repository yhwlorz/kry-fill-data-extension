// src/injectScript.ts

import fillTable from './utils/fillTable';

function injectScript() {
  const scriptElement = document.createElement('script');
  //(${findAndFill.toString()})() 带最后的括号，就是自执行函数
  scriptElement.textContent = `(${fillTable.toString()});`;

   // 修改注入逻辑以支持跨域
   const parent = document.head || document.documentElement;
   parent.appendChild(scriptElement);
   parent.removeChild(scriptElement);
}

export { injectScript };


//首先，需要明确的是，注入脚本（injected script）是指在页面上下文中执行的脚本，它可以直接访问页面的 DOM，但是不能访问插件的其他脚本。要在页面上下文中执行脚本，我们可以创建一个脚本元素，并将其插入到页面的 DOM 中。以下是injectScript.ts的基础实现：

//这段代码首先从findAndFill.ts文件导入findAndFill函数。然后，创建一个新的script元素，并将findAndFill函数转换为字符串后设置为新script元素的textContent。最后，将新script元素插入到页面的head元素或者documentElement（html元素）中。

//注意：以上代码是一个基础的实现，你可能需要根据你的具体需求来调整代码。例如，如果你需要注入多个函数，你可能需要修改script.textContent的值。同时，因为注入的脚本会在页面的上下文中执行，所以它们不能访问插件的其他脚本，包括背景脚本和内容脚本。如果你需要让注入的脚本和其他脚本进行通信，你可能需要使用window.postMessage等API。