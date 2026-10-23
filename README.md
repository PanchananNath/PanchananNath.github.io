# Panchanan Nath — portfolio

Personal academic + industry portfolio, built with Jekyll and served by GitHub Pages.
Live at **https://panchanannath.github.io** once deployed.

## Deploy (one time)

1. Create a public repo named exactly **`PanchananNath.github.io`**.
2. Put these files at the repo root and push to `main`.
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. Wait ~1 minute. GitHub builds Jekyll for you; no Actions or local install needed.

Using a different repo name (e.g. `portfolio`)? Set `baseurl: "/portfolio"` in `_config.yml`.

## Updating content — you only edit `_data/`

Every item on the site comes from a YAML file. Add a block, commit, done.
Counters ("16 publications", "1900+ learners", track counts) update automatically.

| File | Controls |
|---|---|
| `_data/profile.yml` | Name, photo, bio, email, profile links, **home-page network map nodes**, research focus, "open to" list |
| `_data/publications.yml` | All papers. `type`: journal / conference / chapter / poster / article. `status`: published / presented / accepted / under-review / upcoming |
| `_data/research.yml` | Sponsored projects, GitHub repos, committees, reviewer roles, supervisors, collaborators |
| `_data/experience.yml` | Timeline. `track: academic` or `industry` sets the colour and filter; `current: true` marks ongoing roles |
| `_data/education.yml` | Degrees |
| `_data/teaching.yml` | Institution → term → courses (`students` is a number; the page adds "+") |
| `_data/mentoring.yml` | Programmes → groups → members |
| `_data/recognitions.yml` | Awards (`featured: true` also shows on home), certifications, memberships |
| `_data/talks.yml` | Invited talks (optional `image:` path) |
| `_data/learning.yml` | Conferences, workshops, trainings, webinars, competitions |
| `_data/skills.yml` | Tool groups on the Experience page |
| `_data/nav.yml` | Top menu order and labels |

### Common edits

**New paper** — add at the top of `_data/publications.yml`:
```yaml
- id: J2
  type: journal
  status: published
  year: 2027
  authors: "Nath, P., & Ghose, M."
  title: "Your title"
  venue: "Journal name, vol(issue), pages. Publisher"
  url: "https://doi.org/..."
  code: "https://github.com/PanchananNath/..."   # optional
```
Your name is bolded automatically (variants listed in `_config.yml → author_aliases`).

**Your photo** — save it as `assets/img/profile.jpg`, then in `profile.yml` set `photo: "/assets/img/profile.jpg"`.

**CV button** — add `assets/cv.pdf` and uncomment `cv:` in `profile.yml`.

**LinkedIn / ORCID** — uncomment the lines at the bottom of `links:` in `profile.yml`.

**Colours** — the tokens at the top of `assets/css/main.css` (`--acad` indigo, `--ind` green).

**New page** — copy `talks.html`, change `title`, `permalink`, the content, and add it to `_data/nav.yml`.

## Preview locally (optional)

```bash
bundle install
bundle exec jekyll serve
# open http://localhost:4000
```

## Structure

```
_config.yml          site settings
_data/               ALL content (edit here)
_layouts/            default + page shells
_includes/           header, footer, publication row, person card, icons
assets/css/main.css  theme
assets/js/main.js    network map, filters, theme toggle (no dependencies)
assets/fonts/        self-hosted Bricolage Grotesque + Literata (SIL OFL)
*.html               one file per page
```
