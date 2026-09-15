-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — comisiones por canal (hallazgo 7 de QA)             ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Los seis canales están en 0, por eso la pantalla de Precios muestra el
-- mismo número para todos y MercadoLibre parece igual de rentable que una
-- venta cara a cara. Esto carga valores de mercado a septiembre de 2026.
--
-- ⚠️ REVISALOS ANTES DE CORRER. Son valores de referencia, no tu contrato:
--    la comisión real depende de tu categoría, del tipo de publicación y de
--    tu reputación. El número exacto lo ves en tu panel de MercadoLibre, en
--    «Costos de venta» de cualquier publicación tuya.
--
-- ── Por qué los porcentajes son más altos de lo que dice la tabla pública
--
-- Las comisiones se publican SIN IVA, y encima se cobra 21%. Si fueras
-- Responsable Inscripto ese IVA sería crédito fiscal y no costaría nada;
-- como Zorvi factura por monotributo (ver settings.monotributo_category),
-- **el IVA es plata que se pierde**. Así que acá va el costo real:
--
--     comisión de tabla × 1,21
--
-- Es la diferencia entre creer que MercadoLibre te cobra 15% y que te cobre
-- 18,15%. Sobre una lámpara de $35.000 son $1.102 por unidad.

begin;

-- ── Directo ──────────────────────────────────────────────────────────
-- Efectivo o transferencia, cara a cara. No hay intermediario.
update channels set commission = 0, fixed_cost = 0
 where name = 'Directo';

-- ── Instagram / WhatsApp ─────────────────────────────────────────────
-- 3,39% + IVA = 4,10%  → Mercado Pago, link de pago con acreditación a 14 días.
-- ⚠️ Si la mayoría te paga por TRANSFERENCIA, poné 0: este número estaría
--    encareciendo tus precios sin motivo.
-- ⚠️ Si necesitás la plata al toque, la acreditación inmediata es
--    6,39% + IVA = 7,73%.
update channels set commission = 0.0410, fixed_cost = 0
 where name = 'Instagram/WhatsApp';

-- ── MercadoLibre ─────────────────────────────────────────────────────
-- 15% + IVA = 18,15%  → categoría Hogar, publicación Clásica.
-- Con publicación Premium (cuotas sin interés) trepa a ~17,5% + IVA ≈ 21,2%.
--
-- fixed_cost = 0 porque el cargo fijo por unidad solo aplica a productos de
-- menos de $33.000, y la LAMP-001 se vende a $35.000. Si publicás algo más
-- barato, ese producto sí paga ~$2.600 + IVA ≈ $3.180 por unidad — y como
-- este campo es por canal y no por producto, ahí conviene revisarlo.
--
-- No incluye el envío. Si ofrecés envío gratis, eso se carga aparte en cada
-- venta (campo «Envío a cargo nuestro»).
update channels set commission = 0.1815, fixed_cost = 0
 where name = 'MercadoLibre';

-- ── Tienda web ───────────────────────────────────────────────────────
-- Mismo Checkout Pro de Mercado Pago que Instagram: 3,39% + IVA = 4,10%.
-- Es el canal que va a usar zorvi-frontend cuando salga a la calle.
update channels set commission = 0.0410, fixed_cost = 0
 where name = 'Tienda web';

-- ── Feria ────────────────────────────────────────────────────────────
-- Efectivo, sin comisión. Pero el stand cuesta: si pagás $50.000 por una
-- feria donde esperás vender 20 lámparas, poné fixed_cost = 2500 y el costo
-- aparece solo en cada venta. Lo dejo en 0 hasta que tengas el dato real.
update channels set commission = 0, fixed_cost = 0
 where name = 'Feria';

-- ── Mayorista ────────────────────────────────────────────────────────
-- No hay comisión: lo que baja el precio es el descuento mayorista, que se
-- configura aparte en Parámetros (settings.wholesale_discount).
update channels set commission = 0, fixed_cost = 0
 where name = 'Mayorista';

commit;

-- ── Verificación ─────────────────────────────────────────────────────
-- select name,
--        round((commission * 100)::numeric, 2) || ' %' as comision,
--        fixed_cost
--   from channels order by id;
--
-- Después abrí /precios en el admin. Ahora los seis canales van a mostrar
-- números distintos, y el margen de cada producto se pinta en ÁMBAR cuando
-- queda por debajo del objetivo. Es muy probable que LAMP-001 en
-- MercadoLibre dé en rojo: a $35.000 con 18,15% de comisión quedan $28.648
-- antes de tocar el costo de fabricarla.
