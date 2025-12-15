import * as React from "react";

type PopoverProps = React.PropsWithChildren<{
    iconClass: string;
    classname?: string;
    isVisible?: boolean; 
}>;

export function Popover({
    children,
    iconClass,
    classname,
    isVisible,
}: PopoverProps) {
    
    
    
    
    

    const id = React.useId();
    
    
    
    const cssId =
        "--" + [...id].map((c) => c.charCodeAt(0).toString(16)).join("");
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        buttonRef.current!.style.anchorName = cssId;
        popoverRef.current!.style.positionAnchor = cssId;
    }, []);

    
    React.useEffect(() => {
        if (isVisible === true) {
            document.getElementById(id)?.showPopover();
        }
    }, [isVisible]);

    return (
        <div
            className={classname ? `mode-popover ${classname}` : "mode-popover"}
        >
            <button popoverTarget={id} ref={buttonRef}>
                <i className={iconClass} aria-hidden="true"></i>
            </button>
            <div id={id} popover="auto" ref={popoverRef}>
                {children}
            </div>
        </div>
    );
}
