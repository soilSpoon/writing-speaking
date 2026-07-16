import React from "react";
import type { ReactNode, ReactElement } from "react";

export interface StepProps<T extends string> {
  name: T;
  children: ReactNode;
}

export interface FunnelProps<T extends string> {
  step: T;
  children: ReactNode;
}

export function Step<T extends string>({ children }: StepProps<T>) {
  return <>{children}</>;
}

export function Funnel<T extends string>({ step, children }: FunnelProps<T>) {
  const validChildren = React.Children.toArray(children) as ReactElement<StepProps<T>>[];
  const activeStep = validChildren.find((child) => child.props.name === step);
  return activeStep ? activeStep : null;
}

Funnel.Step = Step;
