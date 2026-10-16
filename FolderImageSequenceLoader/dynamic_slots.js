import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "FolderImageLoader.DynamicSlots",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "FolderImageSequenceLoader") {
            return;
        }

        const MAX_SLOTS = 32;
        const DEFAULT_SLOTS = 6;

        // 核心修正：用來強制縮小節點高度的函數
        function shrinkNodeHeight(node) {
            // 關鍵：將高度設為 10，迫使 computeSize 重新計算最小所需高度，把下方的空白消除
            node.size[1] = 10; 
            node.setSize(node.computeSize());
            if (node.graph) {
                node.graph.setDirtyCanvas(true, true);
            }
        }

        // 建立或確保按鈕存在
        function ensureButtons(node) {
            node.widgets = node.widgets || [];
            
            if (node.widgets.some(w => w.name === "➕ Add Slot")) {
                return;
            }

            // 新增 "+ Add Slot" 按鈕
            node.addWidget("button", "➕ Add Slot", null, () => {
                const currentSlots = (node.outputs || []).filter(o => o.name && o.name.startsWith("image_")).length;
                if (currentSlots < MAX_SLOTS) {
                    const nextIndex = currentSlots + 1;
                    node.addOutput(`image_${nextIndex}`, "IMAGE");
                    shrinkNodeHeight(node); // 新增插槽後重新計算高度
                }
            });

            // 新增 "- Remove Slot" 按鈕
            node.addWidget("button", "➖ Remove Slot", null, () => {
                const imageSlotIndices = [];
                for (let i = 0; i < (node.outputs || []).length; i++) {
                    if (node.outputs[i].name && node.outputs[i].name.startsWith("image_")) {
                        imageSlotIndices.push(i);
                    }
                }

                if (imageSlotIndices.length > 1) {
                    const lastIdx = imageSlotIndices[imageSlotIndices.length - 1];
                    
                    if (node.outputs[lastIdx].links && node.outputs[lastIdx].links.length > 0) {
                        for (const linkId of [...node.outputs[lastIdx].links]) {
                            app.graph.removeLink(linkId);
                        }
                    }

                    node.removeOutput(lastIdx);
                    shrinkNodeHeight(node); // 移除插槽後強制縮小高度
                }
            });
        }

        // 1. 攔截全新建立節點事件
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const r = origOnNodeCreated ? origOnNodeCreated.apply(this, arguments) : undefined;

            this.properties = this.properties || {};

            if (this.properties["slots_configured"] === undefined) {
                while (this.outputs && this.outputs.length > DEFAULT_SLOTS + 1) {
                    this.removeOutput(this.outputs.length - 1);
                }
                this.properties["slots_configured"] = true;
            }

            ensureButtons(this);
            
            // 延遲一小段時間執行縮放，確保不被 ComfyUI 核心的初始排版計算再次撐大
            setTimeout(() => shrinkNodeHeight(this), 10);
            
            return r;
        };

        // 2. 攔截讀取/重新整理已有工作流事件
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const r = origOnConfigure ? origOnConfigure.apply(this, arguments) : undefined;
            ensureButtons(this);
            
            // 處理讀取舊工作流時，把先前存檔下來的巨大高度給修正回來
            setTimeout(() => shrinkNodeHeight(this), 10);
            
            return r;
        };
    }
});