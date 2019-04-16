import React, { Component } from 'react';
import { BrowserRouter, Switch, Route, NavLink as RRNavLink } from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { AppContainer } from "./containers";
import Editor from './Editor';
import { LogTable } from './LogTable';

export default class App extends Component {

    render() {
        return (
            <AppContainer>
                <Nav tabs>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/editor" activeClassName="active">Editor</NavLink>
                    </NavItem>
                    <NavItem>
                    <NavLink tag={RRNavLink} exact to="/logs" activeClassName="active">Log Viewer</NavLink>
                    </NavItem>
                </Nav>
                <Switch>
                    <Route path='/editor' component={Editor}></Route>
                    <Route path='/logs' component={LogTable}></Route>
                </Switch>                
            </AppContainer>
        );
    }
}