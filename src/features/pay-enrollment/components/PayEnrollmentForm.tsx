import { useState, type SubmitEvent } from 'react';
import { DollarSign, Check, AlertCircle } from 'lucide-react';
import { usePayEnrollment } from '../hooks/usePayEnrollment';
import type { StudentBalance } from '@/entities/student/model/types';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { useToast } from '@/shared/ui';
import type { Asign } from '../types';

interface PayEnrollmentFormProps {
  balance: StudentBalance;
  onPaymentSuccess: () => Promise<void>;
}

export const PayEnrollmentForm = ({ balance, onPaymentSuccess }: PayEnrollmentFormProps) => {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(() => {
    const initialAmounts: Record<string, string> = {};
    if (balance.pendiente_base > 0) {
      initialAmounts.matricula_base = balance.pendiente_base.toString();
    }
    balance.complementarios.forEach((c) => {
      if (c.valor_pendiente > 0) {
        initialAmounts[`comp_${c.detalle_id.toString()}`] = c.valor_pendiente.toString();
      }
    });
    return initialAmounts;
  });
  const { submitPayment, loading: paymentLoading } = usePayEnrollment();
  const { showToast } = useToast();

  const handleAmountChange = (key: string, val: string) => {
    setPaymentAmounts((prev) => ({ ...prev, [key]: val }));
  };

  // Items with pending debt
  const debtItems: { id: string; label: string; max: number }[] = [];
  if (balance.pendiente_base > 0) {
    debtItems.push({ id: 'matricula_base', label: 'Matrícula Base', max: balance.pendiente_base });
  }
  balance.complementarios.forEach((c) => {
    if (c.valor_pendiente > 0) {
      debtItems.push({
        id: `comp_${c.detalle_id.toString()}`,
        label: c.tipo_complementario,
        max: c.valor_pendiente,
      });
    }
  });

  const totalSum = debtItems.reduce((acc, item) => acc + Number(paymentAmounts[item.id] || 0), 0);

  const handlePayment = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!receiptNumber) return;

    try {
      const asignaciones: Asign[] = [];
      for (const key in paymentAmounts) {
        const monto = Number(paymentAmounts[key]);
        if (monto > 0) {
          if (key === 'matricula_base') {
            asignaciones.push({ concepto: 'matricula_base', monto });
          } else if (key.startsWith('comp_')) {
            const detalleId = Number(key.split('_')[1]);
            const comp = balance.complementarios.find((c) => c.detalle_id === detalleId);
            if (comp) {
              asignaciones.push({
                concepto: 'complementario',
                complementario_id: comp.complementario_id,
                detalle_id: comp.detalle_id,
                monto,
              });
            }
          }
        }
      }

      if (asignaciones.length === 0) {
        showToast('Debe ingresar al menos un monto para pagar.', 'error');
        return;
      }

      if (balance.pagos_realizados === 3 && totalSum !== balance.total_pendiente) {
        showToast(
          `Para el cuarto pago, debe cancelar la totalidad del saldo pendiente ($${balance.total_pendiente.toLocaleString('es-CO')}).`,
          'error',
        );
        return;
      }

      const matriculaId = balance.matricula_id ?? balance.estudiante.id;

      await submitPayment({
        matricula_id: matriculaId,
        asignaciones,
        codigo_talonario: receiptNumber,
        observacion: 'Pago registrado desde portal administrativo',
      });

      setReceiptNumber('');
      await onPaymentSuccess();
      showToast('Pago registrado exitosamente.', 'success');
    } catch (error) {
      console.error('Error registering payment:', error);
      showToast('Error al registrar pago. Por favor revise el log.', 'error');
    }
  };

  if (balance.total_pendiente <= 0) return null;

  // If already reached limit of 4 payments
  if (balance.pagos_realizados >= 4) {
    return (
      <div className="card" style={{ border: '1px solid var(--status-red-bg)' }}>
        <h3
          className="search-header"
          style={{ color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertCircle size={20} /> Límite de Pagos Parciales Alcanzado
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Se ha alcanzado el límite máximo de 4 pagos para esta matrícula. Actualmente hay{' '}
          <strong>{balance.pagos_realizados}</strong> pagos registrados y un saldo restante de{' '}
          <strong>${balance.total_pendiente.toLocaleString('es-CO')}</strong>. Comuníquese con
          administración.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="search-header">
        <DollarSign size={20} /> Registrar Pago
      </h3>

      <form
        onSubmit={(e) => {
          void handlePayment(e);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ maxWidth: '300px' }}>
          <Input
            label="Número de Tirilla *"
            placeholder="Ingrese número de tirilla"
            required
            value={receiptNumber}
            onChange={(e) => {
              setReceiptNumber(e.target.value);
            }}
          />
        </div>

        {balance.pagos_realizados === 3 && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--status-yellow-bg)',
              color: 'var(--status-yellow)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Este es el cuarto pago. Por política del sistema, debe cancelar la totalidad del saldo
            pendiente. Los montos han sido bloqueados a su valor restante.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '8px',
          }}
        >
          {debtItems.map((item) => (
            <Input
              key={item.id}
              label={`Monto a Pagar (${item.label})`}
              type="number"
              placeholder="0"
              min={0}
              max={item.max}
              value={paymentAmounts[item.id] ?? ''}
              onChange={(e) => {
                handleAmountChange(item.id, e.target.value);
              }}
              disabled={balance.pagos_realizados === 3}
            />
          ))}
        </div>

        {totalSum > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: 'var(--status-gray-bg, #f8fafc)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              Desglose del Pago a Registrar
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {debtItems.map((item) => {
                const amount = Number(paymentAmounts[item.id] || 0);
                if (amount <= 0) return null;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      ${amount.toLocaleString('es-CO')}
                    </span>
                  </div>
                );
              })}

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--brand-primary)',
                }}
              >
                <span>Total a Registrar</span>
                <span>${totalSum.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px' }}>
          <Button type="submit" variant="primary" disabled={paymentLoading}>
            <Check size={16} style={{ marginRight: '8px' }} />
            Registrar Pago
          </Button>
        </div>
      </form>
    </div>
  );
};
