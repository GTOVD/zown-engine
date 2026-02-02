# Zown Content Pipeline

Semi-automated workflow to generate technical content for the Devlog.

## Workflow

1.  **Research (`research.js`)**
    *   Uses `web_search` (simulated via API or manual input if run by agent) to find trending topics.
    *   Output: `trends.json` containing list of topics with URLs.

2.  **Draft (`draft.js`)**
    *   Reads `trends.json`.
    *   Selects a topic (or accepts an index/topic arg).
    *   Generates a draft post in markdown.
    *   Output: `devlog/drafts/YYYY-MM-DD-topic.md`.

3.  **Publish (Manual/Agent)**
    *   Review draft.
    *   Move to `devlog/posts/`.
    *   Commit and push.

## Usage

```bash
# 1. Find trends
node tools/content-pipeline/research.js "React 19 features"

# 2. Generate draft for topic index 0
node tools/content-pipeline/draft.js 0
```
