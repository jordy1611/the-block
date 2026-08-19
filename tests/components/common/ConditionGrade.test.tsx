import { describe, expect, it } from 'vitest';

import { ConditionGrade } from '../../../src/components/common/ConditionGrade';
import { renderWithProviders, screen } from '../../support/render';

describe('ConditionGrade', () => {
  it('renders the grade to one decimal, with the scale', () => {
    const { container } = renderWithProviders(<ConditionGrade grade={4} />);

    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(container).toHaveTextContent('4.0 / 5');
  });

  it('drops the denominator when the scale is implied', () => {
    const { container } = renderWithProviders(
      <ConditionGrade grade={3.8} showScale={false} />,
    );

    expect(screen.getByText('3.8')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('/ 5');
  });
});
