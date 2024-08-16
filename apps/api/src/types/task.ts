export type TaskPayload = {
  title: string;
  description: string;
  client_assignment_id: string;
};

export type TaskUpdatePayload = {
  title: string;
  description: string;
  deadline?: Date;
};
