import { createFileRoute } from '@tanstack/react-router';
import { EnrollmentDetail } from '@/pages/enrollment/EnrollmentDetailPage';

interface StudentDetailSearch {
  year?: number;
}

export const Route = createFileRoute('/dashboard/enrollment/student/$id/')({
  validateSearch: (search: Record<string, unknown>): StudentDetailSearch => {
    return {
      year: search.year ? Number(search.year) : undefined,
    };
  },
  component: EnrollmentDetail,
});
