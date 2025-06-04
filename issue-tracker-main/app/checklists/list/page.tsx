
import React from "react";
import { Button } from "@radix-ui/themes";
import Link from "next/link";

const checklistsPages = () => {
  return (
    <div> 
      <Button>
        <Link href='/checklists/new'>اضافه کردن قالب چک لیست</Link>
      </Button>
    </div>
  );
};

export default checklistsPages;
