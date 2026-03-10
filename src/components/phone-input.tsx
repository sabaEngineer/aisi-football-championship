"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ka } from "@/lib/ka";

/**
 * Accept: 555123456, 995555123456, +995555123456
 * Georgian only: national number must be 9 digits starting with 5,6,7,8,9.
 * Reject leading 1,2,3,4 and limit to 9 national digits.
 */
function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";

  let national: string;
  if (digits.startsWith("995") && digits.length > 3) {
    national = digits.slice(3, 12);
  } else if (/^[5-9]/.test(digits)) {
    national = digits.slice(0, 9);
  } else if (digits.startsWith("995")) {
    national = digits.slice(3, 12);
  } else {
    national = digits.slice(0, 9);
  }

  // Georgian numbers start with 5,6,7,8,9 — reject 1,2,3,4
  if (national.length > 0 && /^[1-4]/.test(national)) {
    national = "";
  }

  if (national.length <= 3) return national ? `+995 ${national}` : "+995 ";
  if (national.length <= 6) return `+995 ${national.slice(0, 3)} ${national.slice(3)}`;
  return `+995 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 9)}`;
}

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  error?: boolean;
}

/**
 * Georgian phone input. User can type: 555123456, 995..., +995..., or +995 555 123 456.
 * All formats accepted; displays as +995 XXX XXX XXX. Submits normalized value.
 */
export function PhoneInput({
  className,
  error,
  name = "phone",
  placeholder,
  ...props
}: PhoneInputProps) {
  const [value, setValue] = React.useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatDisplay(e.target.value));
  };

  return (
    <input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      name={name}
      placeholder={placeholder ?? ka.auth.phonePlaceholderFlexible}
      value={value}
      onChange={handleChange}
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        error &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className
      )}
      aria-invalid={error}
      {...props}
    />
  );
}
