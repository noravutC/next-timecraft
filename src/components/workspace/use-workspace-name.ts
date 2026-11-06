'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganizationStore } from '@/store/use-organization.store';

/**
 * ชื่อ workspace (organization) ของคนที่ล็อกอินอยู่ — โหลดครั้งเดียวจาก
 * organizationId ใน session แล้วเก็บใน useOrganizationStore
 * คืน null ระหว่างโหลดหรือโหลดไม่สำเร็จ (ห้ามเดาชื่อ)
 */
export function useWorkspaceName(): string | null {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId ?? null;
  const organization = useOrganizationStore((s) => s.organization);
  const status = useOrganizationStore((s) => s.status);
  const fetchUserOrganization = useOrganizationStore(
    (s) => s.fetchUserOrganization,
  );

  const loaded = organization !== null && organization.id === orgId;

  // โหลดเฉพาะตอน store ยังว่าง (status 'none') — error แล้วไม่วนยิงซ้ำ
  useEffect(() => {
    if (!orgId || loaded || status !== 'none') return;
    fetchUserOrganization(orgId).catch(() => {});
  }, [orgId, loaded, status, fetchUserOrganization]);

  return loaded ? organization.name : null;
}
