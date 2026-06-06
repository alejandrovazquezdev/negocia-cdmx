-- NegociaCDMX — seed demo
-- Crea un usuario con negocio + dirección completos para que el demo
-- cargue datos al instante sin pasar por el formulario de registro.
-- Idempotente: usa INSERT … WHERE NOT EXISTS para no chocar con
-- usuarios existentes (la BD ya tiene el del equipo en id=1).

-- Usuario demo (login: demo@negocia.cdmx / demo1234)
INSERT INTO usuarios (nombre, apellido_pat, apellido_mat, telefono, correo, password_hash)
SELECT 'Demo', 'Negocia', 'CDMX', '5555555555', 'demo@negocia.cdmx', 'demo1234'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'demo@negocia.cdmx');

-- Negocio del usuario demo.
-- Lo atamos por subquery al usuario recién creado (o existente con ese correo).
INSERT INTO negocios (
  usuario_id, nombre, tiene_razon_social, razon_social, rfc,
  giro, ramo, cp, calle, colonia
)
SELECT
  u.id,
  'Cafetería La Tostada',
  1,
  'Tostadas del Valle SA de CV',
  'TDV240101AAA',
  'servicios',
  'Alimentos',
  '03100',
  'Avenida Universidad',
  'Del Valle Centro'
FROM usuarios u
WHERE u.correo = 'demo@negocia.cdmx'
  AND NOT EXISTS (
    SELECT 1 FROM negocios n WHERE n.usuario_id = u.id AND n.nombre = 'Cafetería La Tostada'
  );
