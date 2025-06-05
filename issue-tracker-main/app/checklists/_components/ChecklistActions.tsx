// app/checklists/_components/ChecklistActions.tsx (فایل جدید)
// "use client"; // اگر نیاز به تعاملات سمت کلاینت داشت، اما اینجا فقط یک لینک است

import { Button, Flex, Heading } from "@radix-ui/themes";
import Link from "next/link"; // Link از Next.js قبلا در فایل اصلی import شده

const ChecklistActions = () => {
  return (
    <Flex justify="between" align="center" mb="5">
      <Heading as="h1" size="7">
        مدیریت چک‌لیست‌ها
      </Heading>
      <Button asChild>
        <Link href="/checklists/new">اضافه کردن قالب چک لیست</Link>
      </Button>
    </Flex>
  );
};

export default ChecklistActions; // این کامپوننت در فایل اصلی تعریف شده است
