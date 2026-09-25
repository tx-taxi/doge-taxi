# DOGE local review

Candidate URL: http://127.0.0.1:4351 — adapter gateway4351, Angular watch4350. Local router integration: http://127.0.0.1:4340. No production registration or deploy.

From `/home/lukee/dev/doge-taxi`:

```sh
bash scripts/local-start.sh   # foreground supervisor; both children watch source
bash scripts/local-stop.sh    # scoped to this worktree PID files
node hub/build.cjs hub/dist   # rebuild exact native export after frontend changes
```

Both processes are left running; `.local/frontend.log`, `.local/adapter.log`, and PID files are local/ignored. Start exits if4350/4351 already occupied. Dependencies reuse existing LTC node_modules locally. Provider cache and persisted cooldown are `.local/` only; no credentials are committed.

Read `acceptance.md`, `provider-coverage.md`, and root `explorer-manifest.json` for observed/verified/unresolved distinctions. The8screenshot matrix uses captured real provider observations to test UI during quota outage. It does not represent a verified live explorer. Historical inherited review files outside this directory are ancestor provenance, not DOGE evidence.
