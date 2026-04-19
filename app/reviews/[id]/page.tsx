"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id;

  useEffect(() => {
    // Redirect to overview tab by default
    router.replace(`/reviews/${reviewId}/overview`);
  }, [reviewId, router]);

  return null;
}
