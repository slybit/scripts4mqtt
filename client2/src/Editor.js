import React, { Component } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ContextProvider } from 'react-sortly';
import { LeftColumn, RightColumn, AppBody, Header, HorizontalContainer, AppColumn10 } from "./containers";
import { Button, Input } from 'reactstrap';
import { staticData, showError } from './utils';
import { RuleList } from './RuleList';
import { RuleEditor } from './RuleEditor2';
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
    Server interaction
    -------------------------------------------------------------------------------------------------- */

    // load the rule list (categories object) from the server
    loadRuleListFromServer = (updatedRule = undefined) => {
        axios.get('/api/rules')
            .then((response) => {
                this.updateRuleList(response.data, updatedRule);
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }


    /* --------------------------------------------------------------------------------------------------
    Rule list management
    -------------------------------------------------------------------------------------------------- */

    // updatedRule = id of the rule that was updated and should be shown in the editor
    updateRuleList(ruleList, updatedRule = undefined) {
        let categories = {};
        for (let rule of ruleList) {
            categories[rule.category] = this.state.categories[rule.category] ? this.state.categories[rule.category] : { isOpen: true };
        }
        if (updatedRule) {
            categories[updatedRule.category].isOpen = true;
            this.setState({
                rules: ruleList,
                categories: categories,
                selectedRule: updatedRule
            });
        } else {
            this.setState({
                rules: ruleList,
                categories: categories
            });
        }
        
        

    }

    updateFilter = (event) => {
        this.setState({
            filter: event.target.value,
        });

        /*
        for (let category of Object.keys(this.state.rules)) {
            this.setState((state) => ({
                rules: update(state.rules, { [category]: { isOpen: { $set: true } } })
            }));
        }
        */
       for (let category in this.state.categories ) {
           this.setState((state) => ({
               categories: update(state.categories, { [category]: { isOpen: { $set: true } } })
           }));
       }
    }


   

    filterList = () => {
        let filter = this.state.filter;
        return this.state.rules.filter(function(item) {
            return item.name.toLowerCase().search(
              filter.toLowerCase()) !== -1;
          });

        
    }




    /* --------------------------------------------------------------------------------------------------
    UI handlers
    -------------------------------------------------------------------------------------------------- */

    handleRuleClick = (key) => {
        this.setState({ selectedRule: key });
    }

    handleCategoryClick = (category) => {
        this.setState({ categories: update(this.state.categories, { [category]: { $toggle: ['isOpen'] } }) });
    }

    handleDeleteRuleClick = (key) => {
        axios.delete('/api/rule/' + key)
            .then((response) => {
                if (response.data.success) {
                    this.loadRuleListFromServer(undefined);
                } else {
                    showError("Deletion not handled by script4mqtt service.", response.data);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }

    handleEnableRuleClick = (key, newEnabledState) => {
        axios.put('/api/rule/' + key, { enabled: newEnabledState })
            .then((response) => {
                // update the state
                if (response.data.success) {
                    this.loadRuleListFromServer(false);
                } else {
                    showError("Rule update not handled by script4mqtt service.", response.data);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                showError("Cannot access the script4mqtt service.", error);
            });
    }

    handleAddRuleClick = () => {
        axios.post('/api/rules', staticData.newItems.rule)
            .then((response) => {
                if (response.data.success) {
                    this.loadRuleListFromServer(response.data.rule);
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
                {this.state.selectedRule && false &&
                    <div id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(this.state.selectedRule) }} />
                }
                {false && this.state.selectedRule &&
                    <DndProvider backend={HTML5Backend}>
                        <ContextProvider>
                            <RuleEditor id={this.state.selectedRule} refreshNames={() => { this.loadRuleListFromServer(this.state.selectedRule) }} />
                        </ContextProvider>
                    </DndProvider>
                }
                <RightColumn> <AppColumn10><pre>{JSON.stringify(this.state, null, 4)}</pre> </AppColumn10></RightColumn>
            </AppBody>
        );
    }
}

export default Editor;
