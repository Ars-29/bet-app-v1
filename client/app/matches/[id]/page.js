"use client";

import { use } from "react";
import MatchDetailPage from "@/components/match/MatchDetailPage";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function MatchDetail({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add a global error handler for this page
    const handleError = () => {
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="bg-slate-100 min-h-screen p-4">
        <Card className="w-full border-red-200 max-w-3xl mx-auto mt-8">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <p className="text-red-600 font-medium text-xl mb-2">Failed to load match</p>
              <p className="text-gray-600 mb-6">Failed to fetch match data</p>
              <Button onClick={() => router.back()} variant="outline" size="lg" className="mr-2">
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()} variant="default" size="lg">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MatchDetailPage matchId={resolvedParams.id} />;
}
