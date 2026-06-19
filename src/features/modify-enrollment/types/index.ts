export interface ComplementaryConcept {
  id: number;
  tipo_complementario: string;
  anio: number;
  valor: number;
  estado_complemento: string;
}

export interface CreateComplementaryPayload {
  nombre: string;
  anio: number;
  valor: number;
  estado_complemento: string;
}

export interface ModifyEnrollmentResponse {
  mensaje: string;
  matricula_id: number;
  nuevo_valor_total: number;
  motivo_registrado: string;
  observaciones_registradas?: string | null;
}
