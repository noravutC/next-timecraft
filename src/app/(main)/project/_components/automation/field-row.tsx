'use client';

import { Input } from '@/components/ui/input';
import { OptionPicker } from './option-picker';
import type { FieldSpec } from './rule-editor-operations';

/** The values of a trigger, condition or action, with the words between. */
export const FieldRow = ({
  fields,
  onChange,
  disabled = false,
}: {
  fields: FieldSpec[];
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) =>
  fields.map((field) => (
    <span key={field.key} className="contents">
      {field.pre && <span className="text-sm text-ink-muted">{field.pre}</span>}
      {field.text ? (
        <Input
          value={field.value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          aria-label={field.label}
          disabled={disabled}
          maxLength={2000}
          className="h-8 min-w-40 flex-1 text-sm"
        />
      ) : (
        <OptionPicker
          field={field}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabled}
        />
      )}
      {field.post && (
        <span className="text-sm text-ink-muted">{field.post}</span>
      )}
    </span>
  ));
