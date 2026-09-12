# social-publish

Automatyczna publikacja zaplanowanych tresci na X (Twitter), Facebook, Instagram i TikTok.

## Jak to dziala

1. Wpisy tworzysz jako pliki JSON w `content/posts/` (patrz `content/posts/example-post.json`).
2. Media (obrazy/wideo) wrzucasz do `content/media/` (do uploadu na X) i/lub podajesz publiczny URL w polu `media.url` (wymagane dla Instagram, Facebook-video i TikTok).
3. GitHub Actions (`.github/workflows/publish.yml`) uruchamia sie co godzine, znajduje wpisy ze statusem `pending` i `publishAt` w przeszlosci, publikuje je na wskazanych platformach i zapisuje wynik z powrotem do pliku (`status`, `results`, `publishedAt`), commitujac zmiane.
4. Mozesz tez uruchomic workflow recznie (`workflow_dispatch`) albo lokalnie: `npm run publish:run`.

## Format wpisu (`content/posts/*.json`)

```json
{
  "id": "unikalny-identyfikator",
  "text": "Tresc posta / opis / tytul (TikTok uzywa tego pola jako title)",
  "media": {
    "type": "none | image | video",
    "path": "nazwa-pliku.jpg",
    "url": "https://przyklad.pl/nazwa-pliku.jpg"
  },
  "platforms": ["twitter", "facebook", "instagram", "tiktok"],
  "publishAt": "2026-09-20T09:00:00Z",
  "status": "pending"
}
```

Wymagania mediow per platforma:
- **X/Twitter** - `media.path` (plik lokalny w `content/media/`) lub brak mediow.
- **Facebook** - `media.url` (opcjonalnie, w przeciwnym razie zwykly post tekstowy).
- **Instagram** - `media.url` jest **wymagany** (Graph API nie wspiera samego tekstu).
- **TikTok** - `media.type: "video"` i `media.url` sa **wymagane**.

## Konfiguracja sekretow

Skopiuj `.env.example` do `.env` (do testow lokalnych) i/lub dodaj te same zmienne jako
GitHub Secrets w repo (Settings -> Secrets and variables -> Actions):

- `TWITTER_APP_KEY`, `TWITTER_APP_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
- `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`
- `TIKTOK_ACCESS_TOKEN`, `TIKTOK_PRIVACY_LEVEL`

Platforma, dla ktorej brakuje zmiennych, jest pomijana z jasnym bledem w logu i w polu
`results` wpisu - nie trzeba konfigurowac wszystkich naraz.

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env   # uzupelnij dane
npm run publish:run
```

## Dodanie kolejnej platformy

Zaimplementuj `PlatformAdapter` (`src/types.ts`) w `src/adapters/`, dodaj instancje do
mapy `adapters` w `src/index.ts` i platforme do typu `Platform`.
