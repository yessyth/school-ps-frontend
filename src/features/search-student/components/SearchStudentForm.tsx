import { useState, useCallback, useEffect, useRef, type SubmitEvent } from 'react';
import { Search } from 'lucide-react';
import { useSearchStudents } from '../hooks/useSearchStudents';
import type { StudentSearchItem } from '@/entities/student/model/types';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';

import { enrollmentApi } from '@/entities/student/api/enrollment';

interface SearchStudentFormProps {
  onSearchSuccess: (students: StudentSearchItem[]) => void;
  onSearchStart: () => void;
  onSearchEnd: () => void;
}

export const SearchStudentForm = ({
  onSearchSuccess,
  onSearchStart,
  onSearchEnd,
}: SearchStudentFormProps) => {
  const { loading, fetchStudents } = useSearchStudents();
  const [filters, setFilters] = useState({ documento: '', nombre: '', year: '' });
  const [years, setYears] = useState<number[]>(() => [new Date().getFullYear()]);
  const mountedRef = useRef(true);

  const executeSearch = useCallback(
    async (isInitial = false) => {
      onSearchStart();
      try {
        const params: { documento?: string; nombre?: string; year?: number } = {};
        if (!isInitial) {
          if (filters.documento) params.documento = filters.documento;
          if (filters.nombre) params.nombre = filters.nombre;
          if (filters.year) {
            const parsedYear = parseInt(filters.year, 10);
            if (!isNaN(parsedYear)) {
              params.year = parsedYear;
            }
          }
        }
        const data = await fetchStudents(params);
        if (mountedRef.current && data) {
          onSearchSuccess(data.estudiantes);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        if (mountedRef.current) {
          onSearchEnd();
        }
      }
    },
    [
      filters.documento,
      filters.nombre,
      filters.year,
      onSearchStart,
      onSearchEnd,
      onSearchSuccess,
      fetchStudents,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;

    enrollmentApi
      .getComplementaryConcepts()
      .then((concepts) => {
        if (mountedRef.current) {
          const dbYears = concepts.map((c) => c.anio);
          const uniqueYears = Array.from(new Set([...dbYears, new Date().getFullYear()]));
          uniqueYears.sort((a, b) => b - a);
          setYears(uniqueYears);
        }
      })
      .catch((err: unknown) => {
        console.error('Error fetching academic years:', err);
      });

    void executeSearch(true);
    return () => {
      mountedRef.current = false;
    };
  }, [executeSearch]);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    void executeSearch(false);
  };

  const handleClear = () => {
    setFilters({ documento: '', nombre: '', year: '' });
    onSearchStart();
    fetchStudents({})
      .then((data) => {
        if (mountedRef.current && data) {
          onSearchSuccess(data.estudiantes);
        }
      })
      .catch((error: unknown) => {
        console.error('Error clearing search:', error);
      })
      .finally(() => {
        if (mountedRef.current) {
          onSearchEnd();
        }
      });
  };

  return (
    <div className="card">
      <h3 className="search-header">
        <Search size={20} /> Filtros de búsqueda
      </h3>
      <div className="search-info">
        Ingrese el código, nombre del estudiante o seleccione el año lectivo para iniciar la
        búsqueda
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end',
          }}
        >
          <Input
            label="Código"
            placeholder="Ej. 123123"
            value={filters.documento}
            onChange={(e) => {
              setFilters({ ...filters, documento: e.target.value });
            }}
          />
          <Input
            label="Nombre"
            placeholder="Ej. Juan"
            value={filters.nombre}
            onChange={(e) => {
              setFilters({ ...filters, nombre: e.target.value });
            }}
          />
          <div className="input-container">
            <label className="input-label">Año Lectivo</label>
            <select
              value={filters.year}
              onChange={(e) => {
                setFilters({ ...filters, year: e.target.value });
              }}
              className="input-field"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Todos los años</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="outline" onClick={handleClear} disabled={loading}>
              Limpiar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              <Search size={16} style={{ marginRight: '8px' }} />
              Buscar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
