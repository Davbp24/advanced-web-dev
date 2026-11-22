# PyInstaller recipe: bundles solver.py + Python + ortools into one folder
# that runs without Python installed. Used by `npm run build:solver`.
#
# Output: solver-dist/solver/solver   (solver.exe on Windows)
# One-folder mode (not one-file) so it starts fast every run.
# Don't exclude pandas: ortools imports it on startup.

import os

a = Analysis(
    [os.path.join(SPECPATH, 'solver.py')],
    pathex=[SPECPATH],
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,  # keep libraries in the folder, not inside the program
    name='solver',
    console=True,           # reads JSON from stdin, writes JSON to stdout
    upx=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    name='solver',
    upx=False,
)
