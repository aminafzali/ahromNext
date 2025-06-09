// File: lib/permissions.ts (نسخه نهایی و اصلاح شده)
import { PermissionLevel, WorkspaceRole, Team, User, WorkspaceMember } from "@prisma/client";
import prisma from "@/prisma/client";

export interface PermissionResult {
  hasAccess: boolean;
  level: PermissionLevel | null;
  role: WorkspaceRole | null;
}

type PermittedResource = 
    { type: 'ChecklistTemplate', id: number } | 
    { type: 'Project', id: number };

export async function checkUserPermission(
  userId: string,
  workspaceId: number,
  resource: PermittedResource,
  requiredLevel: PermissionLevel
): Promise<PermissionResult> {
    
  // مرحله ۱: دریافت عضویت و نقش کلی کاربر در فضای کاری
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!membership) {
    return { hasAccess: false, role: null, level: null };
  }

  // اگر کاربر OWNER یا ADMIN کل فضای کاری باشد، همیشه بالاترین دسترسی را دارد
  if (membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN) {
    return { hasAccess: true, level: PermissionLevel.MANAGE, role: membership.role };
  }

  // ✅ اصلاح کلیدی: دریافت تیم‌های کاربر در این فضای کاری به صورت جداگانه
  const userTeams = await prisma.teamMember.findMany({
      where: {
          userId: userId,
          team: {
              workspaceId: workspaceId
          }
      },
      select: {
          teamId: true
      }
  });
  const userTeamIds = userTeams.map(t => t.teamId);

  // مرحله ۲: جستجو برای بالاترین سطح دسترسی
  const permissionLevels: Record<PermissionLevel, number> = { VIEW: 1, EDIT: 2, MANAGE: 3 };
  let highestLevel: PermissionLevel | null = null;

  const permissions = await prisma.permission.findMany({
    where: {
      AND: [
        { [resource.type === 'ChecklistTemplate' ? 'checklistTemplateId' : 'projectId']: resource.id },
        {
          OR: [
            { workspaceMemberId: membership.id }, // دسترسی مستقیم کاربر
            { teamId: { in: userTeamIds } }      // دسترسی از طریق تیم‌ها
          ]
        }
      ]
    },
    select: { level: true }
  });

  for (const p of permissions) {
    if (!highestLevel || permissionLevels[p.level] > permissionLevels[highestLevel]) {
      highestLevel = p.level;
    }
  }

  // مرحله ۳: تصمیم‌گیری نهایی
  const hasRequiredLevel = highestLevel ? (permissionLevels[highestLevel] >= permissionLevels[requiredLevel]) : false;

  return {
    hasAccess: hasRequiredLevel,
    level: highestLevel,
    role: membership.role
  };
}