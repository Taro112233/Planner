// components/ProfilePage/ProfileSkeleton.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen"
    >
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </motion.div>

        <div className="space-y-6">
          {/* Profile Header Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar Skeleton */}
                  <div className="relative">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>

                  {/* User Info Skeleton */}
                  <div className="flex-1 space-y-3 w-full sm:w-auto">
                    <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
                    
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Info Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-16" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* First Name + Last Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Section Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Email */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Skeleton className="w-5 h-5 rounded shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 shrink-0" />
                </div>

                {/* Role */}
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}