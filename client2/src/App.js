import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ContextProvider } from 'react-sortly';
import { Redirect, Switch, Route, NavLink as RRNavLink } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';
import { AppContainer, AppFooter, NonFlexBody, AppBody, AppNav, AppColumn2, AppColumn10 } from './containers.js';
import { RulesLogTable } from './RulesLogTable.js';
import Editor from './Editor.js';
import logo from './logo.svg';
import './App.css';

import { render } from 'react-dom';
import { LazyLog, ScrollFollow } from 'react-lazylog';


function LazyLogger() {
    return (
        <NonFlexBody>
            <ScrollFollow
                startFollowing={true}
                render={({ follow, onScroll }) => (
                    <LazyLog url="http://192.168.1.15:4000/api/infinite" stream enableSearch={true} follow={follow} onScroll={onScroll} />
                )}
            />
        </NonFlexBody>);
}

const App = () => {
    return (
        <DndProvider backend={HTML5Backend}>
            <ContextProvider>


                <AppContainer>
                    <Navbar color="silver" light expand="md">
                        <NavbarBrand href="/">Scripts4MQTT</NavbarBrand>
                        <Nav tabs>
                            <NavItem>
                                <NavLink tag={RRNavLink} exact to="/table" activeClassName="active">Table</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={RRNavLink} exact to="/lazy" activeClassName="active">Lazy</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={RRNavLink} exact to="/rules" activeClassName="active">Rules</NavLink>
                            </NavItem>
                        </Nav>
                    </Navbar>

                    <Switch>
                        {/* React Route way of redirecting from / -> /editor */}
                        <Route exact path="/" render={() => (<Redirect to="/table" />)} />
                        <Route path='/table' component={RulesLogTable}></Route>
                        <Route path='/lazy' component={LazyLogger}></Route>
                        <Route path='/rules' component={Editor}></Route>
                    </Switch>

                    <AppFooter>the footer</AppFooter>
                </AppContainer>
            </ContextProvider>
        </DndProvider>

    );
}

export default App;


/*
<AppBody>
                <AppColumn2>small</AppColumn2>
                <AppColumn10>
                    <ScrollFollow
                        startFollowing={true}
                        render={({ follow, onScroll }) => (
                            <LazyLog url="http://192.168.1.15:4000/api/infinite" stream follow={follow} onScroll={onScroll} />
                        )}
                    />



                </AppColumn10>
            </AppBody>
            */