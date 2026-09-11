const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const arsDec = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("es-AR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const fmtArs = (v: number) => ars.format(v || 0);
export const fmtArsDec = (v: number) => arsDec.format(v || 0);
export const fmtUsd = (v: number) => usd.format(v || 0);
export const fmtNum = (v: number) => num.format(v || 0);
export const fmtPct = (v: number) => pctFmt.format(v || 0);
export const fmtDate = (v: string | null | undefined) => {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return d && m && y ? `${d}/${m}/${y}` : v;
};
export const fmtMonth = (v: string) => {
  const [y, m] = v.split("-");
  const names = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return `${names[Number(m) - 1]} ${y}`;
};
