import React, { Component } from "react";
import { fetchApi } from "../../utils";

type FilterDocsProps = {
    selectHandler: (cmd: string) => void;
};

type FilterDocsStates = {
    doc: { commands: string[][] };
};

export default class FilterDocs extends Component<
    FilterDocsProps,
    FilterDocsStates
> {
    declare props: React.ComponentProps<typeof FilterDocs>;
    declare state: FilterDocsStates;
    declare setState: React.Component<FilterDocsProps, FilterDocsStates>['setState'];

    static xhr: Promise<any> | null;
    static doc: { commands: string[][] };

    constructor(props: FilterDocsProps, context?: any) {
        super(props, context);
        this.state = { doc: FilterDocs.doc };
    }

    componentDidMount() {
        if (!FilterDocs.xhr) {
            FilterDocs.xhr = fetchApi("/filter-help").then((response) =>
                response.json(),
            );
            FilterDocs.xhr.catch(() => {
                FilterDocs.xhr = null;
            });
        }
        if (!this.state.doc) {
            FilterDocs.xhr.then((doc) => {
                FilterDocs.doc = doc;
                this.setState({ doc });
            });
        }
    }

    handleDocsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        fetch("/docs.md", { method: "HEAD" })
            .then((response) => {
                if (response.ok) {
                    window.open("/docs.md", "_blank");
                } else {
                    window.open("https://github.com/BetterMint/BetterMITM/blob/main/docs.md", "_blank");
                }
            })
            .catch(() => {
                window.open("https://github.com/BetterMint/BetterMITM/blob/main/docs.md", "_blank");
            });
    };

    render() {
        const { doc } = this.state;
        return !doc ? (
            <i className="fa fa-spinner fa-spin" />
        ) : (
            <table className="table table-condensed">
                <tbody>
                    {doc.commands.map((cmd) => (
                        <tr
                            key={cmd[1]}
                            onClick={() =>
                                this.props.selectHandler(
                                    cmd[0].split(" ")[0] + " ",
                                )
                            }
                        >
                            <td>{cmd[0].replace(" ", "\u00a0")}</td>
                            <td>{cmd[1]}</td>
                        </tr>
                    ))}
                    <tr key="docs-link">
                        <td colSpan={2}>
                            <a
                                href="#"
                                onClick={this.handleDocsClick}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <i className="fa fa-external-link" />
                                &nbsp; BetterMITM docs
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}
