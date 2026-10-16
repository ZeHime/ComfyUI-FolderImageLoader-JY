import os
import re
import torch
import numpy as np
from PIL import Image, ImageOps

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def load_image_to_tensor(image_path):
    img = Image.open(image_path)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")
    image_np = np.array(img).astype(np.float32) / 255.0
    return torch.from_numpy(image_np)[None,]

def create_blank_tensor():
    blank = np.zeros((1, 64, 64, 3), dtype=np.float32)
    return torch.from_numpy(blank)

class FolderImageSequenceLoader:
    MAX_SLOTS = 32  # 後端輸出池上限（提供足夠的插槽給前端動態開關）

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "root_directory": ("STRING", {"default": ""}),
                "subfolder_name": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ("IMAGE",) + tuple("IMAGE" for _ in range(MAX_SLOTS))
    RETURN_NAMES = ("batch_images",) + tuple(f"image_{i+1}" for i in range(MAX_SLOTS))
    FUNCTION = "load_images"
    CATEGORY = "loaders/image"

    def load_images(self, root_directory, subfolder_name):
        target_dir = os.path.join(root_directory.strip(), subfolder_name.strip())
        valid_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
        image_tensors = []

        if os.path.exists(target_dir) and os.path.isdir(target_dir):
            files = [
                f for f in os.listdir(target_dir) 
                if os.path.splitext(f)[1].lower() in valid_extensions
            ]
            files.sort(key=natural_sort_key)

            for f in files[:self.MAX_SLOTS]:
                img_path = os.path.join(target_dir, f)
                try:
                    tensor = load_image_to_tensor(img_path)
                    image_tensors.append(tensor)
                except Exception as e:
                    print(f"[FolderImageLoader] 讀取失敗 {img_path}: {e}")

        if not image_tensors:
            image_tensors = [create_blank_tensor()]

        # 生成 Batch 輸出
        ref_h, ref_w = image_tensors[0].shape[1], image_tensors[0].shape[2]
        aligned_tensors = []
        for t in image_tensors:
            if t.shape[1] != ref_h or t.shape[2] != ref_w:
                pil_t = Image.fromarray((t.squeeze(0).numpy() * 255).astype(np.uint8))
                pil_t = pil_t.resize((ref_w, ref_h), Image.Resampling.BICUBIC)
                aligned_tensors.append(torch.from_numpy(np.array(pil_t).astype(np.float32) / 255.0)[None,])
            else:
                aligned_tensors.append(t)
        batch_tensor = torch.cat(aligned_tensors, dim=0)

        # 填補滿 MAX_SLOTS 個輸出
        slot_outputs = []
        for i in range(self.MAX_SLOTS):
            if i < len(image_tensors):
                slot_outputs.append(image_tensors[i])
            else:
                slot_outputs.append(create_blank_tensor())

        return (batch_tensor, *slot_outputs)
