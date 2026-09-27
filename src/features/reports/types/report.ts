export interface ReportScope {
  branchId?: string;
  scope?: 'all';
}
export interface ReportRange extends ReportScope {
  fromDate: string;
  toDate: string;
}
export interface DashboardReport {
  summary: {
    visitsToday: number;
    completedTreatmentsToday: number;
    revenueRecordedToday: string;
    activeVisits: number;
    paidVisitsToday: number;
    unpaidCompletedVisits: number;
  };
  topTreatments: Array<{ name: string; treatmentsCompleted: number }>;
  topProviders: ProviderPerformanceRow[];
}
export interface SalonReport {
  summary: {
    visits: number;
    completedVisits: number;
    completedTreatments: number;
    revenueRecorded: string;
    paidVisits: number;
    unpaidCompletedVisits: number;
    averageVisitValue: string | null;
  };
  breakdown: Array<{ date: string; visits: number; treatments: number; revenue: string }>;
}
export interface ProviderPerformanceRow {
  providerId: string;
  providerName: string;
  uniqueVisits: number;
  treatmentsCompleted: number;
  cancelledTreatments: number;
  revenueHandled: string;
  averageTreatmentValue: string | null;
  mostPerformedTreatment: string | null;
}
export interface ServicePerformanceRow {
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  treatmentsCompleted: number;
  uniqueVisits: number;
  revenueHandled: string;
  averageTreatmentValue: string | null;
}
