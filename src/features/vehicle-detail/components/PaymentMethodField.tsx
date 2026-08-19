import { Anchor, Group, Select, Skeleton, Text, Tooltip } from '@mantine/core';

import { useAsync } from '../../../hooks/useAsync';
import { fontWeight } from '../../../styles/fonts';
import { layout } from '../../../styles/layouts';
import { invalidatePaymentMethods, loadPaymentMethods } from '../../../services/bidding';

/**
 * Sentinel for the inert last row of the dropdown. It is never a valid value —
 * the option carrying it is disabled — but it needs an id to be a row at all.
 */
const ADD_METHOD = '__add_payment_method__';

interface PaymentMethodFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Set once the methods arrive, so the form can preselect the default. */
  onLoaded: (defaultId: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Which account a winning bid gets charged to.
 *
 * Saved methods only. Adding one means collecting a card number, and this
 * prototype has no backend to send it to and no business holding it — so both
 * affordances for it, the line above the field and the last row of the
 * dropdown, are present but inert rather than live-looking controls that do
 * nothing. The dropdown row is `disabled`, which is what keeps it unselectable:
 * picking it would put a value in `paymentMethodId` that the auction rejects.
 *
 * The list is fetched rather than hardcoded because payment methods belong to
 * the buyer, not the page. It comes through `useAsync` like every other read.
 */
export function PaymentMethodField({
  value,
  onChange,
  onLoaded,
  error,
  disabled,
}: PaymentMethodFieldProps) {
  const {
    data: methods,
    loading,
    error: loadError,
  } = useAsync(
    () =>
      loadPaymentMethods().then((loaded) => {
        const fallback = loaded.find((method) => method.isDefault) ?? loaded[0];
        if (fallback) onLoaded(fallback.id);
        return loaded;
      }),
    'payment-methods',
  );

  if (loading) {
    return <Skeleton height={layout.inputHeight} radius="md" />;
  }

  if (loadError || !methods) {
    return (
      <Text fz="sm" c="red">
        Could not load your payment methods.{' '}
        <Anchor
          component="button"
          type="button"
          fz="sm"
          onClick={() => {
            invalidatePaymentMethods();
            // Remount is the retry: useAsync keys off a constant here, so
            // clearing the cache and asking the parent to re-render is enough.
            onChange(null);
          }}
        >
          Try again
        </Anchor>
      </Text>
    );
  }

  return (
    <div>
      <Group justify="space-between" align="baseline" gap={layout.inlineGap}>
        <Text fz="sm" fw={fontWeight.semibold}>
          Payment Method{' '}
          <Text span c="red" aria-hidden>
            *
          </Text>
        </Text>

        <Tooltip label="Saved methods only in this prototype" withArrow>
          <Text fz="xs" c="dimmed">
            Add new payment method
          </Text>
        </Tooltip>
      </Group>

      <Select
        mt={layout.tightGap}
        data={[
          ...methods.map((method) => ({
            value: method.id,
            label: `${method.label} · ${method.detail}`,
          })),
          { value: ADD_METHOD, label: 'Add new payment method', disabled: true },
        ]}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
        allowDeselect={false}
        aria-label="Payment method"
        placeholder="Choose an account"
        comboboxProps={{ withinPortal: true }}
      />
    </div>
  );
}
