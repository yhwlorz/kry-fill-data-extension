import React, { useReducer, useEffect, Dispatch } from "react";
import "./App.css";

interface Field {
  thName: string;
  tdValue: string;
}

interface Option {
  theadClass: string;
  tbodyClass: string;
}

interface Options {
  [key: string]: Option;
}

const INITIAL_OPTIONS: Options = {
  通用: {
    theadClass: "scm-ant-table-thead",
    tbodyClass: "scm-ant-table-tbody",
  },
  报损出库: {
    theadClass: "cook-table-thead",
    tbodyClass: "cook-table-tbody",
  },
};

const INITIAL_FIELDS: Field[] = [{ thName: "标准数量", tdValue: "999" }];

interface State {
  selectedOption: string;
  fields: Field[];
  filling: boolean;
  error: string;
}

const initialState: State = {
  selectedOption: Object.keys(INITIAL_OPTIONS)[0],
  fields: INITIAL_FIELDS,
  filling: false,
  error: "",
};

type Action =
  | { type: "SET_OPTION"; payload: string }
  | { type: "ADD_FIELD" }
  | { type: "REMOVE_FIELD" }
  | { type: "UPDATE_FIELD"; payload: { index: number; field: Field } }
  | { type: "SET_FILLING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_OPTION":
      return { ...state, selectedOption: action.payload };
    case "ADD_FIELD":
      return {
        ...state,
        fields: [...state.fields, { thName: "", tdValue: "" }],
      };
    case "REMOVE_FIELD":
      return { ...state, fields: state.fields.slice(0, -1) };
    case "UPDATE_FIELD":
      return {
        ...state,
        fields: state.fields.map((field, i) =>
          i === action.payload.index ? action.payload.field : field
        ),
      };
    case "SET_FILLING":
      return { ...state, filling: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const App: React.FC = () => {
  //使用 useReducer 钩子来创建状态和状态更新函数，并通过分解赋值语法将返回值分别赋给 state（表示当前的状态对象，包含了应用中的数据） 和 dispatch（是一个函数，用于派发动作并触发状态更新），以便更方便地管理状态和触发状态更新。reducer 参数是用于定义状态更新逻辑的函数（是一个函数，接受当前状态 state 和动作 action 作为参数，根据动作类型来更新状态并返回新的状态。），而 initialState 参数是初始状态的值（它表示组件初始渲染时的状态）。它们共同用于创建和初始化状态管理。
  const [state, dispatch] = useReducer(reducer, initialState);
  const option = INITIAL_OPTIONS[state.selectedOption];

  useEffect(() => {
    const messageListener = (request: { action: string; message: string }) => {
      if (["completed", "error"].includes(request.action)) {
        dispatch({ type: "SET_FILLING", payload: false });
      }
      if (request.action === "error") {
        dispatch({ type: "SET_ERROR", payload: request.message });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const fillTable = () => {
    dispatch({ type: "SET_FILLING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });

    chrome.runtime.sendMessage({
      action: "fill",
      ...option,
      fields: state.fields,
    });
  };

  const stopFill = () => {
    chrome.runtime.sendMessage({ action: "stop" });
  };

  return (
    <div className="extension-container">
    <h1 className="header">表单填充</h1>
  
    <div className="form-container">
      <div className="select-container">
        <label>表单：</label>
        <select
          value={state.selectedOption}
          onChange={(e) =>
            dispatch({ type: "SET_OPTION", payload: e.target.value })
          }
        >
          {Object.keys(INITIAL_OPTIONS).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="input-container">
        <label>thead class</label>
        <input
          type="text"
          placeholder="thead class"
          value={option.theadClass}
          readOnly
        />
        <label>tbody class</label>
        <input
          type="text"
          placeholder="tbody class"
          value={option.tbodyClass}
          readOnly
        />
      </div>
    </div>
  
    {state.fields.map((field, index) => (
      <div key={index} className="field-container">
        <input
          type="text"
          placeholder="th 名称"
          value={field.thName}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { index, field: { ...field, thName: e.target.value } },
            })
          }
        />
        <input
          type="text"
          placeholder="td 值"
          value={field.tdValue}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: {
                index,
                field: { ...field, tdValue: e.target.value },
              },
            })
          }
        />
      </div>
    ))}
    
    <div className="button-container">
      <div className="field-button-container">
        <button
          onClick={() => dispatch({ type: "ADD_FIELD" })}
          className="action-button add-button"
        >
          增加字段
        </button>
        <button
          onClick={() => dispatch({ type: "REMOVE_FIELD" })}
          disabled={state.fields.length <= 1}
          className="action-button remove-button"
        >
          删除字段
        </button>
      </div>
  
      <div className="fill-buttons-container">
        <button onClick={fillTable} disabled={state.filling} className="action-button fill-button">
          开始填充
        </button>
        <button onClick={stopFill} disabled={!state.filling} className="action-button stop-button">
          停止填充
        </button>
      </div>
    </div>
  
    {state.error && <p className="error">{state.error}</p>}
  </div>
  
  );
};

export default App;
