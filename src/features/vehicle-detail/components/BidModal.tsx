import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { Money } from '../../../components/common/Money';
import { SpecList } from '../../../components/common/SpecList';
import type { LotStanding } from '../../../hooks/useLiveLot';
import { placeBid } from '../../../services/bidding';
import { recordReceipt } from '../../../store/bidStore';
import { fontWeight } from '../../../styles/fonts';
import { layout } from '../../../styles/layouts';
import type { BidReceipt, BidServiceId } from '../../../types/bid';
import type { Vehicle } from '../../../types/vehicle';
import {
  BID_INCREMENT,
  bidServices,
  bidTotal,
  displayBid,
  isOnIncrement,
  isValidBid,
  isValidMaxBid,
  minimumNextBid,
  servicesTotal,
} from '../../../utils/bidding';
import { formatCurrency } from '../../../utils/currency';
import { BidServices } from './BidServices';
import { PaymentMethodField } from './PaymentMethodField';
import classes from './BidModal.module.css';

/** Free-text field, capped so a note cannot become a payload. */
const NOTES_MAX = 280;

/**
 * Note what is *not* here: the selected services. They live in their own state
 * beside the form, because they feed the running total and Mantine's
 * uncontrolled mode exists so the inputs do not re-render on every keystroke.
 */
interface BidFormValues {
  /** NumberInput hands back '' while the field is empty. */
  amount: number | string;
  maxAmount: number | string;
  notes: string;
  paymentMethodId: string | null;
}

/** '' and partial input both mean "no number here yet", not zero. */
function toNumber(value: number | string): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface BidModalProps {
  /** Already merged with the feed by `useLiveLot` — see `VehicleDetailModal`. */
  vehicle: Vehicle;
  standing: LotStanding;
  opened: boolean;
  onClose: () => void;
}

/**
 * The bid form, stacked over the detail modal.
 *
 * Held in the detail modal's own state rather than given a route: a half-filled
 * bid form is not a thing anyone should be able to link someone else to, and
 * unlike the vehicle itself it has nothing worth restoring on reload.
 *
 * Every rule the form enforces comes from `utils/bidding.ts` — the floor, the
 * increment, the fees, the total. Nothing is computed inline here, so the same
 * numbers hold whether they are being validated, priced, or rendered.
 *
 * On success the form is replaced by its receipt rather than the modal closing.
 * A bid is the one irreversible thing a buyer does in this app, and dismissing
 * the dialog the instant it lands leaves them with no confirmation that it did.
 *
 * The lot arrives already merged with the feed, so the headline figure and the
 * minimum both move while the form is open. Nothing is corrected under the
 * buyer's cursor when they do: the amount they typed stays typed, and being
 * outbid mid-form surfaces as the validation message on submit, which is the
 * same message a too-low bid has always produced.
 */
export function BidModal({
  vehicle,
  standing,
  opened,
  onClose,
}: BidModalProps) {
  const minimum = minimumNextBid(vehicle);
  const services = useMemo(() => bidServices(vehicle), [vehicle]);

  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<BidReceipt | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  /*
   * Services and the running amount are held outside the form rather than in
   * it. Both feed the total, which has to re-render on every keystroke, and
   * Mantine's uncontrolled mode exists precisely so the inputs do not. Keeping
   * the two apart means typing an amount repaints one line instead of the form.
   */
  const [selected, setSelected] = useState<BidServiceId[]>([]);
  const [amountShown, setAmountShown] = useState<number>(minimum);

  const form = useForm<BidFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      amount: minimum,
      maxAmount: '',
      notes: '',
      paymentMethodId: null,
    },
    validate: {
      amount: (value) => {
        const amount = toNumber(value);
        if (amount === null) return 'Enter an amount';
        if (!isValidBid(vehicle, amount)) {
          return `The minimum bid is ${formatCurrency(minimum)}`;
        }
        if (!isOnIncrement(amount)) {
          return `Bids move in ${formatCurrency(BID_INCREMENT)} steps`;
        }
        return null;
      },
      // Optional: an empty maximum means "this bid and no more".
      maxAmount: (value, values) => {
        const max = toNumber(value);
        if (max === null) return null;

        const amount = toNumber(values.amount);
        if (amount !== null && !isValidMaxBid(amount, max)) {
          return 'Your maximum cannot sit below your bid';
        }
        if (!isOnIncrement(max)) {
          return `Bids move in ${formatCurrency(BID_INCREMENT)} steps`;
        }
        return null;
      },
      paymentMethodId: (value) =>
        value === null ? 'Choose how a win would be charged' : null,
    },
  });

  /*
   * The minimum as of the last render, for the reset below to start from.
   *
   * It has to be a ref rather than a dependency now that the feed moves the
   * lot's figure: a rival bid landing while someone is filling the form would
   * otherwise re-run the reset and wipe what they had typed. The minimum they
   * are held to is still the live one — validation reads `minimum` directly —
   * this only decides what the field is pre-filled with when the form opens.
   */
  const openingMinimum = useRef(minimum);
  openingMinimum.current = minimum;

  const resetForm = () => {
    form.setInitialValues({
      amount: openingMinimum.current,
      maxAmount: '',
      notes: '',
      paymentMethodId: form.getValues().paymentMethodId,
    });
    form.reset();
    setSelected([]);
    setAmountShown(openingMinimum.current);
    setFailure(null);
    setReceipt(null);
  };

  /*
   * Reset per opening, and per lot. This component stays mounted between both —
   * the detail modal owns it — so without this a buyer who cancels on one lot
   * and bids on the next starts from the previous lot's amount, which is very
   * likely invalid and, if it happens not to be, wrong by thousands.
   *
   * The chosen payment method survives on purpose: it is a property of the
   * buyer, not of the lot, and re-picking it per bid is the kind of friction
   * that gets a form abandoned.
   */
  useEffect(() => {
    if (!opened) return;
    resetForm();
    // `form` is a new object each render, so listing it here would reset the
    // fields out from under whoever is typing in them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, vehicle.id]);

  // A submit that outlives its dialog has nowhere left to report back to.
  useEffect(() => () => inFlight.current?.abort(), []);

  const extras = servicesTotal(services, selected);
  const total = bidTotal(amountShown, services, selected);

  const submit = async (values: BidFormValues) => {
    const amount = toNumber(values.amount);
    if (amount === null || values.paymentMethodId === null) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setSubmitting(true);
    setFailure(null);

    try {
      const acknowledged = await placeBid(
        {
          vehicleId: vehicle.id,
          amount,
          maxAmount: toNumber(values.maxAmount),
          notes: values.notes.trim(),
          services: selected,
          paymentMethodId: values.paymentMethodId,
        },
        controller.signal,
      );
      /*
       * Into the store before it goes on screen. The receipt is this buyer's
       * own record of the bid — where the lot stands afterwards arrives on the
       * feed, and the store is where the two are held side by side so the rest
       * of the app can tell them apart.
       */
      recordReceipt(acknowledged);
      setReceipt(acknowledged);
    } catch (error) {
      // An aborted request was cancelled by us, not refused by the auction.
      if (controller.signal.aborted) return;
      setFailure(error as Error);
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };

  const amountField = form.getInputProps('amount');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={receipt ? 'Bid placed' : 'Place a bid'}
      size="md"
      centered
      // Nothing dismisses this while a bid is in the air. The request would
      // still land; the buyer would just never learn whether it did.
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      withCloseButton={!submitting}
    >
      {receipt ? (
        <Stack gap={layout.sectionGap}>
          <Text fz="sm">
            The auction accepted your bid on the {vehicle.year} {vehicle.make}{' '}
            {vehicle.model}, lot {vehicle.lot}.
          </Text>

          <SpecList
            items={[
              { label: 'Bid', value: <Money value={receipt.amount} /> },
              {
                label: 'Maximum',
                value:
                  receipt.maxAmount === null ? (
                    'No proxy bidding'
                  ) : (
                    <Money value={receipt.maxAmount} />
                  ),
              },
              { label: 'Services', value: <Money value={extras} /> },
              { label: 'Reference', value: receipt.bidId, mono: true },
            ]}
          />

          {/*
            Accepted is not the same as winning, and the gap between them is
            worth saying out loud rather than leaving a buyer to assume. The
            receipt above is fixed — it is what this buyer bid — and the alert
            below is not, because it reports where the lot stands, which is the
            feed's to say and can change while this dialog sits open.
          */}
          {standing === 'high' && (
            <Alert
              color="var(--app-status-positive)"
              title="You hold the high bid"
            >
              The auction has this lot at{' '}
              {formatCurrency(displayBid(vehicle))}. If another bidder takes it
              past you, this will say so without you having to reload.
            </Alert>
          )}

          {standing === 'outbid' && (
            <Alert
              color="var(--app-status-caution)"
              title="You have been outbid"
            >
              Another bidder has taken this lot to{' '}
              {formatCurrency(displayBid(vehicle))}. Your bid stands as placed —
              it is simply no longer the one in front.
            </Alert>
          )}

          {standing === undefined && (
            <Alert color="lane" title="Accepted, not yet confirmed as high bid">
              Where this leaves you against the other bidders comes back on the
              auction&rsquo;s live feed, separately from this acknowledgement.
            </Alert>
          )}

          <Group justify="flex-end" gap={layout.inlineGap}>
            {standing === 'outbid' && (
              <Button variant="default" onClick={resetForm}>
                Bid again
              </Button>
            )}
            <Button onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(submit)} noValidate>
          <Stack gap={layout.fieldGap}>
            {/*
              Where the lot stands, before anything asks the buyer for a number.
              Always "Current Bid" — the lot is necessarily live to reach this
              form, and on a live lot with no bids yet the starting bid *is* the
              current bid: it is the number you have to beat right now. Whether
              anyone has bid is a separate fact, and the card already reports it
              as a bid count.
            */}
            <Stack gap={layout.tightGap}>
              <Text fz="sm" fw={fontWeight.semibold}>
                Current Bid
              </Text>
              <Money
                value={displayBid(vehicle)}
                fz="h2"
                fw={fontWeight.bold}
              />
            </Stack>

            <Text fz="sm" c="dimmed">
              Minimum bid is {formatCurrency(minimum)}
            </Text>

            <NumberInput
              label="Bid Amount"
              withAsterisk
              hideControls
              thousandSeparator=","
              allowDecimal={false}
              allowNegative={false}
              step={BID_INCREMENT}
              min={minimum}
              // Nothing is clamped as the buyer types. Correcting someone's
              // number under their cursor is worse than telling them it is
              // wrong when they submit.
              clampBehavior="none"
              leftSection="$"
              leftSectionWidth={layout.currencyPrefixWidth}
              classNames={{
                section: classes.currencySection,
                input: classes.currencyInput,
              }}
              disabled={submitting}
              key={form.key('amount')}
              {...amountField}
              onChange={(value) => {
                amountField.onChange?.(value);
                setAmountShown(toNumber(value) ?? 0);
              }}
            />

            <NumberInput
              label="Max Bid Amount"
              description="Optional. The auction bids up to this on your behalf."
              hideControls
              thousandSeparator=","
              allowDecimal={false}
              allowNegative={false}
              step={BID_INCREMENT}
              clampBehavior="none"
              leftSection="$"
              leftSectionWidth={layout.currencyPrefixWidth}
              classNames={{
                section: classes.currencySection,
                input: classes.currencyInput,
              }}
              disabled={submitting}
              key={form.key('maxAmount')}
              {...form.getInputProps('maxAmount')}
            />

            <Textarea
              label="Notes"
              description="Only you and the auction rep see these."
              autosize
              minRows={2}
              maxRows={4}
              maxLength={NOTES_MAX}
              disabled={submitting}
              key={form.key('notes')}
              {...form.getInputProps('notes')}
            />

            <BidServices
              services={services}
              selected={selected}
              onChange={setSelected}
            />

            <PaymentMethodField
              value={form.getValues().paymentMethodId}
              onChange={(value) => form.setFieldValue('paymentMethodId', value)}
              onLoaded={(defaultId) => {
                if (form.getValues().paymentMethodId === null) {
                  form.setFieldValue('paymentMethodId', defaultId);
                }
              }}
              error={form.errors.paymentMethodId as string | undefined}
              disabled={submitting}
            />

            <Divider className={classes.total} />

            <Group justify="space-between" align="baseline" wrap="nowrap">
              <Stack gap={0}>
                <Text fz="sm" fw={fontWeight.semibold}>
                  Total if You Win
                </Text>
                <Text fz="xs" c="dimmed">
                  Bid {formatCurrency(amountShown)}
                  {extras > 0 && ` + ${formatCurrency(extras)} services`}
                </Text>
              </Stack>
              <Money value={total} fz="xl" fw={fontWeight.bold} />
            </Group>

            {failure && (
              <Alert color="red" title="The auction did not take that bid">
                {failure.message}
              </Alert>
            )}

            <Group justify="flex-end" gap={layout.inlineGap}>
              <Button variant="default" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Place bid
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
