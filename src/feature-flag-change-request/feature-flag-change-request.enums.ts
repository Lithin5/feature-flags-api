export enum FeatureFlagRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum FeatureFlagRequestType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
