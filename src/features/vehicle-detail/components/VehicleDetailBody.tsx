import { Accordion, Badge, Grid, Group, List, Text } from '@mantine/core';

import { SpecList } from '../../../components/common/SpecList';
import { ConditionGrade } from '../../../components/common/ConditionGrade';
import { TitleBadge } from '../../../components/common/TitleBadge';
import { layout, space } from '../../../styles/layouts';
import type { Vehicle } from '../../../types/vehicle';
import { formatOdometer } from '../../../utils/odometer';
import { BidBar } from './BidBar';
import { PhotoGallery } from './PhotoGallery';
import { VehicleFacts } from './VehicleFacts';

interface VehicleDetailBodyProps {
  vehicle: Vehicle;
  onPlaceBid: () => void;
}

/**
 * Photos, money, and the long-form detail on the left; the at-a-glance facts on
 * the right.
 *
 * The split follows how a buyer actually reads a lot: the photo decides whether
 * to keep looking, the bid bar decides whether it is affordable, and the
 * accordion is where someone who is still interested goes digging. Collapsing
 * the long-form sections keeps the modal one screen tall for the majority who
 * only wanted the first two answers.
 */
export function VehicleDetailBody({ vehicle, onPlaceBid }: VehicleDetailBodyProps) {
  const damageCount = vehicle.damage_notes.length;

  return (
    <Grid gap={space.xl} rowGap={layout.sectionGap}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <PhotoGallery
          images={vehicle.images}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 5 }}>
        <VehicleFacts vehicle={vehicle} />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 7 }}>

        {/* `multiple`: these sections answer different questions, so opening
            the spec sheet should not collapse the condition report. All start
            closed — the modal opens at one screen, and what a buyer reads
            first is their choice rather than ours. */}
        <Accordion variant="separated" multiple>
          <Accordion.Item value="specifications">
            <Accordion.Control>Specifications</Accordion.Control>
            <Accordion.Panel>
              <SpecList
                items={[
                  { label: 'Year', value: vehicle.year },
                  { label: 'Make', value: vehicle.make },
                  { label: 'Model', value: vehicle.model },
                  { label: 'Trim', value: vehicle.trim },
                  { label: 'Body style', value: vehicle.body_style },
                  { label: 'Engine', value: vehicle.engine },
                  { label: 'Transmission', value: vehicle.transmission },
                  { label: 'Drivetrain', value: vehicle.drivetrain },
                  { label: 'Fuel type', value: vehicle.fuel_type },
                  {
                    label: 'Odometer',
                    value: formatOdometer(vehicle.odometer_km),
                    mono: true,
                  },
                  { label: 'Exterior colour', value: vehicle.exterior_color },
                  { label: 'Interior colour', value: vehicle.interior_color },
                ]}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="condition">
            <Accordion.Control>
              <Group gap={layout.inlineGap} align="center" wrap="nowrap">
                <Text span>Condition report</Text>
                <ConditionGrade grade={vehicle.condition_grade} />
                <TitleBadge status={vehicle.title_status} />
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Text fz="sm">{vehicle.condition_report}</Text>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="damage">
            <Accordion.Control>
              <Text span>Damage</Text>{' '}
              <Badge size="sm" variant="default">
                {damageCount === 0 ? 'None reported' : damageCount}
              </Badge>
            </Accordion.Control>
            <Accordion.Panel>
              {damageCount === 0 ? (
                <Text fz="sm" c="dimmed">
                  No damage reported on this vehicle.
                </Text>
              ) : (
                <List size="sm" spacing={layout.stackGap}>
                  {vehicle.damage_notes.map((note) => (
                    <List.Item key={note}>{note}</List.Item>
                  ))}
                </List>
              )}
            </Accordion.Panel>
          </Accordion.Item>

      </Accordion>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 5 }}>
        <BidBar vehicle={vehicle} onPlaceBid={onPlaceBid} />
      </Grid.Col>
    </Grid>
  );
}





