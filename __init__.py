from .folder_image_loader import FolderImageSequenceLoaderJY

NODE_CLASS_MAPPINGS = {
    "FolderImageSequenceLoaderJY": FolderImageSequenceLoaderJY
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FolderImageSequenceLoaderJY": "Load Images from Subfolder (JY)"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
