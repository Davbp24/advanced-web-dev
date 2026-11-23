# advanced-web-dev
- Project Name: TBD

# Beginning Development of Project

- git remote add origin "project_url..."

- git pull origin main into your local branch 
- git checkout main

- cd webdevapp
- npm install
- npm run dev



# Getting the app (installers)

The installed app includes its own copy of the solver (Python + OR-Tools packed with PyInstaller), so users don't need Python.

There are 3 ways to get it. Use the first one unless you have a reason not to.

| Your computer | File to download |
|---|---|
| Windows | `theater-scheduler-<version>-setup.exe` |
| Mac with M1/M2/M3/M4 chip | `theater-scheduler-<version>-arm64.dmg` |
| Mac with Intel chip | `theater-scheduler-<version>-x64.dmg` |

Not sure which Mac you have? Apple menu → **About This Mac** → "Chip" (Apple M…) or "Processor" (Intel).

## 1. Download from Releases (easiest)

On the repo's GitHub page, click **Releases** (right side) → **Theater Scheduler (latest)** → click the file for your computer.

This release updates by itself: every time something is merged into `main`, GitHub builds all 3 installers, checks them, and replaces the files here.

## 2. Download from the latest successful build

1. On GitHub, click the **Actions** tab → **Build installers** (left side).
2. Click the newest run with a green check ✅.
3. Click **Summary** (top left), scroll down to **Artifacts**, and click the one for your computer (`theater-scheduler-windows`, `theater-scheduler-mac-apple-silicon` or `theater-scheduler-mac-intel`).
4. Unzip it. The installer is inside.

No green run? Click **Run workflow** on the same page, wait about 10 minutes, then do steps 2–4. (You must be signed in to GitHub.)

## 3. Build it yourself

### One-time setup (build computer only)

```
cd webdevadv
python3 -m venv .venv
.venv/bin/pip install -r solver/requirements.txt -r solver/requirements-build.txt
```
On Windows: `py -m venv .venv`, then `.venv\Scripts\pip install -r solver/requirements.txt -r solver/requirements-build.txt`.

### Build on your own computer

```
cd webdevadv
npm run build:mac     # Mac: builds the solver, then the app, then dist/*.dmg
npm run build:win     # Windows: same, makes dist/*-setup.exe
```
PyInstaller only builds for the computer it runs on: an Intel Mac makes an Intel Mac installer, an Apple Silicon Mac makes an Apple Silicon one, a Windows PC makes a Windows one.

### Build in the cloud (Windows + both Macs)

GitHub → **Actions** → **Build installers** → **Run workflow**. This is the same build as option 2; when it's run from `main` it also updates the Release in option 1.

## Opening the app the first time

The app isn't signed, so the operating system warns about it once.

- **Mac (macOS 15 Sequoia or newer)**: open the app once and close the warning. Then go to **System Settings** → **Privacy & Security**, scroll down, click **Open Anyway**, and confirm.
- **Mac (older macOS)**: right-click **Theater Scheduler** → **Open** → **Open**.
- **Windows**: on "Windows protected your PC", click **More info** → **Run anyway**.

## Dev mode

`npm run dev` still runs the solver with your own Python (`PYTHON_PATH`, or `python3`), so no build is needed while developing:
```
PYTHON_PATH=.venv/bin/python npm run dev
```
