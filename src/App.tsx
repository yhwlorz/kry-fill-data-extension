import React, { useReducer, useEffect, Dispatch, useState } from "react";
import "./App.css";

interface thtdFieldMap {
  thName: string;
  tdValue: string;
}

interface FormClass {
  theadClass: string;
  tbodyClass: string;
}

interface FormSelector {
  [key: string]: FormClass;
}

const INITIAL_FORM_SELECTOR: FormSelector = {
  通用: {
    theadClass: "scm-ant-table-thead",
    tbodyClass: "scm-ant-table-tbody",
  },
  报损出库: {
    theadClass: "cook-table-thead",
    tbodyClass: "cook-table-tbody",
  },
};

const INITIAL_THTDFIELDMAP: thtdFieldMap[] = [{ thName: "标准数量", tdValue: "999" }];

interface State {
  selectedFormName: string;
  thtdFieldMapList: thtdFieldMap[];
  filling: boolean;
  fillStaus: string;
}

const initialState: State = {
  selectedFormName: Object.keys(INITIAL_FORM_SELECTOR)[0],
  thtdFieldMapList: INITIAL_THTDFIELDMAP,
  filling: false,
  fillStaus: "",
};

type Action =
  | { type: "SET_SELECTED_FORM_NAME"; payload: string }
  | { type: "ADD_THTD_FIELDMAP" }
  | { type: "REMOVE_THTD_FIELDMAP" }
  | { type: "UPDATE_THTD_FIELDMAP"; payload: { index: number; field: thtdFieldMap } }
  | { type: "SET_FILLING"; payload: boolean }
  | { type: "SET_FILLSTATUS"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_SELECTED_FORM_NAME":
      return { ...state, selectedFormName: action.payload };
    case "ADD_THTD_FIELDMAP":
      return {
        ...state,
        thtdFieldMapList: [...state.thtdFieldMapList, { thName: "", tdValue: "" }],
      };
    case "REMOVE_THTD_FIELDMAP":
      return { ...state, thtdFieldMapList: state.thtdFieldMapList.slice(0, -1) };
    case "UPDATE_THTD_FIELDMAP":
      return {
        ...state,
        thtdFieldMapList: state.thtdFieldMapList.map((field, i) =>
          i === action.payload.index ? action.payload.field : field
        ),
      };
    case "SET_FILLING":
      return { ...state, filling: action.payload };
    case "SET_FILLSTATUS":
      return { ...state, fillStaus: action.payload };
    default:
      return state;
  }
};

const App: React.FC = () => {
  //使用 useReducer 钩子来创建状态和状态更新函数，并通过分解赋值语法将返回值分别赋给 state（表示当前的状态对象，包含了应用中的数据） 和 dispatch（是一个函数，用于派发动作并触发状态更新），以便更方便地管理状态和触发状态更新。reducer 参数是用于定义状态更新逻辑的函数（是一个函数，接受当前状态 state 和动作 action 作为参数，根据动作类型来更新状态并返回新的状态。），而 initialState 参数是初始状态的值（它表示组件初始渲染时的状态）。它们共同用于创建和初始化状态管理。
  const [state, dispatch] = useReducer(reducer, initialState);
  //获取用户在哪个标签页打开的插件
  const [tabId, setTabId] = useState<number | null>(null);
  const formClass = INITIAL_FORM_SELECTOR[state.selectedFormName];

  useEffect(() => {
    const messageListener = (request: { action: string; message: string }) => {
      //按钮状态
      if (
        request.message.includes("fillCompleted") ||
        request.message.includes("fillStopped")
      ) {
        dispatch({ type: "SET_FILLING", payload: false });
      } else if (request.message.includes("fillStart")) {
        dispatch({ type: "SET_FILLING", payload: true });
      } else {
        if (["fillCompleted", "fillStopped"].includes(request.action)) {
          dispatch({ type: "SET_FILLING", payload: false });
        } else if (["fillStart"].includes(request.action)) {
          dispatch({ type: "SET_FILLING", payload: true });
        } else {
          dispatch({ type: "SET_FILLING", payload: false });
        }
      }

      //填充状态
      if (request.message.includes("fillCompleted")) {
        dispatch({ type: "SET_FILLSTATUS", payload: "fillCompleted" });
      } else if (request.message.includes("fillStopped")) {
        dispatch({ type: "SET_FILLSTATUS", payload: "fillStopped" });
      } else if (request.message.includes("fillStart")) {
        dispatch({ type: "SET_FILLSTATUS", payload: "fillStart" });
      } else {
        dispatch({ type: "SET_FILLSTATUS", payload: request.message });
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    //chrome.runtime.onMessage.addListener(messageListener);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setTabId(tabs[0].id as number | null); // 保存当前标签页的ID
        console.log("popup记录的tab:", tabs[0]);
      }
    });
    //这是另一种获取标签页id的方法，当上边的出问题时，可以尝试试用一下
    if (false) {
      const port = chrome.runtime.connect();
      setTabId(port.sender?.tab?.id ?? null);
    }

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      //chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const fillTable = () => {
    dispatch({ type: "SET_FILLING", payload: true });
    dispatch({ type: "SET_FILLSTATUS", payload: "" });

    chrome.runtime.sendMessage({
      action: "fill",
      tabId,
      ...formClass,
      thtdFieldMapList: state.thtdFieldMapList,
    });
  };

  const stopFill = () => {
    chrome.runtime.sendMessage({ action: "stop", tabId });
  };

  return (
    <div className="extension-container">
      <h1 className="header">表单填充</h1>

      <div className="form-container">
        <div className="select-container">
          <label>表单：</label>
          <select
            value={state.selectedFormName}
            onChange={(e) =>
              dispatch({ type: "SET_SELECTED_FORM_NAME", payload: e.target.value })
            }
          >
            {Object.keys(INITIAL_FORM_SELECTOR).map((option) => (
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
            value={formClass.theadClass}
            readOnly
          />
          <label>tbody class</label>
          <input
            type="text"
            placeholder="tbody class"
            value={formClass.tbodyClass}
            readOnly
          />
        </div>
      </div>

      {state.thtdFieldMapList.map((field, index) => (
        <div key={index} className="field-container">
          <input
            type="text"
            placeholder="th 名称"
            value={field.thName}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_THTD_FIELDMAP",
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
                type: "UPDATE_THTD_FIELDMAP",
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
            onClick={() => dispatch({ type: "ADD_THTD_FIELDMAP" })}
            className="action-button add-button"
          >
            增加字段
          </button>
          <button
            onClick={() => dispatch({ type: "REMOVE_THTD_FIELDMAP" })}
            disabled={state.thtdFieldMapList.length <= 1}
            className="action-button remove-button"
          >
            删除字段
          </button>
        </div>

        <div className="fill-buttons-container">
          <button
            onClick={fillTable}
            disabled={state.filling}
            className="action-button fill-button"
          >
            开始填充
          </button>
          <button
            onClick={stopFill}
            disabled={!state.filling}
            className="action-button stop-button"
          >
            停止填充
          </button>
        </div>
      </div>

      {state.fillStaus && <p className="fillStatus">{state.fillStaus}</p>}
    </div>
  );
};

export default App;
