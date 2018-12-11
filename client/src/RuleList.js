import React from "react";
import { SideNav, Nav } from "react-sidenav";
import styled from "styled-components";
import {
    Title,
    AppContainer as BaseAppContainer,
    ExampleNavigation as Navigation,
    ExampleBody as Body
} from "./containers";

const AppContainer = styled(BaseAppContainer)`
  height: calc(100vh - 40px);
`;

const theme = {
    hoverBgColor: "#f5f5f5",
    selectionColor: "#03A9F4",
    selectionBgColor: "#f5f5f5",
    hoverColor: "#333"
};

export class RuleList extends React.Component {
    state = {selectedPath: this.props.data[0].key };

    onItemSelection = arg => {
        this.setState({ selectedPath: arg.path });
    };

    render() {
        const items = this.props.data.map(rule => (
            <Nav key={rule.key} id={rule.key}>{rule.name}</Nav>
        ));
        return (
            <SideNav
                defaultSelectedPath={this.props.data[0].key}
                theme={theme}
                onItemSelection={this.onItemSelection} >

                {items}
            </SideNav>
        );
    }
}
