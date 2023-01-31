import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "@auth/core/adapters";

import { createId } from "@paralleldrive/cuid2";

export interface D1AdapterOptions {
  collections?: {
    Users?: string;
    Accounts?: string;
    Sessions?: string;
    VerificationTokens?: string;
  };
}

export const defaultCollections: Required<
  Required<D1AdapterOptions>["collections"]
> = {
  Users: "User",
  Accounts: "Account",
  Sessions: "Session",
  VerificationTokens: "VerificationToken",
};
const getType = (obj: object): string => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const format = {
  /** Takes a sqlite object and returns a plain old JavaScript object */
  from<T = Record<string, unknown>>(object: Record<string, unknown>) {
    const newObject: Record<string, unknown> = {};
    for (const key in object) {
      const value = object[key];
      if (typeof value === "string" || value instanceof String) {
        const dateValue = new Date(value.toString());
        if (dateValue.toString() !== "Invalid Date") {
          newObject[key] = dateValue;
        } else {
          newObject[key] = value;
        }
      } else {
        newObject[key] = value;
      }
    }
    return newObject as T;
  },
  /** Takes a plain old JavaScript object and turns it into a sqlite object */
  to<T = Record<string, unknown>>(object: T) {
    let wasObject = true;
    let existingObject: Record<string, unknown> = {};
    if (typeof object !== "object") {
      wasObject = false;
      existingObject = { object };
    } else if (object && Object.keys(object).length !== 0) {
      existingObject = object as Record<string, unknown>;
    }
    const newObject: Record<string, unknown> = {};
    for (const key in existingObject) {
      const value = existingObject[key];
      if (value && typeof value === "object") {
        if ("toISOString" in value && typeof value.toISOString === "function") {
          newObject[key] = value.toISOString();
        } else {
          throw new Error(
            `Unable to convert object to database format: ${key} is an ${getType(
              value
            )}`
          );
        }
      } else {
        newObject[key] = value;
      }
    }
    return (wasObject ? newObject : Object.values(newObject)[0]) as T;
  },
};

export function D1Adapter(
  db: D1Database,
  options: D1AdapterOptions = {}
): Adapter {
  const { collections } = options;

  const c = { ...defaultCollections, ...collections };
  const { from, to } = format;

  const s = {
    createUser: db.prepare(
      `INSERT INTO ${c.Users} (id, name, email, emailVerified, image) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *`
    ),
    getUser: db.prepare(`SELECT * FROM ${c.Users} WHERE id = ?1`),
    getUserByEmail: db.prepare(`SELECT * FROM ${c.Users} WHERE email = ?1`),
    getUserByAccount: db.prepare(
      `SELECT u.* FROM ${c.Users} u INNER JOIN ${c.Accounts} a ON u.id = a.user WHERE a.provider = ?1 AND a.providerAccountId = ?2`
    ),
    updateUser: db.prepare(
      `UPDATE ${c.Users} SET name = ?2, email = ?3, emailVerified = ?4, image = ?5 WHERE id = ?1 RETURNING *`
    ),
    deleteUser: db.prepare(`DELETE FROM ${c.Users} WHERE id = ?1`),
    linkAccount: db.prepare(
      `INSERT INTO ${c.Accounts} (id, user, type, provider, providerAccountId, refresh_token, access_token, expires_in, token_type, scope, id_token, session_state) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12) RETURNING *`
    ),
    unlinkAccount: db.prepare(
      `DELETE FROM ${c.Accounts} WHERE provider = ?1 AND providerAccountId = ?2`
    ),
    createSession: db.prepare(
      `INSERT INTO ${c.Sessions} (id, sessionToken, user, expires) VALUES (?1, ?2, ?3, ?4) RETURNING *`
    ),
    getSession: db.prepare(
      `SELECT * FROM ${c.Sessions} WHERE sessionToken = ?1`
    ),
    updateSession: db.prepare(
      `UPDATE ${c.Sessions} SET user = ?2, expires = ?3 WHERE sessionToken = ?1 RETURNING *`
    ),
    deleteSession: db.prepare(
      `DELETE FROM ${c.Sessions} WHERE sessionToken = ?1`
    ),
    createVerificationToken: db.prepare(
      `INSERT INTO ${c.VerificationTokens} (id, identifier, expires, token) VALUES (?1, ?2, ?3, ?4) RETURNING *`
    ),
    useVerificationToken: db.prepare(
      `DELETE FROM ${c.VerificationTokens} WHERE identifier = ?1 AND token = ?2 RETURNING *`
    ),
  };

  return {
    async createUser(user) {
      user = to(user);
      const newUser = await s.createUser
        .bind(createId(), user.name, user.email, user.emailVerified, user.image)
        .first<Record<string, unknown>>();
      if (!newUser) {
        throw new Error("Unable to create user");
      }
      return from<AdapterUser>(newUser);
    },
    async getUser(id) {
      id = to(id);
      const user = await s.getUser.bind(id).first<Record<string, unknown>>();
      if (!user) return null;
      return from<AdapterUser>(user);
    },
    async getUserByEmail(email) {
      email = to(email);
      const user = await s.getUserByEmail
        .bind(email)
        .first<Record<string, unknown>>();
      if (!user) return null;
      return from<AdapterUser>(user);
    },
    async getUserByAccount(data) {
      const { provider, providerAccountId } = to(data);
      const user = await s.getUserByAccount
        .bind(provider, providerAccountId)
        .first<Record<string, unknown>>();

      if (!user) return null;
      return from<AdapterUser>(user);
    },
    async updateUser(user) {
      user = to(user);
      const updatedUser = await s.updateUser
        .bind(user.id, user.name, user.email, user.emailVerified, user.image)
        .first<Record<string, unknown>>();
      if (!updatedUser) {
        throw new Error("Unable to update user");
      }
      return from<AdapterUser>(updatedUser);
    },
    async deleteUser(userId) {
      userId = to(userId);
      const user = await s.deleteUser.bind(c.Users, userId).run();
      if (user?.error) {
        throw new Error(user.error ?? "Unable to delete user");
      }
    },
    async linkAccount(account) {
      account = to(account);
      // (id, user, type, provider, providerAccountId, refresh_token, access_token, expires_in, token_type, scope, id_token, session_state) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
      const newAccount = await s.linkAccount
        .bind(
          createId(),
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token,
          account.access_token,
          account.expires_in,
          account.token_type,
          account.scope,
          account.id_token,
          account.session_state
        )
        .first<Record<string, unknown>>();
      if (!newAccount) {
        throw new Error("Unable to create account");
      }
      return from<AdapterAccount>(newAccount);
    },
    async unlinkAccount(data) {
      const { provider, providerAccountId } = to(data);
      const account = await s.unlinkAccount
        .bind(provider, providerAccountId)
        .run();
      if (account?.error) {
        throw new Error(account.error ?? "Unable to delete account");
      }
    },
    async createSession(data) {
      const { sessionToken, userId, expires } = to(data);
      // (id, sessionToken, user, expires)
      const newSession = await s.createUser
        .bind(createId(), sessionToken, userId, expires)
        .first<Record<string, unknown>>();
      if (!newSession) {
        throw new Error("Unable to create session");
      }
      return from<AdapterSession>(newSession);
    },
    async getSessionAndUser(sessionToken) {
      sessionToken = to(sessionToken);
      const session = await s.getSession
        .bind(sessionToken)
        .first<Record<string, unknown>>();
      const user = session
        ? await s.getUser.bind(session.userId).first<Record<string, unknown>>()
        : null;
      if (!user) return null;

      return {
        session: from<AdapterSession>(session),
        user: from<AdapterUser>(user),
      };
    },
    async updateSession(session) {
      session = to(session);
      //       `UPDATE ${c.Sessions} SET user = ?2, expires = ?3 WHERE sessionToken = ?1 RETURNING *`
      const updatedSession = await s.updateSession
        .bind(session.sessionToken, session.userId, session.expires)
        .first<Record<string, unknown>>();
      if (!updatedSession) {
        throw new Error("Unable to update session");
      }
      return from<AdapterSession>(updatedSession);
    },
    async deleteSession(sessionToken) {
      sessionToken = to(sessionToken);
      const session = await s.deleteSession.bind(sessionToken).run();
      if (session?.error) {
        throw new Error(session.error ?? "Unable to delete session");
      }
    },
    async createVerificationToken(data) {
      const { identifier, expires, token } = to(data);
      const newToken = await s.createVerificationToken
        .bind(createId(), identifier, expires, token)
        .first<Record<string, unknown>>();
      if (!newToken) {
        throw new Error("Unable to create token");
      }
      return from<VerificationToken>(newToken);
    },
    async useVerificationToken(data) {
      const { identifier, token } = to(data);
      const deletedToken = await s.useVerificationToken
        .bind(identifier, token)
        .first<Record<string, unknown> & { id?: string }>();
      if (!deletedToken) {
        throw new Error("Unable to delete token");
      }

      delete deletedToken.id;

      return from<VerificationToken>(deletedToken);
    },
  };
}
