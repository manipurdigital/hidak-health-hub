
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DoctorSidebar } from '@/components/DoctorSidebar';
import DoctorDashboardPage from '@/pages/doctor/DoctorDashboardPage';
import DoctorProfilePage from '@/pages/doctor/DoctorProfilePage';
import DoctorConsultationDetailPage from '@/pages/doctor/DoctorConsultationDetailPage';
import DoctorAppointmentsPage from '@/pages/doctor/DoctorAppointmentsPage';
import DoctorPrescriptionsPage from '@/pages/doctor/DoctorPrescriptionsPage';
import DoctorCreatePrescriptionPage from '@/pages/doctor/DoctorCreatePrescriptionPage';
import DoctorSelectConsultationPage from '@/pages/doctor/DoctorSelectConsultationPage';
import DoctorAvailabilityPage from '@/pages/doctor/DoctorAvailabilityPage';

export function DoctorLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DoctorSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="ml-4">
                <h1 className="font-semibold">Doctor Portal</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="dashboard" element={<DoctorDashboardPage />} />
              <Route path="appointments" element={<DoctorAppointmentsPage />} />
              <Route path="availability" element={<DoctorAvailabilityPage />} />
              <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
              <Route path="prescriptions/select-consultation" element={<DoctorSelectConsultationPage />} />
              <Route path="prescriptions/create/:consultationId" element={<DoctorCreatePrescriptionPage />} />
              <Route path="profile" element={<DoctorProfilePage />} />
              <Route path="consultation/:consultationId" element={<DoctorConsultationDetailPage />} />
              <Route index element={<DoctorDashboardPage />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
