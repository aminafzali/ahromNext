// File: app/(public)/page.tsx (نسخه نهایی و داینامیک)
import React from 'react';
import { Heading, Text, Button, Flex, Box, Card, Badge, Grid, Separator } from '@radix-ui/themes';
import Link from 'next/link';
import { ArrowLeftIcon, Component1Icon, FileTextIcon, LightningBoltIcon, MixIcon, BarChartIcon, CheckCircledIcon, DashboardIcon } from '@radix-ui/react-icons';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';

// کامپوننت هدر داینامیک
const LandingHeader = async () => {
    const session = await getServerSession(authOptions);

    return (
        <header className="sticky top-0 z-10 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b dark:border-gray-800">
            <Flex justify="between" align="center" className="max-w-7xl mx-auto p-4">
                <Heading className="font-bold">اهرم</Heading>
                {session ? (
                    // اگر کاربر لاگین کرده، دکمه "ورود به داشبورد" را نشان بده
                    <Button asChild size={{initial: '2', sm: '3'}} variant="solid">
                        <Link href="/dashboard">
                            ورود به داشبورد <DashboardIcon className="mr-2 rtl:mr-0 rtl:ml-2" />
                        </Link>
                    </Button>
                ) : (
                    // در غیر این صورت، دکمه "ورود به سیستم" را نشان بده
                    <Button asChild size={{initial: '2', sm: '3'}} variant="solid" highContrast>
                        <Link href="/login">
                            ورود به سیستم <ArrowLeftIcon className="mr-2 rtl:mr-0 rtl:ml-2" />
                        </Link>
                    </Button>
                )}
            </Flex>
      </header>
    );
}


const LandingPage = () => {
  const modules = [
    { name: "مدیریت پروژه", icon: <Component1Icon width="24" height="24" />, description: "پروژه‌ها و وظایف خود را با دیدی جامع پیگیری و مدیریت کنید." },
    { name: "مدیریت اسناد", icon: <FileTextIcon width="24" height="24" />, description: "تمام اسناد و فایل‌های مهم خود را در یک مکان امن ذخیره و به اشتراک بگذارید." },
    { name: "پایگاه دانش", icon: <BarChartIcon width="24" height="24" />, description: "یک مرکز دانش داخلی برای تیم خود بسازید و اطلاعات را به راحتی در دسترس قرار دهید." },
    { name: "اتوماسیون فرآیند", icon: <LightningBoltIcon width="24" height="24" />, description: "کارهای تکراری را خودکار کرده و در زمان و انرژی تیم خود صرفه‌جویی کنید." },
    { name: "فرم‌ساز پیشرفته", icon: <MixIcon width="24" height="24" />, description: "فرم‌های داینامیک و هوشمند برای جمع‌آوری هر نوع داده‌ای طراحی کنید." },
    { name: "چک‌لیست‌های هوشمند", icon: <CheckCircledIcon width="24" height="24" />, description: "فرآیندهای استاندارد خود را با چک‌لیست‌های تعاملی و قابل پیگیری اجرا کنید." },
  ];

  return (
    <Box className="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <LandingHeader />

      <main>
        {/* بخش Hero */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <Badge size="2" variant="surface" color="violet" className="mb-4">پلتفرم مدیریت یکپارچه کسب‌وکار</Badge>
          <Heading as="h1" size="9" className="font-extrabold max-w-4xl mx-auto mb-6">
            قدرت اهرم را در دستان خود بگیرید
          </Heading>
          <Text as="p" size="5" color="gray" className="max-w-2xl mx-auto mb-8">
            اهرم، سیستم مدیریت ارتباطات و اطلاعات شماست. فرآیندهای پیچیده را ساده کنید، همکاری تیمی را افزایش دهید و با شفافیت کامل، کسب‌وکار خود را به پیش ببرید.
          </Text>
        </section>
        
        <Separator size="4" my="0" />

        {/* بخش ماژول‌ها */}
        <section className="max-w-7xl mx-auto py-16 lg:py-24 px-4">
            <Box className="text-center mb-12">
                <Heading as="h2" size="8">یک پلتفرم، تمام نیازهای شما</Heading>
                <Text as="p" size="4" color="gray" mt="2">ماژول‌های اهرم به صورت یکپارچه با هم کار می‌کنند.</Text>
            </Box>
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="8">
                {modules.map((module) => (
                    <Card key={module.name} variant='surface' className="p-6 text-right">
                        <Flex direction="column" gap="3">
                            <Flex align="center" gap="3" className="text-violet-600 dark:text-violet-400">
                                {module.icon}
                                <Heading as="h3" size="5">{module.name}</Heading>
                            </Flex>
                            <Text as="p" color="gray" size="3">{module.description}</Text>
                        </Flex>
                    </Card>
                ))}
            </Grid>
        </section>
        {/* در اینجا می‌توانید بخش اخبار را برای کاربران لاگین کرده نمایش دهید */}
      </main>

      {/* فوتر */}
      <footer className="text-center p-6 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-800">
        <Text size="2" color="gray">&copy; {new Date().getFullYear()} شرکت اهرم. تمام حقوق محفوظ است.</Text>
      </footer>
    </Box>
  );
};

export default LandingPage;