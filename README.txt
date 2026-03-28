Heartchu v3.2 (Git/CLI-ready)

Important: Netlify Drag-and-Drop is fine for static sites, but AI mode uses a Netlify Function. Per Netlify docs, functions are deployed through continuous deployment with Git, manual deploys with the Netlify CLI, or the Netlify API.

EASIEST PATH: GitHub + Netlify
1. Unzip this folder.
2. Create a new GitHub repo.
3. Upload ALL files from this folder to the repo root.
4. In Netlify: Add new project -> Import an existing project -> GitHub -> pick the repo.
5. Build settings should auto-detect. Publish directory: .   Functions directory: netlify/functions
6. Add environment variable in Netlify:
   ANTHROPIC_API_KEY = your real key
7. Optional model override:
   ANTHROPIC_MODEL = claude-sonnet-4-5-20250929
8. Deploy.

QUICK HEALTH CHECK
After deploy, visit:
/.netlify/functions/generate-quiz?health=1
You should see JSON saying the function is online.

NETLIFY CLI PATH
If you prefer CLI, from this folder run:
  netlify deploy --prod

NOTES
- Classic quiz mode works without AI.
- AI mode now returns clearer error messages.
- The function uses a CommonJS handler for broader compatibility.
