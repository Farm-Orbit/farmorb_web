export interface Group {
  id: string;
  farm_id: string;
  name: string;
  purpose?: string;
  description?: string;
  location?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  purpose?: string;
  description?: string;
  location?: string;
  color?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  purpose?: string;
  description?: string;
  location?: string;
  color?: string;
}

export interface GroupResponse {
  success: boolean;
  message: string;
  data: Group;
}

export interface AnimalGroupRelation {
  id: string;
  animal_id: string;
  group_id: string;
  added_at: string;
  added_by?: string;
  notes?: string;
}

export interface AddAnimalToGroupRequest {
  notes?: string;
}

export interface BulkAddAnimalsRequest {
  animal_ids: string[];
  notes?: string;
}

