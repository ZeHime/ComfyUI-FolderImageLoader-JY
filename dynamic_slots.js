import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "FolderImageLoaderJY.DynamicSlots",
    async nodeCreated(node) {
        if (node.comfyClass !== "FolderImageSequenceLoaderJY") {
            return;
        }

        const MAX_SLOTS = 32;
        const DEFAULT_SLOTS = 6;

        node.properties = node.properties || {};

        if (node.properties["slots_configured"] === undefined) {
            while (node.outputs && node.outputs.length > DEFAULT_SLOTS + 1) {
                node.removeOutput(node.outputs.length - 1);
            }
            node.properties["slots_configured"] = true;
        }

        node.addWidget("button", "➕ Add Slot", null, () => {
            const currentSlots = node.outputs.filter(o => o.name.startsWith("image_")).length;
            if (currentSlots < MAX_SLOTS) {
                const nextIndex = currentSlots + 1;
                node.addOutput(`image_${nextIndex}`, "IMAGE");
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, true);
            }
        });

        node.addWidget("button", "➖ Remove Slot", null, () => {
            const imageSlotIndices = [];
            for (let i = 0; i < node.outputs.length; i++) {
                if (node.outputs[i].name.startsWith("image_")) {
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
                node.setSize(node.computeSize());
                app.graph.setDirtyCanvas(true, true);
            }
        });
    }
});
