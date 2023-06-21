// src/App.tsx
import React, { useState } from 'react';

const App: React.FC = () => {
  const [value, setValue] = useState('');

  const fillInvoices = () => {
    chrome.runtime.sendMessage({
      action: 'fill',
      selector: '.invoice-input',
      value,
      pageSize: 500
    });
  };

  return (
    <div>
      <h1>Invoice Filler</h1>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button onClick={fillInvoices}>
        Fill Invoices
      </button>
    </div>
  );
};

export default App;

//以上代码中，我们首先从React库导入了React和useState。然后定义了一个App组件，这个组件有一个输入框和一个按钮。当按钮被点击时，会向background脚本发送一个动作为"fill"的消息，包含CSS选择器、要填充的值和页面大小。这些值可以根据实际需求进行调整。