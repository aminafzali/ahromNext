// این فایل برای پاره از توضیحات است
که شاید نیاز باشد در آینده بررسی شود




app/api/checklist-templates/[templateId]/permissions/route.ts

نکته مهم در مورد کد بالا:  برای استفاده بهینه از upsert،
  باید یک محدودیت @@unique ترکیبی روی فیلدهای checklistTemplateId, workspaceMemberId,
   teamId در مدل Permission در schema.prisma
    خود اضافه کنید. در کد بالا،
     من برای سادگی از یک راه‌حل جایگزین با create استفاده کرده‌ام.

     