export interface GroupContextData {
  id: string;
  name: string;
  isAdmin: boolean;
  isMember?: boolean;
  memberStatus?: string;
}