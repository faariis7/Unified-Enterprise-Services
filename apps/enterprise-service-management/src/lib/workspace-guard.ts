export interface WorkspaceOwnedRecord {
  workspace: { id: string };
}

export function scopeToWorkspace<T extends WorkspaceOwnedRecord>(
  records: readonly T[],
  workspaceId: string,
): T[] {
  return records.filter((record: T) => record.workspace.id === workspaceId);
}

export function verifyWorkspaceOwnership(
  record: WorkspaceOwnedRecord,
  workspaceId: string,
): boolean {
  return record.workspace.id === workspaceId;
}
