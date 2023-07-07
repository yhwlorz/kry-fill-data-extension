// 文件名：simulateInput.ts

//监听元素：divEl。点击div后，寻找divEl下的input元素，如果input元素可编辑，则在input元素中输入内容，否则等待一段时间后再次尝试
export const simulateInput = (divEl: HTMLElement, inputValue: string, maxAttempts = 3) => {
  return new Promise((resolve, reject) => {
    //重试次数。最大重试次数maxAttempts
    let attempts = 0;

    // 检查divEl元素是否本身就是一个可以输入的元素
    if (
      divEl.tagName === "INPUT" ||
      divEl.tagName === "TEXTAREA" ||
      divEl.contentEditable === "true"
    ) {
      const inputEl = divEl as HTMLInputElement | HTMLTextAreaElement;
      if (!inputEl.disabled && !inputEl.readOnly) {
        inputEl.focus();
        inputEl.value = inputValue;
        const event = new Event("input", { bubbles: true });
        inputEl.dispatchEvent(event);
        inputEl.blur();
        resolve(null);
        // 如果divEl本身就是可输入的元素，那么就不需要监听DOM变化，可以直接解析Promise
        return;
      }
    }

    // 如果divEl不是一个可以输入的元素，那么我们将监听它的子元素的变化

    // 创建一个MutationObserver实例来监听DOM的变化 。mutationsList是一个MutationRecord对象的数组，每个MutationRecord对象代表了一个DOM变化
    const observer = new MutationObserver((mutationsList, observer) => {
      console.log("mutationsList:", mutationsList);
      // 遍历所有的mutations
      for (let mutation of mutationsList) {
        console.log("mutation.type:", mutation.type);
        // 如果div元素的子元素发生了变化
        if (mutation.type === "childList") {
          // 获取div元素下的input元素
          const inputEl = divEl.querySelector("input");
          console.log("inputEl:", inputEl);
          if (inputEl) {
            inputEl.focus();
            // 检查input元素是否可编辑
            console.log("inputEl.disabled:", inputEl.disabled);
            console.log("inputEl.readOnly:", inputEl.readOnly);
            if (
              inputEl instanceof HTMLInputElement &&
              !inputEl.disabled &&
              !inputEl.readOnly
            ) {
              // 在input元素中输入内容
              inputEl.value = inputValue;
              // 创建并触发input事件
              const event = new Event("input", { bubbles: true });
              inputEl.dispatchEvent(event);
              // 移除元素焦点
              inputEl.blur();
              // 停止监听
              observer.disconnect();
              // 解析Promise
              resolve(null);
            } else {
              // 如果达到最大尝试次数，拒绝Promise
            if (attempts >= maxAttempts) {
              observer.disconnect();
              reject(new Error('Element is not editable'));
            } else {
              // 如果input元素不可编辑，等待一段时间后再次尝试
              attempts += 1;
              setTimeout(() => observer.takeRecords(), 200);
            }
            }
          }
        }
      }
    });

    // 将焦点设置到div
    divEl.focus();

    console.log("延迟x秒");
    setTimeout(() => {
      // 点击div
      divEl.click();
    }, 100);
    // 开始监听div元素的子元素的变化
    observer.observe(divEl, { childList: true });
  });
};
