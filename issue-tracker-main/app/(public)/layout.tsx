// File: app/(public)/layout.tsx
import React from 'react';

// این layout هیچ چیز اضافه‌ای به صفحات لندینگ و لاگین اضافه نمی‌کند
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}