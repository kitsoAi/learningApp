import postgres from "postgres";
let cachedSql: postgres.Sql | null = null;

export function getSql() {
  if (cachedSql) {
    return cachedSql;
  }

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Set POSTGRES_URL, POSTGRES_PRISMA_URL, or DATABASE_URL."
    );
  }

  const useSsl = !/localhost|127\.0\.0\.1/i.test(connectionString);
  cachedSql = postgres(connectionString, {
    max: 1,
    ssl: useSsl ? "require" : undefined,
    prepare: false,
    onnotice: () => {},
  });

  return cachedSql;
}

export function getAuthConfig() {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing required environment variable: SECRET_KEY");
  }

  return {
    secretKey,
    accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30"),
    refreshTokenExpireDays: Number(process.env.REFRESH_TOKEN_EXPIRE_DAYS || "7"),
  };
}

export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
) {
  // The postgres tag function is lazily resolved so build-time env checks do not fail.
  // We keep this wrapper narrow and cast once here rather than duplicating the workaround at each query call.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (getSql() as any)(strings, ...values);
}
