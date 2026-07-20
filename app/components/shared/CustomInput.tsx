import * as React from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/components/ui/input-group';

export interface CustomInputProps extends React.ComponentProps<'input'> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function CustomInput({ className, startIcon, endIcon, ...props }: CustomInputProps) {
  return (
    <InputGroup className={className}>
      {startIcon && <InputGroupAddon align="inline-start">{startIcon}</InputGroupAddon>}
      <InputGroupInput {...props} />
      {endIcon && <InputGroupAddon align="inline-end">{endIcon}</InputGroupAddon>}
    </InputGroup>
  );
}
