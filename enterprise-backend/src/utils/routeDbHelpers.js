function q(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function querySafe(db, text, params = []) {
  try {
    return await db.query(text, params);
  } catch (error) {
    return { rows: [], error };
  }
}

async function tableExists(db, tableName) {
  const result = await querySafe(
    db,
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName]
  );

  if (result.error) return false;
  return Boolean(result.rows?.[0]?.exists);
}

async function getColumns(db, tableName) {
  const result = await querySafe(
    db,
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  if (result.error) return [];
  return result.rows.map((row) => row.column_name);
}

function firstExisting(columns, candidates) {
  return candidates.find((name) => columns.includes(name)) || null;
}

function textExpr(alias, column, outAlias) {
  if (!column) return `NULL AS ${q(outAlias)}`;
  return `${alias}.${q(column)}::text AS ${q(outAlias)}`;
}

function safeJoinOn(leftAlias, leftColumn, rightAlias, rightColumn) {
  return `${leftAlias}.${q(leftColumn)}::text = ${rightAlias}.${q(rightColumn)}::text`;
}

module.exports = {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting,
  textExpr,
  safeJoinOn
};