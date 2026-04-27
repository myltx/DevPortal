export interface ClassInfo {
  id: number;
  name: string;
}

export interface Area {
  id: number;
  name: string;
  code: string;
  sort: number;
  _count?: {
    projects: number;
    modules: number;
  };
}

export interface Project {
  id: number;
  name: string;
  classId: number;
  areaId: number | null;
  sort: number;
  area?: Area;
}

export interface ProjectModule {
  id?: number;
  moduleId?: number;
  projectId?: number;
  moduleName: string;
  describe?: string;
  areaId?: number | null;
  sort?: number;
  // Frontend/Form properties
  isNew?: boolean;
}

export interface Account {
  id: number;
  account?: string;
  password?: string;
  accountInfo?: string;
  remark?: string;
  moduleId: number;
  // Frontend properties
  isNew?: boolean;
}

export interface EnvOption {
  label: string;
  value: string;
  color: string;
}
