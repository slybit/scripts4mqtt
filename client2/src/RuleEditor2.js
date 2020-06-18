import React, { useState, useEffect } from "react";

import Sortly, { useDrag, useDrop, useIsClosestDragging, findDescendants } from 'react-sortly';
import { HorizontalContainer, AppColumn10, RightColumn, AppEditor, Header } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input, FormGroup, Label } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline, mdiCancel, mdiCheck } from '@mdi/js'
import update from 'immutability-helper';
//import ReactJson from 'react-json-view';
//import format from 'string-format';
import { addIds, stripIds, flattenConditions, buildTree, staticData, isNewItem } from './utils';
//import { DynamicEditor } from './DynamicEditor'
import axios from 'axios';


const cache = {};

const RuleEditor = (props) => {

    const [data, setData] = useState({
        id: undefined,
        name: "",
        ontrue: [],
        onfalse: [],
        flatConditions: [],
        editorVisible: false
    });



    useEffect(() => {
        fetchData(props.id);
    }, [props]);


    /* ---------------------------------------------------------------------------------------------------------------
    API interactions
    --------------------------------------------------------------------------------------------------------------- */

    const fetchData = async (id) => {
        console.log('fetchData');
        //const _cache = cache;
        try {
            const response = await axios.get('/api/rule/' + id);
            // update the state
            if (response.data.success) {
                setData({
                    ...data,
                    ...response.data.rule,
                    flatConditions: flattenConditions(response.data.rule.condition),
                    ontrue: response.data.rule.ontrue ? addIds(response.data.rule.ontrue) : [],
                    onfalse: response.data.rule.onfalse ? addIds(response.data.rule.onfalse) : [],
                    nameHasChanged: false,
                    descriptionHasChanged: false
                });
                cache['namePrev'] = response.data.rule.name;
                cache['descriptionPrev'] = response.data.rule.name;
            } else {
                // TODO: alert user, editor is not visible!
                console.log(response.data);
            }
        } catch (e) {
            // TODO: alert user
            console.log(e);
        }
    };


    const pushUpdate = async (itemUpdate, updateFn) => {
        if (itemUpdate) {
            try {
                const response = await axios.put('/api/rule/' + data.id, itemUpdate);
                if (response.data.success) {
                    updateFn(response.data.rule);
                } else {
                    // TODO: alert user, editor is not visible!
                    console.log(response.data);
                }
            } catch (err) {
                console.log(err);
            }
        }
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Sortly functions
    --------------------------------------------------------------------------------------------------------------- */

    const handleSortlyChange = (items) => {
        for (let index = 0; index < items.length; index += 1) {
            if (!(items[index].type === 'or' || items[index].type === 'and') && findDescendants(items, index).length > 0)
                return;
        }
        setData({ ...data, flatConditions: items });
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Inline editor functions for direct editing of items in the Rule View (outside of the dynamic editor)
    --------------------------------------------------------------------------------------------------------------- */

    // called when the user edits the data in the name/description input field
    // itemName is either "name" or "description"
    const onEditableItemChange = (e, itemName) => {
        setData(update(data, {
            [itemName]: { $set: e.target.value },
            [itemName + "HasChanged"]: { $set: true }
        }));
    };

    // called when the user cancels the edit of the name/description input
    // itemName is either "name" or "description"
    const handleEditableItemCancelClick = (itemName) => {
        setData(update(data, {
            [itemName]: { $set: cache[itemName + "Prev"] },
            [itemName + "HasChanged"]: { $set: false }
        }));
    };

    // called when the user commits the edit of the name/description input
    // itemName is either "name" or "description"
    const handleEditableItemSaveClick = (itemName) => {
        // push the update and update the state on success
        pushUpdate({ [itemName]: data[itemName] }, (newdata) => {
            setData(update(data, {
                [itemName + "HasChanged"]: { $set: false },
                [itemName]: { $set: newdata[itemName] }
            }));
            // call the refreshNames function of the parent Editor component to update its list of rules
            if (itemName === 'name') props.refreshNames();
        });
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Sortly functions
    --------------------------------------------------------------------------------------------------------------- */


    const handleEditableItemClick = () => {
        console.log('boom');
    };



    /* -------  Callback methods of ConditionEditor  ------- */

    /*
    itemType: ontrue, onfalse, flatConditions
    subType: either one of the action types or condition types
    */
    const addNewItem = async (itemType, subType) => {
        // build the update and update the state on succes
        let itemUpdate = undefined;

        if (itemType === 'flatConditions') {
            let newItem = staticData.newItems.condition[subType];
            if (subType === "or")
                newItem = { type: "or", condition: [] };
            else if (subType === "and")
                newItem = { type: "and", condition: [] };
            itemUpdate = { condition: buildTree(stripIds(data.flatConditions)).concat(newItem) };
            pushUpdate(itemUpdate, (newdata) => {
                setData(update(data, {
                    condition: { $set: newdata.condition },
                    flatConditions: { $set: flattenConditions(newdata.condition) }
                }));
            });
        } else {
            const newItem = staticData.newItems.action[subType];
            itemUpdate = { [itemType]: stripIds(data[itemType]).concat(newItem) };
            pushUpdate(itemUpdate, (newdata) => {
                setData(update(data, {
                    [itemType]: { $set: newdata[itemType] ? addIds(newdata[itemType]) : [] }
                }));
            });
        }
        //response.data.rule.ontrue ? addIds(response.data.rule.ontrue) : [],
    };



    // UI elements

    const newConditions = Object.keys(staticData.newItems.condition).map((condition) => (
        <DropdownItem key={condition} onClick={() => { addNewItem("flatConditions", condition) }}>{staticData.conditions[condition]}</DropdownItem>
    ));

    const newOntrueActions = Object.keys(staticData.newItems.action).map((action) => (
        <DropdownItem key={action} onClick={() => { addNewItem("ontrue", action) }}>{staticData.actions[action]}</DropdownItem>
    ));

    const newOnfalseActions = Object.keys(staticData.newItems.action).map((action) => (
        <DropdownItem key={action} onClick={() => { addNewItem("onfalse", action) }}>{staticData.actions[action]}</DropdownItem>
    ));



    return (
        <RightColumn>

            <AppColumn10>
                <FormGroup>
                    <Label for="name">Name</Label>
                    <InputGroup name="name">
                        <Input className="bold_blue" value={data.name || ""} onChange={(e) => onEditableItemChange(e, "name")} />
                        {data.nameHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("name")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("name")} /></Button>
                        </InputGroupAddon>}
                    </InputGroup>
                </FormGroup>
                <FormGroup>
                    <Label for="description">Description</Label>
                    <InputGroup name="description">
                        <Input type="textarea" value={data.description} onChange={(e) => onEditableItemChange(e, "description")} />
                        {data.descriptionHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("description")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("description")} /></Button>
                        </InputGroupAddon>}
                    </InputGroup>
                </FormGroup>

                <HorizontalContainer>
                    <Header>Conditions:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add Condition
                            </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem header>Logical</DropdownItem>
                            <DropdownItem onClick={() => { addNewItem("flatConditions", "or") }}>OR</DropdownItem>
                            <DropdownItem onClick={() => { addNewItem("flatConditions", "and") }}>AND</DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem header>Condition</DropdownItem>
                            {newConditions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>

                {
                    data.flatConditions.length > 0 && <Sortly
                        items={data.flatConditions}
                        onChange={handleSortlyChange} >
                        {(props) => <ConditionItemRenderer {...props} onEditableItemClick={handleEditableItemClick} />}
                    </Sortly>
                }

                <HorizontalContainer>
                    <Header>On True:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add OnTrue Action
                            </DropdownToggle>
                        <DropdownMenu>
                            {newOntrueActions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>
                <ul className="list-group">
                    <ActionItemRenderer
                        actions={data.ontrue}
                        type="ontrue"
                        handleEditableItemClick={handleEditableItemClick}
                    />
                </ul>

                <HorizontalContainer>
                    <Header>On False:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add OnFalse Action
                            </DropdownToggle>
                        <DropdownMenu>
                            {newOnfalseActions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>
                <ul className="list-group">
                    <ActionItemRenderer
                        actions={data.onfalse}
                        type="onfalse"
                        handleEditableItemClick={handleEditableItemClick}

                    />
                </ul>




            </AppColumn10>
            <AppColumn10>
                {<pre className='code'>{JSON.stringify(data, undefined, 4)}</pre>}
            </AppColumn10>



        </RightColumn>
    );

}

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */


const itemStyle = {
    border: '1px solid #ccc',
    cursor: 'move',
    padding: 10,
    marginBottom: 4
};

const muteStyle = {
    //opacity: .5,
    boxShadow: '0px 0px 8px #666',
    border: '1px dashed #1976d2',
}

const newStyle = {
    background: '#e8ffbc',
    color: 'green',
    fontWeight: 600,
}

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};



/* --------------------------------------------------------------------------------------------------------------------
  Condition and Action item renderers
-------------------------------------------------------------------------------------------------------------------- */



const ConditionItemRenderer = (props) => {

    const { data, onEditableItemClick } = props;
    const [{ isDragging }, drag] = useDrag({
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const [, drop] = useDrop({
        drop() { console.log('drop') }

    });


    const handleClick = () => {
        onEditableItemClick("conditions", data.index, "flatConditions", staticData.editor.condition[data.type]);
    };

    let label = "";
    let isNew = false;
    switch (data.type) {
        case "and":
            label = "AND"
            break;
        case "or":
            label = "OR";
            break;
        case "mqtt":
            isNew = isNewItem(data, "condition", data.type);
            const { topic } = data;
            label = `MQTT [${topic}]`;
            break;
        case "alias":
            isNew = isNewItem(data, "condition", data.type);
            const { alias } = data;
            label = `ALIAS [${alias}]`;
            break;
        case "cron":
            isNew = isNewItem(data, "condition", data.type);
        default:
            label = staticData.conditions[data.type];
            break;
    }

    if (isNew) {
        label = "* " + label;
    }

    const style = {
        ...itemStyle,
        ...(useIsClosestDragging() || isDragging ? muteStyle : null),
        ...(isNew ? newStyle : null),
        marginLeft: data.depth * 30,
    };

    return (
        <div ref={drop}>
            <div ref={drag} style={style}>{label}
                <span style={pushRightStyle}>
                    <Icon path={mdiPencilOutline} size={1} className="editIcon" onClick={handleClick} />
                </span>
            </div>
        </div>
    );

}


const ActionItemRenderer = (props) => {

    const ontrueActions = props.actions.map((action, index) => {
        const isNew = isNewItem(action, "action", action.type);
        const style = {
            cursor: 'pointer',
            ...(isNew ? newStyle : null)
        };
        return (
            <li className="list-group-item"
                key={action._id} id={action._id}
                style={style}
                onClick={() => props.handleEditableItemClick("actions", index, props.type, staticData.editor.action[action.type])}>
                {isNew ? "* " : ""} {staticData.actions[action.type]}
            </li>
        )
    });

    return ontrueActions;

}



/* --------------------------------------------------------------------------------------------------------------
Memoize our RuleEditor, such as that it does NOT get update anymore, unless we change rule by clicking
another rule in the RuleList (Editor).
-------------------------------------------------------------------------------------------------------------- */

function ruleEditorPropsAreEqual(prevRuleEditor, nextRuleEditor) {
    return prevRuleEditor.id === nextRuleEditor.id;
}

export const MemoizedRuleEditor = React.memo(RuleEditor, ruleEditorPropsAreEqual);




