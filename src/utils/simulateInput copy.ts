// 文件名：simulateInput.ts

//监听元素：divEl。点击div后，寻找divEl下的input元素，如果input元素可编辑，则在input元素中输入内容，否则等待一段时间后再次尝试
export const simulateInput = (
  divEl: HTMLElement,
  inputValue: string,
  maxAttempts: number = 5,
  delay: number = 100 // 添加一个默认的延迟参数
) => {
  return new Promise((resolve, reject) => {
    const setInputValue = (inputEl: HTMLInputElement) => {
      return new Promise((resolve, reject) => {
        if (!inputEl.disabled && !inputEl.readOnly) {
          inputEl.focus(); // 将焦点设置到div
          inputEl.value = inputValue;
          const event = new Event("input", { bubbles: true }); // 创建并触发input事件
          console.log("已填充数据");
          inputEl.dispatchEvent(event);
          inputEl.blur(); // 移除元素焦点
          setTimeout(resolve, 0); // 使用 setTimeout 以异步方式解析 promise
        } else {
          resolve(null);
        }
      });
    };

    // 首先检查divEl元素是否本身就是一个可以输入的元素
    if (
      divEl.tagName === "INPUT" ||
      divEl.tagName === "TEXTAREA" ||
      divEl.contentEditable === "true"
    ) {
      setInputValue(divEl as HTMLInputElement).then(() => {
        resolve(null);
      });
      return;
    }

    // divEl不是一个可以输入的元素，那么我们将监听它的子元素的变化

    //用于检测DOM变化的超时，最大重试次数maxAttempts
    let attempts = 0;
    let observer: MutationObserver;

    // 设置一个总的数据填充超时定时器 1000ms
    const timeoutId = setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }
      resolve(null);
    }, 1000);

    // 创建一个MutationObserver实例来监听DOM的变化 。mutationsList是一个MutationRecord对象的数组，每个MutationRecord对象代表了一个DOM变化
    observer = new MutationObserver((mutationsList, observer) => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearTimeout(timeoutId);
        observer.disconnect(); // 停止监听
        console.log("Max attempts reached");
        resolve(null);
        return;
      }

      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const inputEl = divEl.querySelector("input");
          if (inputEl) {
            setInputValue(inputEl).then(() => {
              clearTimeout(timeoutId);
              observer.disconnect();
              resolve(null); //当异步操作成功时，应该调用resolve函数，并把结果作为参数传递出去。resolve(null);表示输入操作成功，但没有返回值
            });
            return;
          }
        }
      }
    });

    observer.observe(divEl, { childList: true, subtree: true });

    divEl.focus();
    divEl.click();
  });
};

// 代码的执行顺序：

//     当你调用simulateInput(divEl, inputValue)时，函数首先检查传入的divEl是否本身就是一个可以输入的元素，包括<input>, <textarea>或内容可编辑的元素。

//     如果divEl本身就是一个可输入的元素且没有被禁用或只读，那么函数将会设置焦点到divEl，然后设置它的值为inputValue，触发一个input事件，移除焦点，然后返回一个立即解析的Promise（通过resolve(null)）并且函数返回，后续代码不再执行。

//     如果divEl本身不是一个可以输入的元素，那么函数将创建一个新的MutationObserver，这个观察者用于监听divEl或其子元素的变化。

//     在创建观察者之后，设置了一个全局的定时器timeoutId，在1000毫秒后，如果观察者还在运行，这个定时器将会停止监听，返回null。

//     观察者开始监视divEl的子元素列表的变化。

//     然后，函数将设置焦点到divEl并点击这个元素。

//     一旦divEl或其子元素发生变化，观察者的回调函数就会被触发。首先，变化尝试次数attempts将会自增。如果尝试次数达到最大尝试次数maxAttempts，那么就会清除全局定时器，停止观察者，返回null。

//     然后，函数会遍历所有的DOM变化（也就是MutationRecord对象的数组）。如果发现子元素列表发生变化，函数将会尝试在divEl内部找到一个<input>元素。

//     如果找到了<input>元素，函数将会设置焦点到这个元素，检查它是否可以编辑（不被禁用且不是只读的）。

//     如果<input>元素可以编辑，那么函数将会设置它的值为inputValue，触发一个input事件，移除焦点，清除全局定时器，停止观察者，并解析Promise，然后函数返回。

//     否则，MutationObserver 会一直观察元素的子元素的变化，直到我们调用 observer.disconnect()