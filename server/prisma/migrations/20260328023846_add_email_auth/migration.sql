-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "linuxdoId" INTEGER,
    "email" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "verifyTokenExp" DATETIME,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "trustLevel" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "id", "isAdmin", "linuxdoId", "trustLevel", "updatedAt", "username") SELECT "avatarUrl", "createdAt", "id", "isAdmin", "linuxdoId", "trustLevel", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_linuxdoId_key" ON "User"("linuxdoId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_verifyToken_key" ON "User"("verifyToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
