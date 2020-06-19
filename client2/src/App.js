import React from 'react';
import { Redirect, Switch, Route, NavLink as RRNavLink } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';
import { AppContainer, AppFooter, NonFlexBody, AppBody, AppNav, AppColumn2, AppColumn10 } from './containers.js';
import { RulesLogTable } from './RulesLogTable.js';
import Editor from './Editor.js';
import { Aliases } from './Aliases';
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
                    <NavItem>
                        <NavLink tag={RRNavLink} exact to="/aliases" activeClassName="active">Aliases</NavLink>
                    </NavItem>
                </Nav>
            </Navbar>

            <Switch>
                {/* React Route way of redirecting from / -> /editor */}
                <Route exact path="/" render={() => (<Redirect to="/rules" />)} />
                <Route path='/table' component={RulesLogTable}></Route>
                <Route path='/lazy' component={LazyLogger}></Route>
                <Route path='/rules' component={Editor}></Route>
                <Route path='/aliases' component={Aliases}></Route>
            </Switch>

            <AppFooter>the footer</AppFooter>
        </AppContainer>


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