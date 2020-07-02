import React from 'react';
import { Redirect, Switch, Route, NavLink as RRNavLink } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';
import { AppContainer, AppFooter, NonFlexBody } from './containers.js';
import { LogTable, SelectColumnFilter } from './LogTable.js';
import Editor from './Editor.js';
import { Aliases } from './Aliases';
import { Config } from './Config';
import './App.css';

import { render } from 'react-dom';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'


/* --------------------------------------------------------------------------------------------------------------
Component that show the server logs with instant updates
-------------------------------------------------------------------------------------------------------------- */

function LazyLogger() {
    return (
        <NonFlexBody>
            <ScrollFollow
                startFollowing={true}
                render={({ follow, onScroll }) => (
                    <LazyLog url="/api/infinite" stream enableSearch={true} follow={follow} onScroll={onScroll} />
                )}
            />
        </NonFlexBody>);
}

/* --------------------------------------------------------------------------------------------------------------
Properties for the different log tables
-------------------------------------------------------------------------------------------------------------- */

// Data store
const dataStoreUrl = '/api/store/';
const dataStoreColumns = [
    {
        Header: 'Topic',
        accessor: 'topic',
        narrow: true,
    },
    {
        Header: 'Value',
        accessor: 'value',
        Cell: row => (
            <span title={row.value}>
                {row.value}
            </span>
        )
    }
];

// Rule Logs
const ruleLogUrl = '/api/logs/rules';
const ruleLogColumns = [
    {
        Header: 'Timestamp',
        accessor: 'timestamp',
        narrow: true,
    },
    {
        Header: 'Rule name',
        accessor: 'ruleName',
        Filter: SelectColumnFilter,
        filter: 'includes',
        narrow: true,
    },
    {
        Header: 'Type',
        accessor: 'type',
        Filter: SelectColumnFilter,
        filter: 'equals',
        narrow: true,
    },
    {
        Header: 'Subtype',
        accessor: 'subtype',
        Filter: SelectColumnFilter,
        filter: 'equals',
        narrow: true,
    },
    {
        Header: 'Old State',
        accessor: 'oldState',
        Filter: SelectColumnFilter,
        filter: 'equals',
        narrow: true,
        Cell: ({ cell }) => {
            return (<div style={{ textAlign: 'center' }}>{cell.value === undefined ? null : cell.value === 'true' ? '1' : '0'}</div>);
        }
    },
    {
        Header: 'State',
        accessor: 'state',
        Filter: SelectColumnFilter,
        filter: 'equals',
        narrow: true,
        Cell: ({ cell }) => {
            return (<div style={{ textAlign: 'center' }}>{cell.value === undefined ? null : cell.value === 'true' ? '1' : '0'}</div>);
        }
    },
    {
        Header: 'Triggered',
        accessor: 'triggered',
        Filter: SelectColumnFilter,
        filter: 'equals',
        narrow: true,
        Cell: ({ cell }) => {
            return (<div style={{ textAlign: 'center' }}>{cell.value === undefined ? null : cell.value === 'true' ? '✅' : '✗'}</div>);
        }
    },
    {
        Header: 'Details',
        accessor: 'details',
        Cell: row => (
            <span title={row.value}>
                {row.value}
            </span>
        )
    }
];

// MQTT logs
const mqttLogUrl = '/api/logs/mqtt';
const mqttLogColumns = [
    {
        Header: 'Timestamp',
        accessor: 'timestamp',
        narrow: true,
    },
    {
        Header: 'Topic',
        accessor: 'topic'
    },
    {
        Header: 'Message',
        accessor: 'msg',
        Cell: row => (
            <span title={row.value}>
                {row.value}
            </span>
        )
    }
];

// Logbook logs
const logBookUrl = '/api/logbook';
const logBookColumns = [
    {
        Header: 'Timestamp',
        accessor: 'timestamp',
        narrow: true
    },
    {
        Header: 'Message',
        accessor: 'message',
        Cell: row => (
            <span title={row.value}>
                {row.value}
            </span>
        )
    }];

const App = () => {

    return (
        <div><ReactNotification />




            <AppContainer>
                <Navbar color="silver" light expand="md">
                    <NavbarBrand href="/">Scripts4MQTT</NavbarBrand>
                    <Nav tabs>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/rules" activeClassName="active">Rules</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/aliases" activeClassName="active">Aliases</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/logbook" activeClassName="active">Log book</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/logs/rules" activeClassName="active">Rule logs</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/logs/mqtt" activeClassName="active">MQTT logs</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/store" activeClassName="active">Data store</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/logs/server" activeClassName="active">Server logs</NavLink>
                        </NavItem>


                        <NavItem>
                            <NavLink tag={RRNavLink} exact to="/config" activeClassName="active">Config</NavLink>
                        </NavItem>
                    </Nav>
                </Navbar>

                <Switch>
                    {/* React Route way of redirecting from / -> /editor */}
                    <Route exact path="/" render={() => (<Redirect to="/rules" />)} />
                    <Route path='/rules' component={Editor}></Route>
                    <Route path='/aliases' component={Aliases}></Route>
                    <Route path='/logbook' render={(props) => (
                        <LogTable {...props} url={logBookUrl} columns={logBookColumns} />
                    )}></Route>
                    <Route path='/logs/rules' render={(props) => (
                        <LogTable {...props} url={ruleLogUrl} columns={ruleLogColumns} />
                    )}></Route>
                    <Route path='/logs/mqtt' render={(props) => (
                        <LogTable {...props} url={mqttLogUrl} columns={mqttLogColumns} />
                    )}></Route>
                    <Route path='/store' render={(props) => (
                        <LogTable {...props} url={dataStoreUrl} columns={dataStoreColumns} />
                    )}></Route>
                    <Route path='/logs/server' component={LazyLogger}></Route>
                    <Route path='/config' component={Config}></Route>
                </Switch>

                <AppFooter>the footer</AppFooter>
            </AppContainer>
        </div>


    );
}

export default App;