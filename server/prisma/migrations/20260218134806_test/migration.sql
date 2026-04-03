-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Decoration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "nickname" TEXT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treeId" INTEGER NOT NULL,
    CONSTRAINT "Decoration_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Decoration" ("content", "createdAt", "icon", "id", "images", "isPrivate", "nickname", "treeId", "x", "y") SELECT "content", "createdAt", "icon", "id", "images", "isPrivate", "nickname", "treeId", "x", "y" FROM "Decoration";
DROP TABLE "Decoration";
ALTER TABLE "new_Decoration" RENAME TO "Decoration";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "linuxdoId" INTEGER NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
