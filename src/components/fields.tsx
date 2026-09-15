"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Campos de formulario con label visible y ayuda opcional.
 * defaultValue se normaliza a string estable: Base UI avisa si cambia
 * después de montar (p. ej. number → string, o "" → "1000").
 *
 * Los campos aceptan además `value` + `onValueChange` para los drawers que
 * necesitan reaccionar a lo que se elige (precio sugerido de una venta,
 * precarga desde la receta en Producción). Con `value` el campo pasa a ser
 * controlado; sin él sigue siendo no controlado, como el resto del panel.
 */

type Controlled = {
  value?: string;
  onValueChange?: (value: string) => void;
};

/** Props de un input: controlado si viene `value`, si no con defaultValue. */
function inputMode(
  { value, onValueChange }: Controlled,
  defaultValue: string | number | null | undefined,
) {
  if (value !== undefined) {
    return {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onValueChange?.(e.target.value),
    };
  }
  return { defaultValue: toDefault(defaultValue) };
}

function toDefault(value: string | number | null | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  return String(value);
}

function Wrap({
  label,
  hint,
  htmlFor,
  children,
  span2,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${span2 ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor} className="text-[13px] font-extrabold">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  defaultValue,
  required,
  placeholder,
  span2,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  span2?: boolean;
}) {
  const id = React.useId();
  return (
    <Wrap label={label} hint={hint} htmlFor={id} span2={span2}>
      <Input
        id={id}
        name={name}
        defaultValue={toDefault(defaultValue)}
        required={required}
        placeholder={placeholder}
      />
    </Wrap>
  );
}

export function NumberField({
  name,
  label,
  hint,
  defaultValue,
  required,
  placeholder,
  suffix,
  span2,
  value,
  onValueChange,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  suffix?: string; // ej: "ARS", "%", "g", "h"
  span2?: boolean;
} & Controlled) {
  const id = React.useId();
  return (
    <Wrap label={label} hint={hint} htmlFor={id} span2={span2}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="number"
          step="any"
          {...inputMode({ value, onValueChange }, defaultValue)}
          required={required}
          placeholder={placeholder}
          className={suffix ? "pr-12" : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Wrap>
  );
}

export function DateField({
  name,
  label,
  hint,
  defaultValue,
  required,
  span2,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  required?: boolean;
  span2?: boolean;
}) {
  const id = React.useId();
  return (
    <Wrap label={label} hint={hint} htmlFor={id} span2={span2}>
      <Input
        id={id}
        name={name}
        type="date"
        defaultValue={toDefault(defaultValue)}
        required={required}
      />
    </Wrap>
  );
}

export function SelectField({
  name,
  label,
  hint,
  defaultValue,
  required,
  options,
  placeholder,
  span2,
  value,
  onValueChange,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  span2?: boolean;
} & Controlled) {
  const id = React.useId();
  const mode =
    value !== undefined
      ? {
          value,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            onValueChange?.(e.target.value),
        }
      : { defaultValue: toDefault(defaultValue) ?? "" };
  return (
    <Wrap label={label} hint={hint} htmlFor={id} span2={span2}>
      <select
        id={id}
        name={name}
        required={required}
        {...mode}
        className="h-9 w-full rounded-[10px] border-2 border-border bg-[#FFF7EA] px-3 text-sm font-semibold"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  span2,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={`space-y-1 ${span2 ? "sm:col-span-2" : ""}`}>
      <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] border-2 border-border bg-[#FFF7EA] px-3 text-sm font-bold">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="h-4 w-4 accent-[#C8382D]"
        />
        {label}
      </label>
      {hint && (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
