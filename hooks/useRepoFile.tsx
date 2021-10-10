import { useEffect, useReducer } from "react";

type Contents = any;
type ActionError = { type: "error"; payload: { message: string } };
type ActionSuccess = { type: "success"; payload: { data: Contents } };
type ActionLoading = { type: "loading" };
type Action = ActionSuccess | ActionLoading | ActionError;
interface State {
  error?: string;
  contents?: Contents;
  loading: boolean;
}
const initialState: State = { loading: true };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "error":
      return { ...state, error: action.payload.message, loading: false };
    case "success":
      return { ...state, contents: action.payload.data, loading: false };
    default:
      throw new Error(`Invalid action type ${action} for useRepoFile reducer`);
  }
}

type FormatOptions = "text" | "json";
export const useRepoFile = (file?: string, format: FormatOptions = "text") => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function getFile() {
      if (!file) return;
      const response = await fetch(
        `https://raw.githubusercontent.com/Nevvulo/blog/main/${file}`
      );
      if (!response.ok)
        return dispatch({
          type: "error",
          payload: {
            message: `Response failed with status code ${response.status}`,
          },
        });
      const data = await response[format]();
      dispatch({ type: "success", payload: { data } });
    }
    getFile();
  }, [file]);

  return state;
};
