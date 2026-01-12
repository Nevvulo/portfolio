#!/bin/bash
# =============================================================================
# Convex Database Migration Script
# =============================================================================
# Migrates all data from old Convex deployment to new one.
#
# Prerequisites:
#   - Node.js installed
#   - npx available
#   - Access to both old and new Convex projects
#
# Usage:
#   chmod +x scripts/migrate-convex.sh
#   ./scripts/migrate-convex.sh
#
# Environment:
#   After Vercel integration, these are AUTO-SET by Vercel:
#     - CONVEX_DEPLOY_KEY (for deployments)
#     - NEXT_PUBLIC_CONVEX_URL (public client URL)
#
#   You may need to set these locally for the migration:
#     - OLD_CONVEX_URL (your old deployment URL)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Convex Database Migration Script                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Configuration
# =============================================================================

BACKUP_DIR="./convex-migration-backup"
BACKUP_FILE="$BACKUP_DIR/convex-export-$(date +%Y%m%d-%H%M%S).zip"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# =============================================================================
# Step 1: Get old deployment info
# =============================================================================

echo -e "${YELLOW}Step 1: Configure source (old) Convex deployment${NC}"
echo ""

# Check if OLD_CONVEX_URL is set
if [ -z "$OLD_CONVEX_URL" ]; then
    echo "Enter your OLD Convex deployment URL"
    echo "(e.g., https://old-project-123.convex.cloud)"
    read -p "> " OLD_CONVEX_URL
fi

# Extract deployment name from URL
OLD_DEPLOYMENT=$(echo "$OLD_CONVEX_URL" | sed 's|https://||' | sed 's|.convex.cloud||')
echo -e "Old deployment: ${GREEN}$OLD_DEPLOYMENT${NC}"
echo ""

# =============================================================================
# Step 2: Get new deployment info
# =============================================================================

echo -e "${YELLOW}Step 2: Configure target (new) Convex deployment${NC}"
echo ""

# Check if NEXT_PUBLIC_CONVEX_URL is set (from Vercel integration)
if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
    echo "Enter your NEW Convex deployment URL"
    echo "(from Vercel integration or Convex dashboard)"
    read -p "> " NEXT_PUBLIC_CONVEX_URL
fi

NEW_DEPLOYMENT=$(echo "$NEXT_PUBLIC_CONVEX_URL" | sed 's|https://||' | sed 's|.convex.cloud||')
echo -e "New deployment: ${GREEN}$NEW_DEPLOYMENT${NC}"
echo ""

# =============================================================================
# Step 3: Confirm migration
# =============================================================================

echo -e "${YELLOW}Step 3: Confirm migration${NC}"
echo ""
echo -e "  Source: ${RED}$OLD_DEPLOYMENT${NC}"
echo -e "  Target: ${GREEN}$NEW_DEPLOYMENT${NC}"
echo ""
echo -e "${RED}WARNING: This will overwrite data in the target deployment!${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

# =============================================================================
# Step 4: Create backup directory
# =============================================================================

echo ""
echo -e "${YELLOW}Step 4: Creating backup directory${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "Backup directory: ${GREEN}$BACKUP_DIR${NC}"

# =============================================================================
# Step 5: Export from old deployment
# =============================================================================

echo ""
echo -e "${YELLOW}Step 5: Exporting data from old deployment${NC}"
echo "This may take a while depending on data size..."
echo ""

CONVEX_DEPLOYMENT="$OLD_DEPLOYMENT" npx convex export --path "$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Export failed! Backup file not created.${NC}"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "Export complete: ${GREEN}$BACKUP_FILE${NC} (${BACKUP_SIZE})"

# =============================================================================
# Step 6: Deploy schema to new deployment
# =============================================================================

echo ""
echo -e "${YELLOW}Step 6: Deploying schema to new deployment${NC}"
echo ""

CONVEX_DEPLOYMENT="$NEW_DEPLOYMENT" npx convex deploy --yes

echo -e "${GREEN}Schema deployed successfully${NC}"

# =============================================================================
# Step 7: Import data to new deployment
# =============================================================================

echo ""
echo -e "${YELLOW}Step 7: Importing data to new deployment${NC}"
echo "This may take a while depending on data size..."
echo ""

CONVEX_DEPLOYMENT="$NEW_DEPLOYMENT" npx convex import --path "$BACKUP_FILE" --yes

echo -e "${GREEN}Import complete!${NC}"

# =============================================================================
# Step 8: Verify migration
# =============================================================================

echo ""
echo -e "${YELLOW}Step 8: Verification${NC}"
echo ""
echo "Please verify in Convex Dashboard:"
echo "  1. Open https://dashboard.convex.dev"
echo "  2. Select your new project: $NEW_DEPLOYMENT"
echo "  3. Check that tables have data"
echo "  4. Spot-check a few records"
echo ""

# =============================================================================
# Step 9: Update local environment
# =============================================================================

echo -e "${YELLOW}Step 9: Update local environment${NC}"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    # Backup existing .env.local
    cp .env.local ".env.local.backup-$TIMESTAMP"
    echo -e "Backed up .env.local to ${GREEN}.env.local.backup-$TIMESTAMP${NC}"

    # Update NEXT_PUBLIC_CONVEX_URL in .env.local
    if grep -q "NEXT_PUBLIC_CONVEX_URL" .env.local; then
        sed -i.bak "s|NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL|" .env.local
        rm -f .env.local.bak
        echo -e "Updated NEXT_PUBLIC_CONVEX_URL in .env.local"
    else
        echo "NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL" >> .env.local
        echo -e "Added NEXT_PUBLIC_CONVEX_URL to .env.local"
    fi
else
    echo "No .env.local found. Creating one..."
    echo "NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL" > .env.local
fi

# =============================================================================
# Summary
# =============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Migration Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Backup location:${NC} $BACKUP_FILE"
echo -e "  ${BLUE}New deployment:${NC}  $NEW_DEPLOYMENT"
echo -e "  ${BLUE}New URL:${NC}         $NEXT_PUBLIC_CONVEX_URL"
echo ""
echo -e "${YELLOW}Environment Variables (via Vercel Integration):${NC}"
echo "  ✓ CONVEX_DEPLOY_KEY    - Auto-set by Vercel"
echo "  ✓ NEXT_PUBLIC_CONVEX_URL - Auto-set by Vercel"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Verify data in Convex Dashboard"
echo "  2. Test locally: npm run dev"
echo "  3. Deploy to Vercel: vercel --prod (or push to trigger deploy)"
echo ""
echo -e "${YELLOW}Note:${NC} File storage (if used) is NOT included in export."
echo "      You'll need to re-upload files separately."
echo ""
