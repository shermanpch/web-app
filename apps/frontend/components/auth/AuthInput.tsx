import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface AuthInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (_event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon: LucideIcon;
}

export default function AuthInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required = true,
  icon: Icon,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 font-serif">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
        <Input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="pl-10 w-full bg-[#EDE6D6] border-none rounded-lg h-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-[#B88A6A] focus:ring-offset-2 focus:ring-offset-[#D8CDBA]"
        />
      </div>
    </div>
  );
}
