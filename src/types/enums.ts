// Show Status Workflow - mirrors TradeShow.ShowStatusValue
export enum ShowStatus {
  Planning = 'Planning',
  Logistics = 'Logistics',
  Ready = 'Ready',
  Active = 'Active',
  PostShow = 'Post-Show',
  Closed = 'Closed',
}

export const showStatusColors: Record<ShowStatus, string> = {
  [ShowStatus.Planning]: '#8250DF',
  [ShowStatus.Logistics]: '#BF8700',
  [ShowStatus.Ready]: '#1A7F37',
  [ShowStatus.Active]: '#0969DA',
  [ShowStatus.PostShow]: '#CF222E',
  [ShowStatus.Closed]: '#656D76',
};

// View Mode - mirrors ViewMode enum
export enum ViewMode {
  Dashboard = 'Dashboard',
  QuickLook = 'Quick Look',
  List = 'List',
  Calendar = 'Calendar',
  Budget = 'Budget',
}

export const viewModeIcons: Record<ViewMode, string> = {
  [ViewMode.Dashboard]: 'LayoutDashboard',
  [ViewMode.QuickLook]: 'LayoutGrid',
  [ViewMode.List]: 'List',
  [ViewMode.Calendar]: 'Calendar',
  [ViewMode.Budget]: 'BarChart3',
};

// Toast notification types
export enum ToastType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

// Date range filter - mirrors TradeShowViewModel.DateRange
export enum DateRange {
  All = 'All Dates',
  ThisMonth = 'This Month',
  Next30Days = 'Next 30 Days',
  Next90Days = 'Next 90 Days',
}

// Budget timeframe - mirrors BudgetView.Timeframe
export enum BudgetTimeframe {
  Quarter = 'Quarter',
  Year = 'Year',
  All = 'All Time',
  Custom = 'Custom',
}

// Export fields - mirrors ExportField enum
export enum ExportField {
  Name = 'Name',
  Location = 'Location',
  StartDate = 'Start Date',
  EndDate = 'End Date',
  BoothNumber = 'Booth Number',
  Cost = 'Cost',
  RegistrationConfirmed = 'Registration Confirmed',
  HotelName = 'Hotel Name',
  HotelConfirmed = 'Hotel Confirmed',
  HotelCostPerNight = 'Hotel Cost/Night',
  ShippingCutoff = 'Shipping Cutoff',
  ShippingCost = 'Shipping Cost',
  TrackingNumber = 'Tracking Number',
  ManagementCompany = 'Management Company',
  ShowContactName = 'Contact Name',
  ShowContactEmail = 'Contact Email',
  TotalLeads = 'Total Leads',
  TotalAttending = 'Total Attending',
  ShowStatus = 'Show Status',
  QualifiedLeads = 'Qualified Leads',
  MeetingsBooked = 'Meetings Booked',
  DealsWon = 'Deals Won',
  RevenueAttributed = 'Revenue Attributed',
  GeneralNotes = 'General Notes',
}

// Alert types for dashboard
export enum AlertType {
  RegistrationNeeded = 'registrationNeeded',
  ShippingDeadline = 'shippingDeadline',
  HotelNotConfirmed = 'hotelNotConfirmed',
  NoBoothSelected = 'noBoothSelected',
}

export enum AlertPriority {
  Low = 1,
  Medium = 2,
  High = 3,
}

// Sort direction for list view
export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}
