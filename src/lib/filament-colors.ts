export const FILAMENT_COLORS = [
  { name: "Negro", hex: "#1A1A1A" },
  { name: "Blanco", hex: "#F4F0E6" },
  { name: "Natural", hex: "#E8D5B0" },
  { name: "Rojo", hex: "#C8382D" },
  { name: "Naranja", hex: "#E07A2F" },
  { name: "Amarillo", hex: "#F2B550" },
  { name: "Verde", hex: "#7AA37A" },
  { name: "Azul", hex: "#5B7FB5" },
  { name: "Violeta", hex: "#7A5EA8" },
  { name: "Gris", hex: "#8A8175" },
] as const;

export function hexForFilamentColor(name: string): string {
  const found = FILAMENT_COLORS.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase(),
  );
  return found?.hex ?? "#3B2A22";
}
