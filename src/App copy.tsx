//src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";

type OptionType = {
  [key: string]: {
    theadClass: string;
    tbodyClass: string;
  };
};

const options: OptionType = {
  通用: {
    theadClass: "scm-ant-table-thead",
    tbodyClass: "scm-ant-table-tbody",
  },
  报损出库: {
    theadClass: "cook-table-thead",
    tbodyClass: "cook-table-tbody",
  },
};

const App: React.FC = () => {
  const [option, setOption] = useState("通用");
  const [theadClass, setTheadClass] = useState(options[option].theadClass);
  const [tbodyClass, setTbodyClass] = useState(options[option].tbodyClass);

  useEffect(() => {
    setTheadClass(options[option].theadClass);
    setTbodyClass(options[option].tbodyClass);
  }, [option]);

  //支持用户手动添加更多组合
  const [fields, setFields] = useState([
    { thName: "标准数量", tdValue: "100" },
  ]);
  const addField = () => {
    setFields([...fields, { thName: "", tdValue: "" }]);
  };
  //如果fields.length>1,按钮removeField的disabled属性为false
  const [removeFieldDisabled, setRemoveFieldDisabled] = useState(true);
  useEffect(() => {
    if (fields.length > 1) {
      setRemoveFieldDisabled(false);
    } else {
      setRemoveFieldDisabled(true);
    }
  }, [fields]);

  //从最后一个元素开始减少Field,最少保留一个元素
  const removeField = () => {
    if (fields.length > 1) {
      const newFields = [...fields];
      newFields.pop();
      setFields(newFields);
    }
  };

  const updateField = (index: number, thName: string, tdValue: string) => {
    const newFields = [...fields];
    newFields[index] = { thName: thName, tdValue: tdValue };
    setFields(newFields);
  };

  //防重复执行
  const [filling, setFilling] = useState(false);
  //异常提示
  const [error, setError] = useState("");

  //为避免组件卸载后依然保留监听器，可能导致内存泄露或错误，你应该在组件卸载时移除此监听器。这通常在React的useEffect钩子的清理函数中完成
  useEffect(() => {
    const messageListener = (request: any) => {
      if (request.action === "completed" || request.action === "error") {
        setFilling(false);
      }

      if (request.action === "error") {
        setError(request.message);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    //chrome.runtime.onMessage.addListener(messageListener);

    // 在组件卸载时移除监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const fillTable = () => {
    setFilling(true);
    setError("");
    chrome.runtime.sendMessage({
      action: "fill",
      theadClass: theadClass,
      tbodyClass: tbodyClass,
      fields,
      //headerName,
      //inputValue,
    });
  };

  const stopFill = () => {
    chrome.runtime.sendMessage({ action: "stop" });
  };

  return (
    <div>
      <h1>Table Filler</h1>
      <select value={option} onChange={(e) => setOption(e.target.value)}>
        {Object.keys(options).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Header Class"
        value={theadClass}
        onChange={(e) => setTheadClass(e.target.value)}
      />
      <input
        type="text"
        placeholder="Body Class"
        value={tbodyClass}
        onChange={(e) => setTbodyClass(e.target.value)}
      />
      {fields.map((field, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Header Name"
            value={field.thName}
            onChange={(e) => updateField(index, e.target.value, field.tdValue)}
          />
          <input
            type="text"
            placeholder="Input Value"
            value={field.tdValue}
            onChange={(e) => updateField(index, field.thName, e.target.value)}
          />
        </div>
      ))}
      <button onClick={addField}>Add Field</button>
      <button onClick={removeField} disabled={removeFieldDisabled}>
        Sub Field
      </button>
      <br />
      <button onClick={fillTable} disabled={filling}>
        Fill Table
      </button>
      <button onClick={stopFill} disabled={!filling}>
        {" "}
        Stop Fill
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default App;
