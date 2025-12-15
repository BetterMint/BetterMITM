import React, { useEffect, useState } from "react";
import classnames from "classnames";
import FileMenu from "./Header/FileMenu";
import ConnectionIndicator from "./Header/ConnectionIndicator";
import HideInStatic from "./common/HideInStatic";
import CaptureMenu from "./Header/CaptureMenu";
import { useAppDispatch, useAppSelector } from "../ducks";
import FlowListMenu from "./Header/FlowListMenu";
import OptionMenu from "./Header/OptionMenu";
import FlowMenu from "./Header/FlowMenu";
import AnalyticsMenu from "./Header/AnalyticsMenu";
import ToolsMenu from "./Header/ToolsMenu";
import TransformersMenu from "./Header/TransformersMenu";
import ScriptsMenu from "./Header/ScriptsMenu";
import SecurityMenu from "./Header/SecurityMenu";
import MockMenu from "./Header/MockMenu";
import TestingMenu from "./Header/TestingMenu";
import DashboardMenu from "./Header/DashboardMenu";
import RequestBuilderMenu from "./Header/RequestBuilderMenu";
import RulesMenu from "./Header/RulesMenu";
import HelpMenu from "./Header/HelpMenu";
import { Menu } from "./ProxyApp";
import { Tab, setCurrent } from "../ducks/ui/tabs";

const tabs: { [key in Tab]: Menu } = {
    [Tab.Capture]: CaptureMenu,
    [Tab.FlowList]: FlowListMenu,
    [Tab.Options]: OptionMenu,
    [Tab.Flow]: FlowMenu,
    [Tab.Analytics]: AnalyticsMenu,
    [Tab.Tools]: ToolsMenu,
    [Tab.Transformers]: TransformersMenu,
    [Tab.Scripts]: ScriptsMenu,
    [Tab.Security]: SecurityMenu,
    [Tab.Mock]: MockMenu,
    [Tab.Testing]: TestingMenu,
    [Tab.Dashboard]: DashboardMenu,
    [Tab.RequestBuilder]: RequestBuilderMenu,
    [Tab.Rules]: RulesMenu,
    [Tab.Help]: HelpMenu,
};

export default function Header() {
    const dispatch = useAppDispatch();
    const currentTab = useAppSelector((state) => state.ui.tabs.current);
    const selectedFlows = useAppSelector((state) => state.flows.selected);
    const [wasFlowSelected, setWasFlowSelected] = useState(false);

    const entries: Tab[] = [
        Tab.Capture,
        Tab.FlowList,
        Tab.Options,
        Tab.RequestBuilder,
        Tab.Mock,
        Tab.Rules,
        Tab.Analytics,
        Tab.Tools,
        Tab.Transformers,
        Tab.Scripts,
        Tab.Security,
        Tab.Testing,
        Tab.Dashboard,
        Tab.Help,
    ];
    
    if (selectedFlows.length > 0) {
        entries.push(Tab.Flow);
    }

    useEffect(() => {
        if (selectedFlows.length > 0 && !wasFlowSelected) {
            dispatch(setCurrent(Tab.Flow));
            setWasFlowSelected(true);
        } else if (selectedFlows.length === 0) {
            if (wasFlowSelected) {
                setWasFlowSelected(false);
            }
            if (currentTab === Tab.Flow) {
                dispatch(setCurrent(Tab.FlowList));
            }
        }
    }, [selectedFlows, wasFlowSelected, currentTab]);

    function handleClick(tab: Tab, e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        dispatch(setCurrent(tab));
    }

    const ActiveMenu = tabs[currentTab];

    return (
        <header>
            <nav className="nav-tabs nav-tabs-lg">
                <FileMenu />
                {entries.map((tab) => (
                    <a
                        key={tab}
                        href="#"
                        className={classnames({ active: tab === currentTab })}
                        onClick={(e) => handleClick(tab, e)}
                    >
                        {tabs[tab].title}
                    </a>
                ))}
                <HideInStatic>
                    <ConnectionIndicator />
                </HideInStatic>
            </nav>
            <div>
                <ActiveMenu />
            </div>
        </header>
    );
}
