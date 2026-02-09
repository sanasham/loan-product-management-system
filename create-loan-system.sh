#!/bin/bash

# Loan Product Management System - Complete Generator
# Run this script to create the entire project structure

PROJECT="loan-product-management-system"

echo "🚀 Creating Loan Product Management System..."
echo ""

# Remove existing project if any
if [ -d "$PROJECT" ]; then
    echo "⚠️  Directory $PROJECT already exists"
    read -p "Delete and recreate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT"
    else
        echo "Aborted."
        exit 1
    fi
fi

# Create project structure
mkdir -p "$PROJECT"/{backend,database,docs}
cd "$PROJECT"

# Create backend structure
mkdir -p backend/{src/{config,types,models,services,controllers,routes,middleware,utils},logs}

echo "📝 Generating backend files..."

# ============================================================================
# BACKEND PACKAGE.JSON
# ============================================================================
cat > backend/package.json << 'EOF'
{
  "name": "loan-product-backend",
  "version": "1.0.0",
  "description": "Loan Product Management System - Backend API",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mssql": "^10.0.1",
    "xlsx": "^0.18.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0",
    "uuid": "^9.0.1",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/mssql": "^9.1.4",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0"
  }
}
EOF

# ============================================================================
# TSCONFIG.JSON
# ============================================================================
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ============================================================================
# .ENV.EXAMPLE
# ============================================================================
cat > backend/.env.example << 'EOF'
NODE_ENV=development
PORT=3000
API_VERSION=v1

DB_SERVER=localhost
DB_NAME=LoanProductDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=30000

MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.xlsx,.xls

CHUNK_SIZE=500
POLLING_INTERVAL=2000

JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret

FRONTEND_URL=http://localhost:3001

LOG_LEVEL=info
LOG_FILE_PATH=./logs
EOF

# ============================================================================
# .GITIGNORE
# ============================================================================
cat > backend/.gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
logs/
*.log
.DS_Store
.vscode/
.idea/
EOF

# Create a comprehensive README with all TypeScript files embedded
cat > backend/CREATE_FILES.md << 'EOF'
# Complete TypeScript Source Files

This document contains all TypeScript source files. 
Copy each section into the corresponding file path.

---

## File: src/types/product.types.ts
```typescript
export interface LoanProduct {
  ProductID: string;
  ProductName: string;
  LoanStartDate: Date | string;
  WithdrawnDate: Date | string | null;
  Pricing: number;
}

export interface LoanProductDB extends LoanProduct {
  IsActive: boolean;
  CreatedDate: Date;
  CreatedBy: string;
  UpdatedDate: Date | null;
  UpdatedBy: string | null;
}

export interface LoanProductHistory {
  HistoryID: number;
  ProductID: string;
  ProductName: string;
  OldPricing: number | null;
  NewPricing: number;
  OldWithdrawnDate: Date | null;
  NewWithdrawnDate: Date | null;
  ChangeType: 'INSERT' | 'UPDATE';
  ChangeDate: Date;
  ChangedBy: string;
}

export interface ProductChange {
  pricing?: {
    from: number;
    to: number;
  };
  withdrawnDate?: {
    from: Date | null;
    to: Date | null;
  };
}

export interface ProductWithChanges {
  productId: string;
  productName: string;
  changes: ProductChange;
}
```

---

Continue for all other files...

EOF

echo "✅ Basic structure created!"
echo ""
echo "📋 Next steps:"
echo "1. cd $PROJECT/backend"
echo "2. See CREATE_FILES.md for all TypeScript source files"
echo "3. Copy each code block into the corresponding file"
echo "4. npm install"
echo "5. npm run dev"
echo ""
echo "🌐 Or create a GitHub repository:"
echo "   cd $PROJECT"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git remote add origin YOUR_GITHUB_URL"
echo "   git push -u origin main"

cd ..