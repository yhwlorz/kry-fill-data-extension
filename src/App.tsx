import React, { useState, useEffect } from "react";

type OptionType = {
  [key: string]: {
    headerClass: string;
    bodyClass: string;
  };
};

const options: OptionType = {
  其他入库: {
    headerClass: "scm-ant-table-header",
    bodyClass: "scm-ant-table-body",
  },
  其他出库: { headerClass: "c", bodyClass: "d" },
  报损出库: {
    headerClass: "cook-table-header.cook-table-sticky-holder",
    bodyClass: "cook-table-body",
  },
};

const App: React.FC = () => {
  const [option, setOption] = useState("报损出库");
  const [headerClass, setHeaderClass] = useState(options[option].headerClass);
  const [headerName, setHeaderName] = useState("标准数量");
  const [bodyClass, setBodyClass] = useState(options[option].bodyClass);
  const [inputValue, setInputValue] = useState("100");

  useEffect(() => {
    setHeaderClass(options[option].headerClass);
    setBodyClass(options[option].bodyClass);
  }, [option]);

  const fillTable = () => {
    chrome.runtime.sendMessage({
      action: "fill",
      headerClass,
      headerName,
      bodyClass,
      inputValue,
    });
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
        placeholder="Header Name"
        value={headerName}
        onChange={(e) => setHeaderName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Body Class"
        value={bodyClass}
        onChange={(e) => setBodyClass(e.target.value)}
      />
      <input
        type="text"
        placeholder="Input Value"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button onClick={fillTable}>Fill Table</button>
    </div>
  );
};

export default App;
