import React from "react";

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentContainer({
  children,
  className = "",
}: ContentContainerProps) {
  return (
    <div className={`max-w-3xl mx-auto mt-16 mb-12 relative z-10 ${className}`}>
      {/* Semi-transparent gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-[#1a1812]/70 to-black/80 rounded-2xl border border-[rgba(218,165,32,0.3)]"></div>

      <div className="p-8">{children}</div>
    </div>
  );
}
