import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const MedicineCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-6 w-1/3 mb-2" />
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

export const DoctorCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

export const LabTestCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className={`h-8 ${colIndex === 0 ? 'w-1/4' : 'w-1/6'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

export const OrderCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-1/6" />
      </div>
      <Skeleton className="h-3 w-1/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-8 w-1/6" />
      </div>
    </CardContent>
  </Card>
);

export const ConsultationCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-1/6" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/4" />
        </div>
      </div>
    </CardContent>
  </Card>
);