import React, { Component } from 'react';
import { Redirect, Switch, Route, NavLink as RRNavLink } from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { AppContainer } from "./containers";
import Editor from './Editor';
import { RulesLogTable } from './RulesLogTable';
import { MqttLogTable } from './MqttLogTable';
import { StoreTable } from './StoreTable';
import { Config } from './Config';

export default class App extends Component {

    render() {
        return (
            <AppContainer>
                <Nav tabs>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/editor" activeClassName="active">Editor</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/logs/rules" activeClassName="active">Rules Logs</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/logs/mqtt" activeClassName="active">MQTT Logs</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/store" activeClassName="active">Data Store</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/config" activeClassName="active">Config</NavLink>
                    </NavItem>
                </Nav>
                <Switch>
                    {/* React Route way of redirecting from / -> /editor */}
                    <Route exact path="/" render={() => (<Redirect to="/editor" />)} />
                    <Route path='/editor' component={Editor}></Route>
                    <Route path='/logs/rules' component={RulesLogTable}></Route>
                    <Route path='/logs/mqtt' component={MqttLogTable}></Route>
                    <Route path='/store' component={StoreTable}></Route>
                    <Route path='/config' component={Config}></Route>
                </Switch>
            </AppContainer>
        );
    }
}