import { useSession } from "next-auth/react";
import { useEffect, useReducer } from "react";
import getDiscussionComments from "../modules/getDiscussionComments";
import postDiscussionComment from "../modules/postDiscussionComment";

type Contents = any;
type ErrorType = "retrieval" | "post";
type ActionError = {
  type: "error";
  payload: { type: ErrorType; message: string };
};
type ActionSuccess = {
  type: "success";
  payload: { comments: Contents; total: number };
};
type ActionLoading = { type: "loading" };
type ActionPosting = { type: "posting" };
type ActionPosted = { type: "posted"; payload: { comment: any } };
type Action =
  | ActionSuccess
  | ActionLoading
  | ActionError
  | ActionPosting
  | ActionPosted;
interface State {
  error?: { type: ErrorType; message: string };
  comments?: Contents;
  total: number;
  loading: boolean;
  posting: boolean;
}
const initialState: State = { loading: true, posting: false, total: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true };
    case "error":
      return { ...state, error: action.payload, loading: false };
    case "success":
      return {
        ...state,
        comments: action.payload.comments,
        total: action.payload.total,
        loading: false,
      };
    case "posting":
      return { ...state, posting: true };
    case "posted":
      const updatedComments = [...state.comments, action.payload.comment];
      return {
        ...state,
        posting: false,
        comments: updatedComments,
        total: state.total + 1,
      };
    default:
      throw new Error(`Invalid action type ${action} for useComments reducer`);
  }
}

export const useComments = (discussionNo: number, discussionId: string) => {
  const { data: session, status } = useSession();

  const [state, dispatch] = useReducer(reducer, initialState);
  const token = session?.accessToken as string;

  async function postComment(content: string) {
    dispatch({ type: "posting" });
    try {
      const response = await postDiscussionComment(
        discussionId,
        content,
        token
      );
      dispatch({ type: "posted", payload: { comment: response } });
    } catch (err) {
      console.error(err);
      return dispatch({
        type: "error",
        payload: { type: "post", message: err.message },
      });
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    async function getComments() {
      try {
        dispatch({ type: "loading" });
        const { total, comments } = await getDiscussionComments(
          discussionNo,
          token
        );
        dispatch({ type: "success", payload: { comments, total } });
      } catch (err) {
        console.error(err);
        return dispatch({
          type: "error",
          payload: {
            type: "retrieval",
            message: `Response failed: ${err}`,
          },
        });
      }
    }
    getComments();
  }, [discussionId]);

  return { postComment, ...state };
};
