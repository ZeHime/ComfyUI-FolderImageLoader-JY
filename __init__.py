from .folder_image_loader import FolderImageSequenceLoader

NODE_CLASS_MAPPINGS = {
    "FolderImageSequenceLoader": FolderImageSequenceLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FolderImageSequenceLoader": "ComfyUI-FolderImageLoader-JY"
}

# 宣告 JS 靜態資源目錄（必要，否則前端抓不到腳本）
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
