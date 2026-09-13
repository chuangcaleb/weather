import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionIcon } from './ConditionIcon';

describe('ConditionIcon', () => {
  it('shows the sun for a clear sky', () => {
    render(<ConditionIcon summary="Clear" />);

    expect(screen.getByRole('img', { name: 'Clear' })).toHaveAttribute(
      'src',
      '/icons/sun.png',
    );
  });

  it('shows the cloud for every other condition group', () => {
    render(<ConditionIcon summary="Rain" />);

    expect(screen.getByRole('img', { name: 'Rain' })).toHaveAttribute(
      'src',
      '/icons/cloud.png',
    );
  });
});
