export interface Animal {
  id: string;
  farm_id: string;
  tag_id: string;
  rfid?: string | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  sex: 'male' | 'female';
  birth_date?: string | null;
  parent_sire_id?: string | null;
  parent_dam_id?: string | null;
  color?: string | null;
  markings?: string | null;
  tracking_type: 'individual' | 'batch';
  status: 'active' | 'sold' | 'deceased' | 'culled';
  created_at: string;
  updated_at: string;
}

export interface CreateAnimalData {
  tag_id: string;
  species: string;
  rfid?: string;
  name?: string;
  breed?: string;
  sex: 'male' | 'female';
  birth_date?: string;
  parent_sire_id?: string;
  parent_dam_id?: string;
  color?: string;
  markings?: string;
  tracking_type: 'individual' | 'batch';
}

export interface UpdateAnimalData extends Partial<CreateAnimalData> {
  id: string;
  status?: 'active' | 'sold' | 'deceased' | 'culled';
}

export interface AnimalState {
  animals: Animal[];
  currentAnimal: Animal | null;
  isLoading: boolean;
  error: string | null;
}

export interface AnimalMovement {
  id: string;
  animal_id: string;
  from_group_id?: string | null;
  to_group_id?: string | null;
  reason?: string | null;
  notes?: string | null;
  moved_at: string;
  performed_by?: string | null;
}

export interface LogAnimalMovementRequest {
  from_group_id?: string | null;
  to_group_id?: string | null;
  reason: string;
  notes?: string | null;
  moved_at?: string | null;
}

