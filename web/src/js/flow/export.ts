import { copyToClipboard, runCommand } from "../utils";
import { Flow } from "../flow";

export const copy = async (flow: Flow, format: string): Promise<void> => {
    
    
    const formatted = (async () => {
        const ret = await runCommand("export", format, `@${flow.id}`);
        if (ret.value) {
            return ret.value;
        } else if (ret.error) {
            throw ret.error;
        } else {
            throw ret;
        }
    })();
    try {
        await copyToClipboard(formatted);
    } catch (err) {
        alert(err);
    }
};
