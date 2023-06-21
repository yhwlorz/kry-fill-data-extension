我们需要构建一个基于 React 和 TypeScript 的 Chrome 插件。这个插件需要注入到用户的页面中，并且可以找到指定的列的输入框并填充指定的值。同时，也要注意页面滚动和翻页的情况。

首先，我们来看看基础的文件和代码结构。基于这个需求，我们大致需要如下的文件结构：

plaintext

/my-extension
├───package.json
├───tsconfig.json
├───public
│ ├───index.html
│ ├───manifest.json
│ └───icons
│ ├───icon128.png
│ ├───icon48.png
│ └───icon16.png
├───src
│ ├───index.tsx
│ ├───App.tsx
│ ├───contentscript.ts
│ ├───background.ts
│ └───injectScript.ts
│ └───utils
│ └───findAndFill.ts
└───build

这里是每个文件或目录的简单说明：

    package.json - 项目的元数据和依赖关系。

    tsconfig.json - TypeScript的配置文件。

    public - 这个目录包含扩展需要的所有静态资源。
        index.html - 应用的HTML模板。
        manifest.json - Chrome插件的manifest文件，包含插件的基础信息，如名称、版本、权限、背景脚本等。
        icons - 插件的图标。

    src - 这个目录包含我们的源代码。
        index.tsx - 插件UI的入口点，这里我们使用React进行渲染。
        App.tsx - 插件的主要React组件，用户界面和交互的主要部分。
        contentscript.ts - 插件的内容脚本，这个脚本将被注入到用户的页面中。
        background.ts - 插件的背景脚本，处理插件生命周期的事务，例如监听页面变化、消息传递等。
        injectScript.ts - 我们的注入脚本，会注入到用户的页面中，并执行寻找和填充输入框的操作。
        utils - 工具函数目录。
            findAndFill.ts - 实现寻找和填充输入框的具体逻辑。

    build - 这个目录将包含构建过程的输出，也就是我们最后上传到Chrome web store的文件。


----------

你的 Chrome 插件的工作流程大致如下：

    当插件被安装后，background.js 中的 chrome.runtime.onInstalled 事件监听器会被触发，打印出 "The extension is installed"。

    当用户点击插件图标时，会打开 index.html 页面，这是插件的弹出页面（popup）。在这个页面中，React 应用被渲染，用户可以在输入框中输入值，然后点击 "Fill Invoices" 按钮。

    当用户点击 "Fill Invoices" 按钮时，App 组件中的 fillInvoices 函数会被调用。这个函数会向 Chrome 的后台脚本（background script）发送一个消息，消息的内容包含了用户输入的值以及其他一些参数。

    background.js 中的 chrome.runtime.onMessage 事件监听器会接收到这个消息，然后向当前活动的标签页发送一个新的消息，这个消息的内容和之前接收到的消息内容相同。

    contentscript.js 中的 chrome.runtime.onMessage 事件监听器会接收到这个消息，然后调用 findAndFill 函数，将用户输入的值填充到指定的输入框中。

    findAndFill 函数会查找页面中所有匹配给定选择器的输入框，然后将这些输入框的值设置为用户输入的值。如果页面中的输入框数量不足，函数会自动滚动页面或翻页以查找更多的输入框。

这就是你的插件的工作流程。消息的流转路径是：用户点击按钮 -> 弹出页面发送消息到后台脚本 -> 后台脚本发送消息到内容脚本 -> 内容脚本调用函数处理消息。这种方式允许你的插件在不同的环境（弹出页面、后台脚本、内容脚本）之间传递信息，从而实现复杂的功能。
