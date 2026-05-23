# URL to QR Code App

Small Python-powered web app for turning a URL into a QR code, choosing the download file name, reusing recent history, and installing the app on mobile or desktop.

It is also ready for GitHub Pages hosting.

## Open in VS Code

Open this folder in VS Code:

`C:\Users\pc\OneDrive\Documents 1\New project`

## Run the app

### Option 1: VS Code task

1. Open Command Palette.
2. Run `Tasks: Run Task`.
3. Choose `Start QR App`.
4. Open `http://localhost:4173`.

### Option 2: terminal

Run the bundled or local Python runtime:

```powershell
python app.py
```

## Share with GitHub Pages

1. Create a new GitHub repository.
2. Upload this project to that repository.
3. Push your files to the `main` branch.
4. Open your repository on GitHub.
5. Go to `Settings` -> `Pages`.
6. Under `Build and deployment`, choose `Deploy from a branch`.
7. Select branch `main` and folder `/ (root)`.
8. Save and wait for GitHub Pages to publish the site.

Your public link will look like:

`https://your-github-username.github.io/your-repository-name/`

## Files

- `index.html` - page structure
- `styles.css` - visual styling
- `script.js` - local browser QR generation, filename handling, history, share, and install flow
- `app.py` - tiny Python static server
- `manifest.webmanifest` - installable app metadata
- `service-worker.js` - cached offline app shell
- `assets/` - icons and placeholder art
- `qr-lib.js` - bundled browser QR library used offline

## Notes

- History is saved in the browser with `localStorage`.
- QR generation now runs locally in the browser, so the installed PWA no longer depends on the Python API after it is cached.
- Start `python app.py` at least once to serve the app locally and let the browser install/cache it.
- The app uses relative paths so it works from a GitHub Pages repository URL, not just from a root domain.
