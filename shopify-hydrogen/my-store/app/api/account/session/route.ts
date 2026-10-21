import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {
  CUSTOMER_TOKEN_COOKIE,
  CUSTOMER_TOKEN_MAX_AGE,
  loginCustomer,
  logoutCustomer,
  recoverCustomer,
  registerCustomer,
} from "@/lib/customer";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ok: false, error: message}, {status});
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body");

    const action = String(body.action || "login");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!EMAIL_PATTERN.test(email)) {
      return jsonError("Enter a valid email address");
    }

    if (action === "recover") {
      await recoverCustomer(email);
      return NextResponse.json({
        ok: true,
        message:
          "If that email is registered we have sent a password reset link.",
      });
    }

    if (action === "register") {
      const firstName = String(body.firstName || "").trim();
      const lastName = String(body.lastName || "").trim();

      if (!firstName || !lastName) {
        return jsonError("Enter your first and last name");
      }
      if (password.length < 8) {
        return jsonError("Choose a password with at least 8 characters");
      }

      const created = await registerCustomer({email, password, firstName, lastName});
      if (!created.ok) return jsonError(created.error, 409);
    }

    if (!password) return jsonError("Enter your password");

    const result = await loginCustomer(email, password);
    if (!result.ok) return jsonError(result.error, 401);

    const cookieStore = await cookies();
    cookieStore.set({
      name: CUSTOMER_TOKEN_COOKIE,
      value: result.accessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CUSTOMER_TOKEN_MAX_AGE,
    });

    return NextResponse.json({ok: true, expiresAt: result.expiresAt});
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to sign you in",
      500,
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(CUSTOMER_TOKEN_COOKIE);

    if (existing?.value) {
      await logoutCustomer(existing.value);
    }

    cookieStore.delete(CUSTOMER_TOKEN_COOKIE);
    return NextResponse.json({ok: true});
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to sign you out",
      500,
    );
  }
}
