# advanced-web-dev
- Project Name: TBD

# Beginning Development of Project

- git remote add origin "project_url..."

- git pull origin main into your local branch 
- git checkout main

- cd webdevapp
- npm install
- npm run dev



# Building the installer

The installed app includes its own copy of the solver (Python + OR-Tools packed with PyInstaller), so users don't need Python.

## One-time setup (build computer only)

```
cd webdevadv
python3 -m venv .venv
.venv/bin/pip install -r solver/requirements.txt -r solver/requirements-build.txt
```
On Windows: `py -m venv .venv`, then `.venv\Scripts\pip install -r solver/requirements.txt -r solver/requirements-build.txt`.

## Build on your own computer

```
cd webdevadv
npm run build:mac     # Mac: builds the solver, then the app, then dist/*.dmg
npm run build:win     # Windows: same, makes dist/*-setup.exe
```
PyInstaller only builds for the computer it runs on: an Intel Mac makes an Intel Mac installer, a Windows PC makes a Windows installer.

## Build in the cloud (Windows + Apple Silicon Mac)

GitHub → **Actions** → **Build installers** → **Run workflow**. When it finishes, download the installers from the run's **Artifacts** section.

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
