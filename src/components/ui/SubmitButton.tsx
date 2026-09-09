"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
};

export function SubmitButton({
  loading = false,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return <Button {...props} type={type} loading={pending || loading} />;
}