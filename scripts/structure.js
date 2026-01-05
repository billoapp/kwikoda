// create-structure.js
const fs = require("fs");
const path = require("path");

const structure = {
  "apps/customer/app": [
    "page.tsx",
    "menu/page.tsx",
    "cart/page.tsx",
    "tab/page.tsx",
    "payment/page.tsx",
    "chat/page.tsx",
    "layout.tsx",
  ],
  "apps/customer/components": [],
  "apps/customer/lib": ["supabase.ts"],
  "apps/customer": ["package.json", "vercel.json"],

  "apps/staff/app": [
    "page.tsx",
    "tabs/[id]/page.tsx",
    "reports/page.tsx",
    "menu/page.tsx",
    "settings/page.tsx",
    "layout.tsx",
  ],
  "apps/staff/components": [],
  "apps/staff/lib": ["supabase.ts"],
  "apps/staff": ["package.json", "vercel.json"],

  "packages/shared": ["types.ts", "utils.ts"],
  "packages/database": ["supabase.ts"],

  "api/tabs": ["create.ts", "[id].ts", "close.ts"],
  "api/orders": ["create.ts", "update.ts"],
  "api/payments": ["create.ts"],
  "api/payments/mpesa": ["stk-push.ts", "callback.ts"],
  "api/reports": ["daily.ts", "export.ts"],
  "api/webhooks": ["send.ts"],

  "supabase/migrations": ["001_initial_schema.sql"],
  "supabase": ["config.toml"],

  ".": [".env.example", ".env.local", "package.json", "turbo.json", "README.md"],
};

// Basic boilerplate content by extension
function boilerplate(file) {
  if (file.endsWith(".tsx")) return `// ${file}\nexport default function Page(){ return <div>${file}</div>; }`;
  if (file.endsWith(".ts")) return `// ${file}\nexport const placeholder = true;`;
  if (file.endsWith(".json")) return `{\n  "name": "${file.replace(".json", "")}"\n}`;
  if (file.endsWith(".toml")) return `# ${file}\n[config]\nkey="value"`;
  if (file.endsWith(".sql")) return `-- ${file}\nCREATE TABLE example(id SERIAL PRIMARY KEY);`;
  if (file.endsWith(".md")) return `# ${file}\nDocumentation placeholder`;
  if (file.startsWith(".env")) return `# ${file}\nKEY=value`;
  return `// ${file}\n`;
}

Object.entries(structure).forEach(([folder, files]) => {
  fs.mkdirSync(folder, { recursive: true });
  files.forEach((file) => {
    const filePath = path.join(folder, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, boilerplate(file));
  });
});

console.log("✅ Project structure created!");