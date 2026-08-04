export interface ICreateBooking {
  serviceId: string;
  scheduledAt: string; 
  address: string;
  notes?: string;
}

export interface IupdateBookingStatus {
  status: string;
}

export interface ICancelBooking {
  cancelReason?: string;
}