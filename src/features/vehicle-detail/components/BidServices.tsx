import { Box, Checkbox, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';

import { Money } from '../../../components/common/Money';
import { fontWeight } from '../../../styles/fonts';
import { iconSize, layout } from '../../../styles/layouts';
import type { BidService, BidServiceId } from '../../../types/bid';
import classes from './BidServices.module.css';

function InfoIcon() {
  return (
    <Box
      component="svg"
      className={classes.info}
      width={iconSize.xs}
      height={iconSize.xs}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" fill="currentColor" />
      <path
        d="M12 10.75v6M12 7.25v.01"
        fill="none"
        stroke="var(--app-surface-sunken)"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Box>
  );
}

interface BidServicesProps {
  services: BidService[];
  selected: BidServiceId[];
  onChange: (selected: BidServiceId[]) => void;
}

/**
 * The optional extras a bid can carry: the guarantee, its extension, and
 * transport.
 *
 * One rule drives the whole list — a service with `requires` cannot be selected
 * without its parent, and unticking the parent takes it with it. That is
 * enforced here rather than in the form so a caller cannot produce a selection
 * the fee schedule would price but the auction would reject.
 *
 * Prices sit in a hard right column joined to their labels by a dotted leader.
 * Three rows do not strictly need one, but this list grows and the alternative
 * — price beside label — reflows the column every time a fee changes width.
 */
export function BidServices({ services, selected, onChange }: BidServicesProps) {
  const isSelected = (id: BidServiceId) => selected.includes(id);

  const toggle = (service: BidService, checked: boolean) => {
    if (checked) {
      onChange([...selected, service.id]);
      return;
    }

    // Dropping a parent drops everything that hangs off it.
    const dependents = services
      .filter((candidate) => candidate.requires === service.id)
      .map((candidate) => candidate.id);

    onChange(
      selected.filter((id) => id !== service.id && !dependents.includes(id)),
    );
  };

  return (
    <Paper radius="md" p={layout.cardPadding} bg="var(--app-surface-sunken)">
      <Stack gap={layout.fieldGap}>
        <Text fw={fontWeight.semibold} fz="sm">
          Services
        </Text>

        {services.map((service) => {
          const locked = service.requires !== undefined && !isSelected(service.requires);

          return (
            <div
              key={service.id}
              className={
                service.requires ? `${classes.row} ${classes.nested}` : classes.row
              }
            >
              <Checkbox
                size="sm"
                checked={isSelected(service.id)}
                disabled={locked}
                onChange={(event) => toggle(service, event.currentTarget.checked)}
                aria-describedby={`${service.id}-price`}
                label={
                  <Group gap={layout.microGap} wrap="nowrap" align="center">
                    {service.requires && (
                      <Text span className={classes.arrow} aria-hidden>
                        ↳
                      </Text>
                    )}
                    <Text span fz="sm">
                      {service.label}
                    </Text>
                    {/* The description is a tooltip rather than a line of body
                        copy: three paragraphs of terms under three checkboxes
                        buries the prices, which are what the buyer opened this
                        panel to compare. */}
                    <Tooltip
                      label={service.description}
                      multiline
                      w={layout.proseMaxWidth}
                      withArrow
                      events={{ hover: true, focus: true, touch: true }}
                    >
                      <Box
                        component="span"
                        tabIndex={0}
                        className={classes.infoTrigger}
                        aria-label={`About ${service.label}`}
                      >
                        <InfoIcon />
                      </Box>
                    </Tooltip>
                  </Group>
                }
                classNames={{ label: classes.label }}
              />

              <span className={classes.leader} aria-hidden />

              {/* The id is on a wrapper because Money forwards Mantine style
                  props, not DOM attributes. It is what ties the price to the
                  checkbox for a screen reader, which otherwise hears the
                  service name and no figure. */}
              <span id={`${service.id}-price`}>
                <Money value={service.price} fz="sm" fw={fontWeight.semibold} />
              </span>
            </div>
          );
        })}

        {/* The reference wording here is "selections apply to future bids on
            this vehicle", which promises persistence this prototype has
            nowhere to keep. This says the thing a buyer actually needs to
            know before ticking a $1,450 box. */}
        <Text fz="xs" c="dimmed" ta="center">
          Services are charged only if you win this lot.
        </Text>
      </Stack>
    </Paper>
  );
}
