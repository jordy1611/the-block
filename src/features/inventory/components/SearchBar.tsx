import { Box, CloseButton, TextInput } from '@mantine/core';

import { iconSize, layout } from '../../../styles/layouts';

function SearchIcon() {
  return (
    <Box component="svg" width={iconSize.sm} height={iconSize.sm} viewBox="0 0 24 24" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </g>
    </Box>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Presentational only — the debounce lives in the search pipeline, not here.
 * A component that knows how to draw an input should not also own timing.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <TextInput
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder="Search by year, make, model, trim, lot, or VIN"
      aria-label="Search inventory"
      type="search"
      size="md"
      maw={layout.searchMaxWidth}
      leftSection={<SearchIcon />}
      rightSection={
        value ? (
          <CloseButton
            aria-label="Clear search"
            onClick={() => onChange('')}
            size="sm"
          />
        ) : null
      }
    />
  );
}
