//关于 declare global，这个关键字用于在 TypeScript 中扩展全局范围的接口。在你的例子中，你扩展了 WindowEventMap 接口以支持自定义的 "fillError" 事件。这是 TypeScript 中增加类型定义的一种常见方法。你在 declare global 块中添加的 fillError 是扩展全局 WindowEventMap 的一种方法，这样你就可以在你的代码中使用 window.addEventListener("fillError", ...) 而不会遇到类型错误。如果你的代码中并没有使用到 "fillError" 事件，那么这段代码就没有必要。
declare global {
    interface WindowEventMap {
      fillError: CustomEvent; // //在使用TypeScript的时候，如果你要为window添加一个自定义事件，你需要扩展WindowEventMap

    }
  }
  