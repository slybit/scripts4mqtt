import React, { Component } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ContextProvider } from 'react-sortly';
import { LeftColumn, AppBody, Header, HorizontalContainer, RightColumnCenter, Logo, SubLogo } from "./containers";
import { Button, Input } from 'reactstrap';
import { staticData, showError } from './utils';
import { RuleList } from './RuleList';
import { MemoizedRuleEditor } from './RuleEditor2';
import axios from 'axios';
import update from 'immutability-helper';


class Editor extends Component {
    constructor() {
        super();
        this.state = {
            rules: [],
            categories: [],
            filter: "",
            selectedRule: undefined
        };
    }

    // load the rule list as soon as the DOM is ready
    componentDidMount() {
        this.loadRuleListFromServer();
    }

    /* --------------------------------------------------------------------------------------------------
    API Server interaction
    -------------------------------------------------------------------------------------------------- */

    // load the rule list (categories object) from the server
    // selectedRule = id of the rule that should be marked as selected after downloading the full list
    loadRuleListFromServer = (selectedRule = false) => {
        axios.get('/api/rules')
            .then((response) => {
                let categories = {};
                for (let rule of response.data) {
                    categories[rule.category] = this.state.categories[rule.category] ? this.state.categories[rule.category] : { isOpen: true };
                }

                this.setState({
                    rules: response.data,
                    categories: categories,
                    selectedRule: selectedRule
                });
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }


    /* --------------------------------------------------------------------------------------------------
    Rule list filtering
    -------------------------------------------------------------------------------------------------- */

    // called in the render function to filter out the rules
    filterList = () => {
        let filter = this.state.filter;
        return this.state.rules.filter(function (item) {
            return item.name.toLowerCase().search(
                filter.toLowerCase()) !== -1;
        });
    }


    /* --------------------------------------------------------------------------------------------------
    UI handlers
    -------------------------------------------------------------------------------------------------- */

    // handling of user entering data in the filter text input box
    updateFilter = (event) => {
        this.setState({
            filter: event.target.value,
        });
        // note to self: calling setState as below (with state as a parameter) ensures that
        // all the setStates will result in an actual update of the state
        for (let category in this.state.categories) {
            this.setState((state) => ({
                categories: update(state.categories, { [category]: { isOpen: { $set: true } } })
            }));
        }
    }

    // called when the user clicks on a rule to select it
    handleRuleClick = (key) => {
        this.setState({ selectedRule: key });
    }

    // called when a user clicks on a category; open/closes the category harmonica
    handleCategoryClick = (category) => {
        this.setState({ categories: update(this.state.categories, { [category]: { $toggle: ['isOpen'] } }) });
    }

    // called when the user clicks the delete icon on a rule
    handleDeleteRuleClick = (key) => {
        axios.delete('/api/rule/' + key)
            .then((response) => {
                if (response.data.success) {
                    this.loadRuleListFromServer(key === this.state.selectedRule ? false : this.state.selectedRule);
                } else {
                    showError("Deletion not handled by script4mqtt service.", response.data);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }

    // called when a user clicks the tickbox to disable/enable a rule
    handleEnableRuleClick = (key, newEnabledState) => {
        axios.put('/api/rule/' + key, { enabled: newEnabledState })
            .then((response) => {
                if (response.data.success) {
                    this.loadRuleListFromServer(this.state.selectedRule);
                } else {
                    showError("Rule update not handled by script4mqtt service.", response.data);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }

    // called when a user clicks the "Add" button; add a rule to the default category
    handleAddRuleClick = () => {
        axios.post('/api/rules', staticData.newItems.rule)
            .then((response) => {
                if (response.data.success) {
                    this.loadRuleListFromServer(response.data.rule.id);
                } else {
                    showError("New rule action not handled by script4mqtt service.", response.data);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }


    /* --------------------------------------------------------------------------------------------------
    Render
    -------------------------------------------------------------------------------------------------- */

    render() {
        return (
            <AppBody>
                <LeftColumn>
                    <HorizontalContainer>
                        <Header>Rules</Header>
                        <Button onClick={this.handleAddRuleClick}>Add</Button>
                    </HorizontalContainer>
                    <Input placeholder="Filter rules..." value={this.state.filter} onChange={this.updateFilter} />
                    <br></br>
                    <RuleList
                        rules={this.filterList()}
                        categories={this.state.categories}
                        selectedRule={this.state.selectedRule}
                        onClick={this.handleRuleClick.bind(this)}
                        onDeleteClick={this.handleDeleteRuleClick}
                        onEnableClick={this.handleEnableRuleClick}
                        onCategoryClick={this.handleCategoryClick}
                    />
                </LeftColumn>

                {this.state.selectedRule &&
                    <DndProvider backend={HTML5Backend}>
                        <ContextProvider>
                            <MemoizedRuleEditor id={this.state.selectedRule} categories={Object.keys(this.state.categories)} refreshNames={() => { this.loadRuleListFromServer(this.state.selectedRule) }} />
                        </ContextProvider>
                    </DndProvider>
                }

                {!this.state.selectedRule && <RightColumnCenter><Logo>Scripts4MQTT</Logo><SubLogo>Automation for MQTT</SubLogo></RightColumnCenter>
                }

            </AppBody>
        );
    }
}

export default Editor;
