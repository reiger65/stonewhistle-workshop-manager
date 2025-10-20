#!/bin/bash

echo "🔍 Extracting files needed for deployment..."

# Create output directory
mkdir -p deployment-files

echo "📁 Extracting key files and folders..."

# Extract shared types (if they exist)
if [ -d "shared" ]; then
    cp -r shared deployment-files/
    echo "✅ Copied: shared/"
fi

# Extract environment files
for env_file in .env .env.local .env.production .env.staging; do
    if [ -f "$env_file" ]; then
        cp "$env_file" deployment-files/
        echo "✅ Copied: $env_file"
    fi
done

# Extract package files
for pkg_file in package.json package-lock.json; do
    if [ -f "$pkg_file" ]; then
        cp "$pkg_file" deployment-files/
        echo "✅ Copied: $pkg_file"
    fi
done

# Extract config files
for config_file in tsconfig.json tailwind.config.ts postcss.config.js vite.config.ts next.config.js nuxt.config.js; do
    if [ -f "$config_file" ]; then
        cp "$config_file" deployment-files/
        echo "✅ Copied: $config_file"
    fi
done

# Extract deployment configs
for deploy_file in railway.json render.yaml fly.toml vercel.json netlify.toml Dockerfile docker-compose.yml; do
    if [ -f "$deploy_file" ]; then
        cp "$deploy_file" deployment-files/
        echo "✅ Copied: $deploy_file"
    fi
done

# Extract database files
if [ -d "prisma" ]; then
    cp -r prisma deployment-files/
    echo "✅ Copied: prisma/"
fi

# Extract any additional server routes
for route_dir in server api routes; do
    if [ -d "$route_dir" ]; then
        cp -r "$route_dir" deployment-files/
        echo "✅ Copied: $route_dir/"
    fi
fi

# Extract public assets
for asset_dir in public static assets; do
    if [ -d "$asset_dir" ]; then
        cp -r "$asset_dir" deployment-files/
        echo "✅ Copied: $asset_dir/"
    fi
fi

# Extract documentation
for doc_file in README.md DEPLOYMENT.md; do
    if [ -f "$doc_file" ]; then
        cp "$doc_file" deployment-files/
        echo "✅ Copied: $doc_file"
    fi
fi

# Extract scripts
if [ -d "scripts" ]; then
    cp -r scripts deployment-files/
    echo "✅ Copied: scripts/"
fi

# Get environment variables
echo "🔧 Extracting environment variables..."
env_vars=$(grep -h "^[A-Z_][A-Z0-9_]*=" .env* 2>/dev/null | cut -d'=' -f1 | sort -u | tr '\n' ' ')
if [ ! -z "$env_vars" ]; then
    echo "Environment variables found: $env_vars"
    echo "$env_vars" > deployment-files/env-variables.txt
fi

# Get database info
echo "🗄️ Checking for database..."
if [ -f "prisma/dev.db" ]; then
    echo "✅ Found database: prisma/dev.db"
    sqlite3 prisma/dev.db ".schema" > deployment-files/database-schema.sql 2>/dev/null && echo "✅ Exported schema"
elif [ -f "dev.db" ]; then
    echo "✅ Found database: dev.db"
    sqlite3 dev.db ".schema" > deployment-files/database-schema.sql 2>/dev/null && echo "✅ Exported schema"
fi

# Create summary
echo "📋 Creating summary..."
echo "Extraction completed at: $(date)" > deployment-files/summary.txt
echo "Files extracted:" >> deployment-files/summary.txt
ls -la deployment-files/ >> deployment-files/summary.txt

# Create zip
echo "📦 Creating deployment package..."
cd deployment-files
zip -r ../deployment-package.zip . > /dev/null 2>&1
cd ..

echo ""
echo "🎉 Extraction complete!"
echo "📁 Files extracted to: deployment-files/"
echo "📦 Package created: deployment-package.zip"
echo ""
echo "📋 Summary:"
ls -la deployment-files/
echo ""
echo "🚀 Ready! Upload deployment-package.zip to your workspace."
