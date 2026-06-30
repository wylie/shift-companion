export type Shift = {
  id: string;
  userId: string;
  departmentId?: string;
  title: string;
  department?: string;
  start: string;
  end: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ShiftAssignment = {
  shiftId: string;
  userId: string;
};
