// File: app/(public)/_components/LandingHeader.tsx
'use client'; // این کامپوننت می‌تواند کلاینت باشد یا سرور، فعلا کلاینت در نظر می‌گیریم

import React from 'react';
import { Button, Flex, Heading } from '@radix-ui/themes';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ArrowLeftIcon, DashboardIcon } from '@radix-ui/react-icons';

const LandingHeader = () => {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b dark:border-gray-800">
            <Flex justify="between" align="center" className="container mx-auto p-4">
                <Link href="/" passHref>
                    <Flex align="center" gap="3">
                        <Image src="/logo/ahrom78-2.png" alt="لوگوی فناوری اهرم" width={40} height={40} />
                        <Heading className="font-bold text-lg md:text-xl hidden sm:block">
                            فناوری اهرم
                        </Heading>
                    </Flex>
                </Link>
                {session ? (
                    <Button asChild size={{initial: '2', sm: '3'}} variant="solid">
                        <Link href="/dashboard">
                            ورود به داشبورد <DashboardIcon className="mr-2 rtl:ml-2" />
                        </Link>
                    </Button>
                ) : (
                    <Button asChild size={{initial: '2', sm: '3'}} variant="solid" highContrast>
                        <Link href="/login">
                            ورود به سیستم <ArrowLeftIcon className="mr-2 rtl:ml-2" />
                        </Link>
                    </Button>
                )}
            </Flex>
      </header>
    );
}

export default LandingHeader;