// File: app/(protected)/workspaces/new/page.tsx
import React from 'react';
import { Heading, Box } from '@radix-ui/themes';
import NewWorkspaceForm from './_components/NewWorkspaceForm';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect } from 'next/navigation';

const NewWorkspacePage = async () => {
    // اطمینان از اینکه فقط کاربران لاگین کرده به این صفحه دسترسی دارند
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    return (
        <Box className="max-w-xl mx-auto">
            <Heading as="h1" size="7" mb="6" align="center">
                ایجاد فضای کاری جدید
            </Heading>
            <NewWorkspaceForm />
        </Box>
    );
};

export default NewWorkspacePage;