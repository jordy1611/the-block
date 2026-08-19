import { describe, expect, it } from 'vitest';

import { SpecList } from '../../../src/components/common/SpecList';
import { renderWithProviders, screen } from '../../support/render';

describe('SpecList', () => {
  it('renders a label above each value', () => {
    renderWithProviders(
      <SpecList
        items={[
          { label: 'Engine', value: '2.5L I4' },
          { label: 'Drivetrain', value: 'AWD' },
          { label: 'VIN', value: '1FTFW1E85MFA10001', mono: true },
        ]}
      />,
    );

    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('2.5L I4')).toBeInTheDocument();
    expect(screen.getByText('Drivetrain')).toBeInTheDocument();
    expect(screen.getByText('AWD')).toBeInTheDocument();
    expect(screen.getByText('1FTFW1E85MFA10001')).toBeInTheDocument();
  });
});
