// File: app/(public)/page.tsx (نسخه نهایی و بازطراحی شده)
import React from 'react';
import { Heading, Text, Button, Flex, Box, Card, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import Image from 'next/image';
import { 
    RocketIcon, Component1Icon, FileTextIcon, LightningBoltIcon, MixIcon, BarChartIcon, 
    CheckCircledIcon, ChatBubbleIcon, StarFilledIcon, TargetIcon, LapTimerIcon, Share2Icon 
} from '@radix-ui/react-icons';
import LandingHeader from './_components/LandingHeader'; // ✅ ایمپورت هدر جدید

const LandingPage = () => {
  const modules = [
    { name: "مدیریت هوشمند کسب‌وکار", icon: <RocketIcon className="w-6 h-6" /> },
    { name: "مدیریت پروژه و وظایف", icon: <Component1Icon className="w-6 h-6" /> },
    { name: "پایگاه دانش", icon: <BarChartIcon className="w-6 h-6" /> },
    { name: "اتوماسیون و گردش کار هوشمند", icon: <LightningBoltIcon className="w-6 h-6" /> },
    { name: "مدیریت اسناد", icon: <FileTextIcon className="w-6 h-6" /> },
    { name: "فرم‌ساز پیشرفته", icon: <MixIcon className="w-6 h-6" /> },
    { name: "چک‌لیست‌های هوشمند", icon: <CheckCircledIcon className="w-6 h-6" /> },
    { name: "چت‌بات هوشمند", icon: <ChatBubbleIcon className="w-6 h-6" /> },
  ];

  return (
    <Box className="bg-white dark:bg-black text-slate-900 dark:text-slate-100">
      <LandingHeader />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white dark:from-violet-950/30 dark:via-black dark:to-black">
          <div className="container mx-auto px-6 py-24 sm:py-32 lg:px-8">
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 lg:grid-cols-2">
              {/* بخش متن و دکمه (چپ در دسکتاپ، بالا در موبایل) */}
              <div className="text-center lg:text-right flex flex-col justify-center">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  هوشمندسازی کسب‌وکار، ساده‌تر از همیشه
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                  با پلتفرم یکپارچه اهرم، تمام ابزارهای مورد نیاز برای مدیریت پروژه، اسناد، دانش و فرآیندها را در یک مکان در اختیار داشته باشید و بهره‌وری تیم خود را به اوج برسانید.
                </p>
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                  <Button asChild size="4" radius="full">
                    <Link href="/login">همین الان شروع کنید</Link>
                  </Button>
                </div>
              </div>

              {/* بخش لوگو (راست در دسکتاپ، پایین در موبایل) */}
              <div className="mt-10 lg:mt-0 lg:row-start-1 lg:col-start-2 flex items-center justify-center">
                <div className="relative w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px]">
                  {/* افکت نورانی زیر لوگو */}
                  <div className="absolute inset-0 bg-violet-400/30 rounded-full blur-3xl" />
                  <Image
                    src="/logo/ahrom78-2.png"
                    alt="لوگوی فناوری اهرم"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">چرا فناوری اهرم؟</h2>
                    <p className="text-lg text-slate-500 mt-4">تمرکز ما بر سادگی، قدرت و یکپارچگی است.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6">
                        <Flex justify="center" align="center" className="w-16 h-16 bg-violet-100 dark:bg-violet-900/50 rounded-full mx-auto mb-4 text-violet-600 dark:text-violet-400">
                           <LapTimerIcon width="32" height="32" />
                        </Flex>
                        <h3 className="text-xl font-semibold mb-2">افزایش بهره‌وری</h3>
                        <p className="text-slate-600 dark:text-slate-400">با خودکارسازی فرآیندها و دسترسی سریع به اطلاعات، در زمان تیم خود صرفه‌جویی کنید.</p>
                    </div>
                    <div className="text-center p-6">
                         <Flex justify="center" align="center" className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full mx-auto mb-4 text-green-600 dark:text-green-400">
                           <Share2Icon width="32" height="32" />
                        </Flex>
                        <h3 className="text-xl font-semibold mb-2">همکاری یکپارچه</h3>
                        <p className="text-slate-600 dark:text-slate-400">تمام تیم‌های شما در یک محیط واحد کار می‌کنند، اطلاعات به راحتی به اشتراک گذاشته می‌شود.</p>
                    </div>
                    <div className="text-center p-6">
                         <Flex justify="center" align="center" className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto mb-4 text-blue-600 dark:text-blue-400">
                           <TargetIcon width="32" height="32" />
                        </Flex>
                        <h3 className="text-xl font-semibold mb-2">تصمیم‌گیری داده‌محور</h3>
                        <p className="text-slate-600 dark:text-slate-400">با گزارش‌ها و داشبوردهای تحلیلی، همیشه بهترین تصمیم را برای کسب‌وکارتان بگیرید.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* MODULES SECTION */}
        <section id="modules" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">تمام ابزارهای مورد نیاز شما</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((module) => (
                        <div key={module.name} className="flex items-center gap-4 p-4 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 hover:bg-white dark:hover:bg-gray-950 rounded-lg transition-all">
                            <div className="text-violet-500">{module.icon}</div>
                            <h3 className="text-lg font-medium">{module.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>

      </main>
      <footer className="text-center p-6 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-800">
        <Text size="2" color="gray">&copy; {new Date().getFullYear()} فناوری اهرم. تمام حقوق محفوظ است.</Text>
      </footer>
    </Box>
  );
};

export default LandingPage;