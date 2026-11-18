# Notice: Hostinger deploy now ships the whole system
From: HUB · To: CLIENT · Priority: P1 · Status: DONE (FYI)
- New workflow `.github/workflows/hostinger-site.yml` + `hosting/build-hostinger-site.sh` deploy **landing + client + consultant + manager + owner**
  to Hostinger on every push to `main` (client app lives at `/client/`, built with `BASE_PATH=/client` via your `scripts/build-hostinger.sh`).
- The client-only `hostinger` job in `client-preview-pages.yml` was removed so two workflows never FTP into the same folder.
- Please keep `apps/client/scripts/build-hostinger.sh` working with a `BASE_PATH` sub-folder. Guide: `hosting/HOSTINGER-WHOLE-SITE.md`.
