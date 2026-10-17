import React from 'react';

type ButtonVariant = 'default' | 'primary' | 'quiet';
type ButtonSize = 'default' | 'small';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Shared button behavior and styling contract for feature components. */
export default class Button extends React.Component<ButtonProps> {
  render(): React.ReactNode {
    const { variant = 'default', size = 'default', children, ...attributes } = this.props;
    const classes = ['button'];
    if (variant !== 'default') classes.push(`button-${variant}`);
    if (size === 'small') classes.push('button-small');

    return <button {...attributes} className={classes.join(' ')}>{children}</button>;
  }
}
