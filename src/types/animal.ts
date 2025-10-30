export interface Animal {
  id: string;
  herd_id: string;
  tag_id: string;
  name?: string | null;
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
  herd_id?: string; // For moving animals between herds
  status?: 'active' | 'sold' | 'deceased' | 'culled';
}

export interface AnimalListResponse {
  animals: Animal[];
  total: number;
}

export interface AnimalState {
  animals: Animal[];
  currentAnimal: Animal | null;
  isLoading: boolean;
  error: string | null;
}

