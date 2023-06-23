interface ElementFinderProps {
  selector: string;
}

export const findElementInFrames = async (
  frameWindow: Window,
  selector: string
): Promise<Element | null> => {
  const element = frameWindow.document.querySelector(selector);
  if (element) {
    return element;
  }

  const iframes = frameWindow.document.querySelectorAll("iframe");
  for (let i = 0; i < iframes.length; i++) {
    const innerFrame = iframes[i] as HTMLIFrameElement;
    const innerFrameWindow =
      innerFrame.contentWindow || innerFrame.contentDocument?.defaultView;

    if (innerFrameWindow) {
      try {
        const testAccess = innerFrame.contentDocument;
        const result = await findElementInFrames(innerFrameWindow, selector);
        if (result) {
          return result;
        }
      } catch (error) {
        return new Promise((resolve, reject) => {
          const handleElementFound = async (event: any) => {
            if (event.data.action === "elementFound") {
              window.removeEventListener("message", handleElementFound);
              const result = event.data.element;
              if (result) {
                resolve(result);
              } else {
                try {
                  const frameResult = await findElementInFrames(
                    innerFrameWindow,
                    selector
                  );
                  resolve(frameResult);
                } catch (error) {
                  reject(error);
                }
              }
            }
          };
          window.addEventListener("message", handleElementFound);
          window.postMessage(
            { action: "findElementInFrames", data: { selector } },
            "*"
          );
        });
      }
    }
  }

  return null;
};

export const findElement = async (
  selector: string
): Promise<Element | null> => {
  const rootWindow = window.top as Window;
  return (
    (await findElementInFrames(rootWindow, selector)) ||
    document.querySelector(selector)
  );
};
