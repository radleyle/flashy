'use client';

import { Suspense } from 'react';
import StudyPageInner from './StudyPageInner';
import StudyShell from '@/components/layout/StudyShell';
import Skeleton from '@/components/ui/Skeleton';
import KeyboardTips from '@/components/study/KeyboardTips';

function StudyFallback() {
  return (
    <StudyShell title="Study" right={<KeyboardTips />}>
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    </StudyShell>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<StudyFallback />}>
      <StudyPageInner />
    </Suspense>
  );
}
