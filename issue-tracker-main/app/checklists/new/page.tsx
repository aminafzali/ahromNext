"use client";

import {
  Button,
  TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import React from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

const newCheckListPage = () => {
  return (
    <div className="space-y-3 max-w-xl" >
      <TextField.Root>
        <TextField.Input placeholder="نام الگوی چک لیست" className="p-3" />
      </TextField.Root>

      <SimpleMDE placeholder="توضیحات الگوی چک لیست" />
      <Button>
        <Link href={""}>اضافه کردن الگوی چک لیست </Link>
      </Button>
    </div>
  );
};

export default newCheckListPage;
