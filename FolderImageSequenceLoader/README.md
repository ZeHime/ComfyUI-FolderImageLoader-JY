# ComfyUI-FolderImageLoader(JY)

## Features
- **Subfolder Image Loading**: Specify `root_directory` and `subfolder_name` to auto-read image sequences.
- **Natural Number Sorting**: Sorts files naturally (e.g. `img2.png` appears before `img10.png`).
- **Dynamic Output Slots**:
  - Click `➕ Add Slot` to increase output slots (up to 32 slots).
  - Click `➖ Remove Slot` to remove output slots.
- **Batch Output**: Exports all read images as a single stacked `IMAGE` batch tensor.
- **Safe Fallback**: Automatically pads empty slots with a blank 64x64 black image to prevent workflow breaks.

## Installation
### Method 1: ComfyUI Manager (Recommended)
Search for `ComfyUI-FolderImageLoader(JY)` in ComfyUI Manager and click **Install**.
