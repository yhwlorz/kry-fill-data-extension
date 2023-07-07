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

const INITIAL_FIELDS: Field[] = [{ thName: "标准数量", tdValue: "100" }];

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
    <div>
      <h1>Table Filler</h1>
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
      <input
        type="text"
        placeholder="thead class"
        value={option.theadClass}
        readOnly
      />
      <input
        type="text"
        placeholder="tbody class"
        value={option.tbodyClass}
        readOnly
      />
      {state.fields.map((field, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="th name"
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
            placeholder="td value"
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
      <button onClick={() => dispatch({ type: "ADD_FIELD" })}>Add Field</button>
      <button
        onClick={() => dispatch({ type: "REMOVE_FIELD" })}
        disabled={state.fields.length <= 1}
      >
        Sub Field
      </button>
      <br />
      <button onClick={fillTable} disabled={state.filling}>
        Fill Table
      </button>
      <button onClick={stopFill} disabled={!state.filling}>
        Stop Fill
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </div>
  );
};

export default App;
