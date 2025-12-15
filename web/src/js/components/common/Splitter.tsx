import React, { Component } from "react";
import classnames from "classnames";

type SplitterState = {
    applied: boolean;
    startPos: number;
    
    dragPointer: number;
};

type SplitterProps = {
    axis?: string;
    key?: React.Key;
};

export default class Splitter extends Component<SplitterProps, SplitterState> {
    static defaultProps = { axis: "x" };

    declare props: React.ComponentProps<typeof Splitter>;
    state: SplitterState = { applied: false, startPos: 0, dragPointer: 0.1 };
    node = React.createRef<HTMLDivElement>();

    constructor(props: SplitterProps, context?: any) {
        super(props, context);
        this.onLostPointerCapture = this.onLostPointerCapture.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
    }

    onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (this.state.dragPointer !== 0.1) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        const node = this.node.current!;
        const prev = node.previousElementSibling! as HTMLElement;
        const next = node.nextElementSibling! as HTMLElement;
        if (!prev || !next) return;
        
        const startPos = this.props.axis === "x" ? e.clientX : e.clientY;
        
        const startWidth = (prev as any).__splitterStartWidth || prev.offsetWidth || prev.getBoundingClientRect().width;
        (this as React.Component<SplitterProps, SplitterState>).setState({
            startPos: startPos,
            dragPointer: e.pointerId,
            applied: false,
        });
        (prev as any).__splitterStartWidth = startWidth;
        
        
        const handlePointerUp = (event: PointerEvent) => {
            if (event.pointerId === e.pointerId) {
                this.onLostPointerCapture(e.nativeEvent as any);
                document.removeEventListener("pointerup", handlePointerUp);
                document.removeEventListener("pointercancel", handlePointerUp);
            }
        };
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointercancel", handlePointerUp);
    }

    onLostPointerCapture(e: React.PointerEvent<HTMLDivElement>) {
        if (this.state.dragPointer !== e.pointerId) {
            return;
        }
        const node = this.node.current!;
        const prev = node.previousElementSibling! as HTMLElement;
        const next = node.nextElementSibling! as HTMLElement;
        const parent = node.parentElement!;

        if (!prev || !next || !parent) {
            (this as React.Component<SplitterProps, SplitterState>).setState({ dragPointer: 0.1 });
            return;
        }

        node.style.transform = "";
        
        const currentPos = this.props.axis === "x" ? e.clientX : e.clientY;
        const delta = currentPos - this.state.startPos;
        const startWidth = (prev as any).__splitterStartWidth || prev.offsetWidth;
        const newWidth = startWidth + delta;
        
        const parentWidth = parent.offsetWidth;
        const minWidth = 200;
        const maxWidth = parentWidth - 300;
        
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        prev.style.flex = `0 0 ${constrainedWidth}px`;
        prev.style.minWidth = `${constrainedWidth}px`;
        prev.style.maxWidth = `${constrainedWidth}px`;
        next.style.flex = "1 1 auto";

        
        (prev as any).__splitterStartWidth = constrainedWidth;

        (this as React.Component<SplitterProps, SplitterState>).setState({ applied: true, dragPointer: 0.1 });
        this.onResize();
    }

    onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (this.state.dragPointer !== e.pointerId) {
            return;
        }
        const currentPos = this.props.axis === "x" ? e.clientX : e.clientY;
        const delta = currentPos - this.state.startPos;
        this.node.current!.style.transform =
            this.props.axis === "x"
                ? `translateX(${delta}px)`
                : `translateY(${delta}px)`;
    }

    onResize() {
        
        
        window.setTimeout(
            () => window.dispatchEvent(new CustomEvent("resize")),
            1,
        );
    }

    reset(willUnmount) {
        if (!this.state.applied) {
            return;
        }

        if (this.node.current?.previousElementSibling instanceof HTMLElement) {
            this.node.current.previousElementSibling.style.flex = "";
        }
        if (this.node.current?.nextElementSibling instanceof HTMLElement) {
            this.node.current.nextElementSibling.style.flex = "";
        }

        if (!willUnmount) {
            (this as React.Component<SplitterProps, SplitterState>).setState({ applied: false });
        }
        this.onResize();
    }

    componentWillUnmount() {
        this.reset(true);
    }

    render() {
        return (
            <div
                ref={this.node}
                className={classnames(
                    "splitter",
                    this.props.axis === "x" ? "splitter-x" : "splitter-y",
                )}
            >
                <div
                    onLostPointerCapture={this.onLostPointerCapture}
                    onPointerDown={this.onPointerDown}
                    onPointerMove={this.onPointerMove}
                />
            </div>
        );
    }
}
