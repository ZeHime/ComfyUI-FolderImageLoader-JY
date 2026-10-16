import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "FolderImageLoader.DynamicSlots",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "FolderImageSequenceLoader") {
            return;
        }

        const MAX_SLOTS = 32;
        const DEFAULT_SLOTS = 6;

        // 【核心終極修正】
        // LiteGraph 預設的 computeSize 有「只增不減」的特性 (會記住歷史最大高度)。
        // 我們直接攔截並覆寫這個節點的大小計算函數，強制每次計算前將高度重置為 10，
        // 這樣它就永遠只會「完美包覆」當前實際存在的插槽與按鈕，完全不受時間差影響。
        const origComputeSize = nodeType.prototype.computeSize || LiteGraph.LGraphNode.prototype.computeSize;
        nodeType.prototype.computeSize = function (out) {
            if (this.size) {
                this.size[1] = 10; // 強制將高度壓扁
            }
            return origComputeSize.apply(this, arguments);
        };

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
                    
                    // 直接設定大小，已經覆寫過的 computeSize 會確保高度正確
                    node.setSize(node.computeSize());
                    if (node.graph) {
                        node.graph.setDirtyCanvas(true, true);
                    }
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
                    
                    // 直接設定大小
                    node.setSize(node.computeSize());
                    if (node.graph) {
                        node.graph.setDirtyCanvas(true, true);
                    }
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
            
            // 節點剛創建時同步計算大小，無需再依賴 setTimeout
            this.setSize(this.computeSize());
            
            return r;
        };

        // 2. 攔截讀取/重新整理已有工作流事件
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const r = origOnConfigure ? origOnConfigure.apply(this, arguments) : undefined;
            ensureButtons(this);
            
            // 讀取舊存檔時，強制覆蓋掉可能被存進去的錯誤巨大高度
            this.setSize(this.computeSize());
            
            return r;
        };
    }
});
