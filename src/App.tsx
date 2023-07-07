//src/App.tsx
import React, { useState, useEffect } from "react";
import './App.css';

type OptionType = {
  [key: string]: {
    headerClass: string;
    bodyClass: string;
  };
};

const options: OptionType = {
  通用: {
    headerClass: "scm-ant-table-header",
    bodyClass: "scm-ant-table-body",
  },
  报损出库: {
    headerClass: "cook-table-header.cook-table-sticky-holder",
    bodyClass: "cook-table-body",
  },
};

const App: React.FC = () => {
  const [option, setOption] = useState("通用");
  const [headerClass, setHeaderClass] = useState(options[option].headerClass);
  const [bodyClass, setBodyClass] = useState(options[option].bodyClass);
  const [headerName, setHeaderName] = useState("标准数量");
  const [inputValue, setInputValue] = useState("100");


  //支持用户手动添加更多组合
  const [fields, setFields] = useState([{ headerName: "标准数量", inputValue: "100" }]);
  const addField = () => {
    setFields([...fields, { headerName: '', inputValue: '' }]);
  };
  //如果fields.length>1,按钮removeField的disabled属性为false
  const[removeFieldDisabled, setRemoveFieldDisabled] = useState(true);
  useEffect(() => {
    if (fields.length > 1) {
      setRemoveFieldDisabled(false);
    } else {
      setRemoveFieldDisabled(true);
    }
  }
  , [fields]);
  
  //从最后一个元素开始减少Field,最少保留一个元素
  const removeField = () => {
    if (fields.length > 1) {
      const newFields = [...fields];
      newFields.pop();
      setFields(newFields);
    }
  };

  const updateField = (index: number, headerName: string, inputValue: string) => {
    const newFields = [...fields];
    newFields[index] = { headerName, inputValue };
    setFields(newFields);
  };

  //防重复执行
  const [filling, setFilling] = useState(false);
  //异常提示
  const [error, setError] = useState("");


  useEffect(() => {
    setHeaderClass(options[option].headerClass);
    setBodyClass(options[option].bodyClass);
  }, [option]);

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
  
    // 在组件卸载时移除监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const fillTable = () => {
    setFilling(true);
    setError("");
    chrome.runtime.sendMessage({
      action: "fill",
      headerClass,
      bodyClass,
      fields
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
        value={headerClass}
        onChange={(e) => setHeaderClass(e.target.value)}
      />
      <input
        type="text"
        placeholder="Body Class"
        value={bodyClass}
        onChange={(e) => setBodyClass(e.target.value)}
      />
      {/* <input
        type="text"
        placeholder="Header Name"
        value={headerName}
        onChange={(e) => setHeaderName(e.target.value)}
      />
      
      <input
        type="text"
        placeholder="Input Value"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      /> */}
      {fields.map((field, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Header Name"
            value={field.headerName}
            onChange={(e) => updateField(index, e.target.value, field.inputValue)}
          />
          <input
            type="text"
            placeholder="Input Value"
            value={field.inputValue}
            onChange={(e) => updateField(index, field.headerName, e.target.value)}
          />
        </div>
      ))}
      <button onClick={addField}>Add Field</button>
      <button onClick={removeField} disabled={removeFieldDisabled} >Sub Field</button>
      <br />
      <button onClick={fillTable} disabled={filling}>Fill Table</button>
      <button onClick={stopFill} disabled={!filling}> Stop Fill</button>  
      {error && <p className="error">{error}</p>}
        </div>
      
  );
};

export default App;
