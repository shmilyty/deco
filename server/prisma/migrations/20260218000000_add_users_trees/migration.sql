-- CreateTable: User
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "linuxdoId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "trustLevel" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_linuxdoId_key" ON "User"("linuxdoId");

-- CreateTable: Tree
CREATE TABLE "Tree" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My Christmas Tree',
    "ownerId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isAccessible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tree_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Tree_slug_key" ON "Tree"("slug");
CREATE UNIQUE INDEX "Tree_ownerId_key" ON "Tree"("ownerId");

-- Insert legacy user and tree for existing decorations
INSERT INTO "User" ("id", "linuxdoId", "username", "trustLevel", "updatedAt")
VALUES (1, 0, 'legacy', 0, CURRENT_TIMESTAMP);

INSERT INTO "Tree" ("id", "slug", "title", "ownerId")
VALUES (1, 'legacy', 'The Original Tree', 1);

-- SQLite workaround: rebuild Decoration table with treeId foreign key
-- Step 1: Create new table with the full schema
CREATE TABLE "Decoration_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "nickname" TEXT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treeId" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Decoration_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Copy existing data (all go to legacy tree id=1)
INSERT INTO "Decoration_new" ("id", "x", "y", "icon", "nickname", "content", "isPrivate", "images", "createdAt", "treeId")
SELECT "id", "x", "y", "icon", "nickname", "content", "isPrivate", "images", "createdAt", 1
FROM "Decoration";

-- Step 3: Drop old table, rename new
DROP TABLE "Decoration";
ALTER TABLE "Decoration_new" RENAME TO "Decoration";
