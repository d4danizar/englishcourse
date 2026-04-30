"use client";

import { useState } from "react";

export function SignatureImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className="h-16 w-full"></div>;
  }

  return (
    <img
      src={src}
      alt=""
      className="h-16 mx-auto object-contain mix-blend-multiply"
      onError={() => setHasError(true)}
    />
  );
}
