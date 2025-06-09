// File: app/components/Header.tsx
'use client';

import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Flex, IconButton } from '@radix-ui/themes';
import React from 'react';
import { useSidebarStore } from './sidebar/store';

const Header = () => {
  const { toggle } = useSidebarStore();

  return (
    <header className="p-4 border-b dark:border-gray-800">
      <Flex align="center" justify="between">
        {/* این دکمه سایدبار را باز و بسته می‌کند */}
        <IconButton variant="ghost" onClick={toggle}>
          <HamburgerMenuIcon width="20" height="20" />
        </IconButton>
        
        {/* در آینده می‌توانید بخش‌های دیگری مانند جستجو یا اعلانات را اینجا اضافه کنید */}
      </Flex>
    </header>
  );
};

export default Header;