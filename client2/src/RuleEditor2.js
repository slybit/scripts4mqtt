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

export const RuleEditor = (props) => {

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
        //const _cache = cache;
        try {
            const response = await axios.get('/api/rule/' + id);
            // update the state
            if (response.data.success) {
                setData({
                    ...data,
                    ...response.data.rule,
                    flatConditions: flattenConditions(response.data.rule.condition),
                });
                cache['namePrev'] = response.data.rule.name;
                cache['nameHasChanged'] = false;
            } else {
                // TODO: alert user, editor is not visible!
                console.log(response.data);
            }
        } catch (e) {
            // TODO: alert user
            console.log(e);
        }
    };

    const updateData = async (itemUpdate, callback) => {
        try {
            const response = await axios.put('/api/rule/' + data.id, itemUpdate)

            if (response.data.success) {
                setData({
                    ...data,
                    ...response.data.rule,
                    flatConditions: flattenConditions(response.data.rule.condition),
                });
                cache['namePrev'] = response.data.rule.name;
                cache['nameHasChanged'] = false;
                if (callback) callback();
            } else {
                // TODO: alert user, editor is not visible!
                console.log(response.data);
            }
        } catch (e) {
            // TODO: alert user
            console.log(e);
        }
    };


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

    // itemName is either
    // - "name"
    // - "description"
    const onEditableItemChange = (e, itemName) => {
        setData(update(data, {
            [itemName]: { $set: e.target.value },
            [itemName+"HasChanged"]: { $set: true }
        }));
    };

    // itemName is either
    // - "name"
    // - "description"
    const handleEditableItemCancelClick = (itemName) => {
        setData(update(data, {
            [itemName]: { $set: cache[itemName+"Prev"] },
            [itemName+"HasChanged"]: { $set: false }
        }));
    };

    // itemName is either
    // - "name"
    // - "description"
    const handleEditableItemSaveClick = (itemName) => {
        updateData({ [itemName]: data[itemName] }, props.refreshNames );
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Sortly functions
    --------------------------------------------------------------------------------------------------------------- */


    const handleEditableItemClick = () => {
        console.log('boom');
    }



    /* -------  Callback methods of ConditionEditor  ------- */

    /*
    itemType: ontrue, onfalse, flatConditions
    subType: either one of the action types or condition types
    */
    const addNewItem = (itemType, subType) => {
        let itemUpdate = undefined;
        if (itemType === 'flatConditions') {
            let newItem = staticData.newItems.condition[subType];
            if (subType === "or")
                newItem = { type: "or", condition: [] };
            else if (subType === "and")
                newItem = { type: "and", condition: [] };
            itemUpdate = { condition: buildTree(stripIds(data.flatConditions)).concat(newItem) };
        } else {
            const newItem = staticData.newItems.action[subType];
            itemUpdate = { [itemType]: stripIds(data[itemType]).concat(newItem) };
        }

        if (itemUpdate) updateData(itemUpdate);


    }



    // UI elements

    const newConditions = Object.keys(staticData.newItems.condition).map((condition) => (
        <DropdownItem key={condition} onClick={() => { addNewItem("flatConditions", condition) }}>{staticData.conditions[condition]}</DropdownItem>
    ));





    return (
        <RightColumn>

            <AppColumn10>
                <FormGroup>
                    <Label for="name">Name</Label>
                    <InputGroup name="name">
                        <Input className="bold_blue" value={data.name || ""} onChange={(e) => onEditableItemChange(e, "name") } />
                        {data.nameHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("name")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("name")} /></Button>
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

                {data.flatConditions.length > 0 && <Sortly
                    items={data.flatConditions}
                    onChange={handleSortlyChange} >
                    {(props) => <ConditionItemRenderer {...props} onEditableItemClick={handleEditableItemClick} />}
                </Sortly>
                }




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




