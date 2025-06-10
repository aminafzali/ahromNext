"use client";

import { Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export default function InfoCallout() {
  return (
    <Callout.Root color="blue">
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Callout.Text>
        شما هنوز عضو هیچ ورک‌اسپیسی نیستید یا ورک‌اسپیس فعالی انتخاب نشده است.
        لطفاً از منوی بالای صفحه یک ورک‌اسپیس را انتخاب یا ایجاد کنید.
      </Callout.Text>
    </Callout.Root>
  );
}
