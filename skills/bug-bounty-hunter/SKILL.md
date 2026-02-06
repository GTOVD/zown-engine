# Bug Bounty Hunter Skill

This skill enables Zown to scan for potential bug bounty opportunities and vulnerabilities in open-source projects.

## Workflow

1.  **Discovery:** Search GitHub/GitLab for projects with active bug bounty programs (e.g., via `security.md` or links to HackerOne/Bugcrowd).
2.  **Scan:** Use `exec` to run lightweight security scanners or manually inspect code for common patterns (OWASP Top 10).
3.  **Report:** If a vulnerability is found, document it and notify Thomas for verification before submission.

## Tools
- `gh` (GitHub CLI)
- `web_search` (Brave Search)
- `grep` / `rg` (Code inspection)
