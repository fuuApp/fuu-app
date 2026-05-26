#!/bin/bash
# fuu-app sync script
# Run from any location: bash ~/Desktop/fuu-app/sync.sh

SRC="/Users/fields/Library/Application Support/Claude/local-agent-mode-sessions/dd3a5f41-9d4d-4297-8052-fd87e648bcfc/a6ab29b9-b5ee-4db4-b084-588d4d9b7b7b/local_a89232cc-ad52-4bf3-854d-9e40e8e9245c/outputs/fuu-app"
DEST="$HOME/Desktop/fuu-app"

echo "🔄 Syncing fuu-app..."

# Remove old route group folders if present
rm -rf "$DEST/src/app/(app)"
rm -rf "$DEST/src/app/(auth)"

# Create directories
mkdir -p "$DEST/src/app/app/chat/[characterId]"
mkdir -p "$DEST/src/app/login"

# Copy app pages
cp -f "$SRC/src/app/app/page.tsx" "$DEST/src/app/app/page.tsx"
cp -f "$SRC/src/app/app/chat/[characterId]/page.tsx" "$DEST/src/app/app/chat/[characterId]/page.tsx"

# Copy login page
cp -f "$SRC/src/app/(auth)/login/page.tsx" "$DEST/src/app/login/page.tsx"

# Copy other files
cp -f "$SRC/src/app/layout.tsx" "$DEST/src/app/layout.tsx"
cp -f "$SRC/src/app/page.tsx" "$DEST/src/app/page.tsx"
cp -f "$SRC/src/app/globals.css" "$DEST/src/app/globals.css"
cp -f "$SRC/src/app/api/chat/route.ts" "$DEST/src/app/api/chat/route.ts"

# Copy lib and types
mkdir -p "$DEST/src/lib"
mkdir -p "$DEST/src/types"
cp -f "$SRC/src/lib/characters.ts" "$DEST/src/lib/characters.ts"
cp -f "$SRC/src/lib/supabase.ts" "$DEST/src/lib/supabase.ts"
cp -f "$SRC/src/types/index.ts" "$DEST/src/types/index.ts"

echo "✅ Sync complete!"
echo "→ Open http://localhost:3001/app"
