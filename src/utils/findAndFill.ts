  // src/utils/findAndFill.ts
  declare global {
    interface Window {
      findAndFill: (selector: string, value: string, pageSize: number) => void;
    }
  }


const findAndFill = (selector: string, value: string, pageSize: number) => {
    let elements = Array.from(document.querySelectorAll(selector)) as HTMLInputElement[];
  
    let filled = 0;
    let index = 0;
  
    const fill = () => {
      if (index >= elements.length) {
        window.scrollTo(0, 0);
        elements = Array.from(document.querySelectorAll(selector)) as HTMLInputElement[];
        index = 0;
      }
      while (index < elements.length && filled < pageSize) {
        elements[index].value = value;
        elements[index].dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        filled++;
        index++;
      }
      if (filled < pageSize) {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(fill, 1000);
      }
    };
  
    fill();
  };
  
  // Expose the function to the global window object so that it can be called from the content script.
  window.findAndFill = findAndFill;
  
  export default findAndFill;