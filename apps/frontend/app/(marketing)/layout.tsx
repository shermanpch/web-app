import React from "react";
import Header from "@layout/header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
    </>
  );
}
