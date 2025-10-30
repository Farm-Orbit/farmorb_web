export interface Herd {
  id: string;
  farm_id: string;
  name: string;
  purpose?: string | null;
  location?: string | null;
  species_type: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHerdData {
  name: string;
  purpose?: string;
  location?: string;
  species_type: 'mammal' | 'poultry';
  description?: string;
}

export interface UpdateHerdData extends Partial<CreateHerdData> {
  id: string;
}

export interface HerdListResponse {
  herds: Herd[];
  total: number;
}

export interface HerdState {
  herds: Herd[];
  currentHerd: Herd | null;
  isLoading: boolean;
  error: string | null;
}

