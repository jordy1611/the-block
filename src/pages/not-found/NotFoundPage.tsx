import { Button } from '@mantine/core';
import { Link } from 'react-router';

import { EmptyState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/layout/PageContainer';

export function NotFoundPage() {
  return (
    <PageContainer>
      <EmptyState
        title="Page not found"
        description="That URL does not match anything in this prototype."
        action={
          <Button component={Link} to="/">
            Back to inventory
          </Button>
        }
      />
    </PageContainer>
  );
}
