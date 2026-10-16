import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "FolderImageLoader.DynamicSlots",
    async nodeCreated(node) {
        if (node.comfyClass !== "FolderImageSequenceLoader") {
            return;
        }

        const MAX_SLOTS = 32;
        const DEFAULT_SLOTS = 6;

        // 初始化 properties
        node.properties = node.properties || {};

        // 判斷是否為全新建立的節點（全新節點 outputs 會有 1 個 batch + 32 個 image）
        if (node.properties["slots_configured"] === undefined) {
            // 全新建立：將預設 32 個槽位裁切為 6 個 (保留 batch_images + image_1 ~ image_6)
            while (node.outputs && node.outputs.length > DEFAULT_SLOTS + 1) {
                node.removeOutput(node.outputs.length - 1);
            }
            node.properties["slots_configured"] = true;
        }

        // 新增 "+ Add Slot" 按鈕
        node.addWidget("button", "➕ Add Slot", null, () => {
            const currentSlots = node.outputs.filter(o => o.name.startsWith("image_")).length;
            if (currentSlots < MAX_SLOTS) {
                const nextIndex = currentSlots + 1;
                node.addOutput(`image_${nextIndex}`, "IMAGE");
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, true);
            }
        });

        // 新增 "- Remove Slot" 按鈕
        node.addWidget("button", "➖ Remove Slot", null, () => {
            const imageSlotIndices = [];
            for (let i = 0; i < node.outputs.length; i++) {
                if (node.outputs[i].name.startsWith("image_")) {
                    imageSlotIndices.push(i);
                }
            }

            // 至少保留 1 個 image slot
            if (imageSlotIndices.length > 1) {
                const lastIdx = imageSlotIndices[imageSlotIndices.length - 1];
                
                // 如果最後一個插槽有接線，先斷開連接線避免殘留
                if (node.outputs[lastIdx].links && node.outputs[lastIdx].links.length > 0) {
                    for (const linkId of [...node.outputs[lastIdx].links]) {
                        app.graph.removeLink(linkId);
                    }
                }

                node.removeOutput(lastIdx);
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, true);
            }
        });
    }
});