"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ka } from "@/lib/ka";
import { Input } from "@/components/ui/input";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  error?: boolean;
}

/**
 * Plain phone input. No formatting or validation — user types freely.
 */
export function PhoneInput({
  className,
  error,
  name = "phone",
  placeholder,
  ...props
}: PhoneInputProps) {
  return (
    <Input
      type="tel"
      autoComplete="tel"
      name={name}
      placeholder={placeholder ?? ka.auth.phonePlaceholderFlexible}
      className={cn("h-11", className)}
      aria-invalid={error}
      {...props}
    />
  );
}
