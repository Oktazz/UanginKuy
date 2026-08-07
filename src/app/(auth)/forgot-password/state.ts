export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialResetPasswordState: ResetPasswordState = {
  status: "idle",
  message: "",
};
