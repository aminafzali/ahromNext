"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Flex,
  TextArea,
  TextField,
  TextFieldRoot,
} from "@radix-ui/themes";
import Link from "next/link";
import React from "react";

const newCheckListPage = () => {
  return (
    <div className="space-y-3 max-w-xl ">
      <TextField.Root>
        <TextField.Input placeholder="نام الگوی چک لیست" className="p-3" />
      </TextField.Root>

      <TextArea placeholder="توضیحات الگوی چک لیست" />
      <Button>
        <Link href={""}>اضافه کردن الگوی چک لیست </Link>
      </Button>
    </div>
  );
};

export default newCheckListPage;
