import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getAuthConfig } from "./db";

type TokenPayload = JWTPayload & {
  sub: string;
  refresh?: boolean;
};

export async function createAccessToken(userId: number): Promise<string> {
  const authConfig = getAuthConfig();
  const secret = new TextEncoder().encode(authConfig.secretKey);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${authConfig.accessTokenExpireMinutes}m`)
    .sign(secret);
}

export async function createRefreshToken(userId: number): Promise<string> {
  const authConfig = getAuthConfig();
  const secret = new TextEncoder().encode(authConfig.secretKey);
  return new SignJWT({ refresh: true })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${authConfig.refreshTokenExpireDays}d`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const authConfig = getAuthConfig();
  const secret = new TextEncoder().encode(authConfig.secretKey);
  const { payload } = await jwtVerify(token, secret);
  return payload as TokenPayload;
}
