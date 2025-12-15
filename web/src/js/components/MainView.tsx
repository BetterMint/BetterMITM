import * as React from "react";
import Splitter from "./common/Splitter";
import FlowTable from "./FlowTable";
import FlowView from "./FlowView";
import { useAppSelector } from "../ducks";
import CaptureSetup from "./Modes/CaptureSetup";
import Modes from "./Modes";
import { Tab } from "../ducks/ui/tabs";
import ThemeSelector from "./ThemeSelector";
import RequestBuilder from "./RequestBuilder/RequestBuilder";
import MockResponseCreator from "./Mock/MockResponseCreator";
import AnalyticsDashboard from "./Analytics/AnalyticsDashboard";
import ToolsView from "./Tools/ToolsView";
import TransformersView from "./Transformers/TransformersView";
import ScriptsView from "./Scripts/ScriptsView";
import SecurityView from "./Security/SecurityView";
import TestingView from "./Testing/TestingView";
import DashboardView from "./Dashboard/DashboardView";
import SmartRulesEngine from "./Rules/SmartRulesEngine";
import HelpView from "./Help/HelpView";

export default function MainView() {
    const hasOneFlowSelected = useAppSelector(
        (state) => state.flows.selected.length === 1,
    );
    const hasFlows = useAppSelector((state) => state.flows.list.length > 0);
    const currentTab = useAppSelector((state) => state.ui.tabs.current);

    return (
        <div className="main-view">
            <ThemeSelector />
            {currentTab === Tab.Capture ? (
                <Modes />
            ) : currentTab === Tab.RequestBuilder ? (
                <RequestBuilder />
            ) : currentTab === Tab.Mock ? (
                <MockResponseCreator />
            ) : currentTab === Tab.Analytics ? (
                <AnalyticsDashboard />
            ) : currentTab === Tab.Tools ? (
                <ToolsView />
            ) : currentTab === Tab.Transformers ? (
                <TransformersView />
            ) : currentTab === Tab.Scripts ? (
                <ScriptsView />
            ) : currentTab === Tab.Security ? (
                <SecurityView />
            ) : currentTab === Tab.Testing ? (
                <TestingView />
            ) : currentTab === Tab.Dashboard ? (
                <DashboardView />
            ) : currentTab === Tab.Rules ? (
                <SmartRulesEngine />
            ) : currentTab === Tab.Help ? (
                <HelpView />
            ) : (
                <>
                    {hasFlows ? <FlowTable /> : <CaptureSetup />}
                    {hasOneFlowSelected && (
                        <>
                            <Splitter key="splitter" />
                            <FlowView key="flowDetails" />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
