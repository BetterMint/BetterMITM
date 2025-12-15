import * as React from "react";
import { connect, shallowEqual } from "react-redux";
import * as autoscroll from "./helpers/AutoScroll";
import { calcVScroll, VScroll } from "./helpers/VirtualScroll";
import FlowTableHead from "./FlowTable/FlowTableHead";
import FlowRow from "./FlowTable/FlowRow";
import FlowFilters, { FlowFilterState, filterFlows } from "./FlowTable/FlowFilters";
import { Flow } from "../flow";
import { RootState } from "../ducks";

type FlowTableProps = {
    flowView: Flow[];
    rowHeight: number;
    highlightedIds: Set<string>;
    selectedIds: Set<string>;
    onlySelectedId: string | false;
    firstSelectedIndex: number | undefined;
};

type FlowTableState = {
    vScroll: VScroll;
    viewportTop: number;
    flowFilter: FlowFilterState | null;
};

export class PureFlowTable extends React.Component<
    FlowTableProps,
    FlowTableState
> {
    static defaultProps = {
        rowHeight: 32,
    };
    declare props: React.ComponentProps<typeof PureFlowTable>;
    state: FlowTableState = {
        vScroll: calcVScroll(),
        viewportTop: 0,
        flowFilter: null,
    };
    private viewport = React.createRef<HTMLDivElement>();
    private head = React.createRef<HTMLTableSectionElement>();

    constructor(props: FlowTableProps, context?: any) {
        super(props, context);
        this.onViewportUpdate = this.onViewportUpdate.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
    }

    onFilterChange(filter: FlowFilterState) {
        (this as React.Component<FlowTableProps, FlowTableState>).setState({ flowFilter: filter });
    }

    componentDidMount() {
        window.addEventListener("resize", this.onViewportUpdate);
        if (this.viewport.current) {
            this.onViewportUpdate();
        }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.onViewportUpdate);
    }

    getSnapshotBeforeUpdate() {
        return autoscroll.isAtBottom(this.viewport);
    }

    componentDidUpdate(
        prevProps: FlowTableProps,
        prevState: FlowTableState,
        snapshot,
    ) {
        if (snapshot) {
            autoscroll.adjustScrollTop(this.viewport);
        }
        this.onViewportUpdate();

        const { onlySelectedId } = this.props;

        const selectedPotentiallyOffscreenFlow =
            onlySelectedId && onlySelectedId !== prevProps.onlySelectedId;

        if (selectedPotentiallyOffscreenFlow) {
            const { rowHeight, firstSelectedIndex } = this.props;
            const viewport = this.viewport.current!;
            const head = this.head.current;

            const headHeight = head ? head.offsetHeight : 0;

            const rowTop = firstSelectedIndex! * rowHeight + headHeight;
            const rowBottom = rowTop + rowHeight;

            const viewportTop = viewport.scrollTop;
            const viewportHeight = viewport.offsetHeight;

            if (rowTop - headHeight < viewportTop) {
                viewport.scrollTop = rowTop - headHeight;
            } else if (rowBottom > viewportTop + viewportHeight) {
                viewport.scrollTop = rowBottom - viewportHeight;
            }
            this.onViewportUpdate();
        }
    }

    onViewportUpdate() {
        const viewport = this.viewport.current;
        if (!viewport) return;
        
        const viewportTop = viewport.scrollTop || 0;

        const vScroll = calcVScroll({
            viewportTop,
            viewportHeight: viewport.offsetHeight || 0,
            itemCount: this.state.flowFilter
                ? filterFlows(this.props.flowView, this.state.flowFilter).length
                : this.props.flowView.length,
            rowHeight: this.props.rowHeight,
        });

        if (
            this.state.viewportTop !== viewportTop ||
            !shallowEqual(this.state.vScroll, vScroll)
        ) {
            const newViewportTop = Math.min(
                viewportTop,
                vScroll.end * this.props.rowHeight,
            );
            (this as React.Component<FlowTableProps, FlowTableState>).setState({
                vScroll,
                viewportTop: newViewportTop,
            });
        }
    }

    render() {
        const { vScroll, viewportTop, flowFilter } = this.state;
        const { flowView, selectedIds, highlightedIds } = this.props;
        
        const filteredFlows = flowFilter
            ? filterFlows(flowView, flowFilter)
            : flowView;

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <FlowFilters onFilterChange={this.onFilterChange} />
            <div
                className="flow-table"
                onScroll={this.onViewportUpdate}
                ref={this.viewport}
                    style={{ flex: 1, overflow: "auto" }}
            >
                <table>
                    <thead
                        ref={this.head}
                        style={{ transform: `translateY(${viewportTop}px)` }}
                    >
                        <FlowTableHead />
                    </thead>
                    <tbody>
                        <tr style={{ height: vScroll.paddingTop }} />
                        {filteredFlows
                            .slice(vScroll.start, vScroll.end)
                            .map((flow) => (
                                <FlowRow
                                    key={flow.id}
                                    flow={flow}
                                    selected={selectedIds.has(flow.id)}
                                    highlighted={highlightedIds.has(flow.id)}
                                />
                            ))}
                        <tr style={{ height: vScroll.paddingBottom }} />
                    </tbody>
                </table>
                </div>
            </div>
        );
    }
}

export default connect((state: RootState) => ({
    flowView: state.flows.view,
    highlightedIds: state.flows.highlightedIds,
    selectedIds: state.flows.selectedIds,
    onlySelectedId:
        state.flows.selected.length === 1 && state.flows.selected[0].id,
    firstSelectedIndex: state.flows._viewIndex.get(state.flows.selected[0]?.id),
}))(PureFlowTable);
